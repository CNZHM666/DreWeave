-- DREWEAVE邮件系统配置完成后的数据库更新
-- 此脚本用于重新开启邮件确认功能并配置相关设置

-- 1. 更新用户表以支持邮件确认
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ DEFAULT NULL;

-- 2. 创建邮件发送日志表（可选，用于监控）
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL, -- 'confirmation', 'welcome', 'password_reset'
    recipient_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'bounced'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    response_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 添加邮件发送统计表（可选）
CREATE TABLE IF NOT EXISTS email_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. 创建邮件发送函数（用于记录日志）
CREATE OR REPLACE FUNCTION log_email_sent(
    p_user_id UUID,
    p_email_type VARCHAR(50),
    p_recipient_email VARCHAR(255),
    p_status VARCHAR(20) DEFAULT 'sent',
    p_response_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- 插入邮件日志
    INSERT INTO email_logs (user_id, email_type, recipient_email, status, response_message)
    VALUES (p_user_id, p_email_type, p_recipient_email, p_status, p_response_message)
    RETURNING id INTO v_log_id;
    
    -- 更新邮件统计
    INSERT INTO email_stats (user_id, total_sent, last_sent_at)
    VALUES (p_user_id, 1, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_sent = email_stats.total_sent + 1,
        total_delivered = CASE 
            WHEN p_status = 'delivered' THEN email_stats.total_delivered + 1 
            ELSE email_stats.total_delivered 
        END,
        total_failed = CASE 
            WHEN p_status = 'failed' THEN email_stats.total_failed + 1 
            ELSE email_stats.total_failed 
        END,
        last_sent_at = NOW(),
        updated_at = NOW();
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建用户注册触发器（自动记录确认邮件发送）
CREATE OR REPLACE FUNCTION handle_user_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- 记录确认邮件发送
    IF NEW.email_confirmed_at IS NULL THEN
        PERFORM log_email_sent(
            NEW.id,
            'confirmation',
            NEW.email,
            'sent',
            'Registration confirmation email sent'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 创建触发器
DROP TRIGGER IF EXISTS trigger_user_registration ON auth.users;
CREATE TRIGGER trigger_user_registration
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_registration();

-- 7. 授予必要的权限
GRANT SELECT, INSERT, UPDATE ON email_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_stats TO authenticated;
GRANT EXECUTE ON FUNCTION log_email_sent TO authenticated;

-- 8. 创建邮件发送状态查询视图
CREATE OR REPLACE VIEW email_status_view AS
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    COALESCE(es.total_sent, 0) as total_emails_sent,
    COALESCE(es.total_delivered, 0) as total_emails_delivered,
    COALESCE(es.total_failed, 0) as total_emails_failed,
    es.last_sent_at,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL THEN 'confirmed'
        WHEN u.confirmation_sent_at IS NOT NULL THEN 'confirmation_sent'
        ELSE 'pending_confirmation'
    END as email_status
FROM auth.users u
LEFT JOIN email_stats es ON u.id = es.user_id;

-- 9. 添加RLS策略（行级安全）
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_stats ENABLE ROW LEVEL SECURITY;

-- 邮件日志RLS策略
CREATE POLICY "用户只能查看自己的邮件日志" ON email_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的邮件日志" ON email_logs
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- 邮件统计RLS策略
CREATE POLICY "用户只能查看自己的邮件统计" ON email_stats
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的邮件统计" ON email_stats
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- 10. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_stats_user_id ON email_stats(user_id);

-- 11. 插入测试数据（可选）
-- 注意：以下测试数据仅用于演示，实际使用时应删除
/*
INSERT INTO email_logs (user_id, email_type, recipient_email, status, response_message)
SELECT 
    id,
    'confirmation',
    email,
    'delivered',
    'Test confirmation email delivered'
FROM auth.users 
LIMIT 1;
*/

-- 12. 创建邮件发送限制函数（防止滥用）
CREATE OR REPLACE FUNCTION check_email_rate_limit(
    p_user_id UUID,
    p_email_type VARCHAR(50),
    p_time_window INTERVAL DEFAULT '1 hour'::interval
)
RETURNS BOOLEAN AS $$
DECLARE
    v_email_count INTEGER;
    v_rate_limit INTEGER := 5; -- 默认每小时最多5封邮件
BEGIN
    -- 根据邮件类型设置不同的限制
    CASE p_email_type
        WHEN 'confirmation' THEN v_rate_limit := 3;  -- 确认邮件：每小时3封
        WHEN 'password_reset' THEN v_rate_limit := 2; -- 密码重置：每小时2封
        WHEN 'welcome' THEN v_rate_limit := 1;      -- 欢迎邮件：每小时1封
        ELSE v_rate_limit := 5;                     -- 其他邮件：每小时5封
    END CASE;
    
    -- 计算指定时间窗口内的邮件数量
    SELECT COUNT(*) INTO v_email_count
    FROM email_logs
    WHERE user_id = p_user_id 
      AND email_type = p_email_type
      AND sent_at >= NOW() - p_time_window;
    
    -- 返回是否超过限制
    RETURN v_email_count < v_rate_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予函数执行权限
GRANT EXECUTE ON FUNCTION check_email_rate_limit TO authenticated;

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE '🎉 DREWEAVE邮件系统数据库配置完成！';
    RAISE NOTICE '下一步：';
    RAISE NOTICE '1. 在Supabase控制台配置SMTP设置';
    RAISE NOTICE '2. 启用邮件确认功能';
    RAISE NOTICE '3. 测试用户注册流程';
    RAISE NOTICE '4. 验证邮件发送和接收';
END
$$;