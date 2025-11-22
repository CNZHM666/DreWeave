# SendGrid SMTP配置脚本
# 用于Supabase自定义邮件服务配置

# 1. 检查当前邮件配置
SELECT 
  name,
  value,
  description
FROM auth.config 
WHERE name IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name');

# 2. 配置SendGrid SMTP（需要替换为你的实际配置）
-- 注意：以下配置需要你提供实际的API密钥和发件人邮箱

-- SMTP服务器配置
UPDATE auth.config SET value = 'smtp.sendgrid.net' WHERE name = 'smtp_host';
UPDATE auth.config SET value = '587' WHERE name = 'smtp_port';
UPDATE auth.config SET value = 'apikey' WHERE name = 'smtp_user';

-- 注意：smtp_pass 需要设置你的SendGrid API密钥
-- UPDATE auth.config SET value = 'SG.your_api_key_here' WHERE name = 'smtp_pass';

-- 发件人配置（需要替换为你的发件人邮箱）
-- UPDATE auth.config SET value = 'noreply@yourdomain.com' WHERE name = 'smtp_from_email';
-- UPDATE auth.config SET value = 'DREWEAVE 织梦软件' WHERE name = 'smtp_from_name';

# 3. 开启邮件确认功能
UPDATE auth.config SET value = 'true' WHERE name = 'email_confirm_enabled';

# 4. 配置邮件模板
UPDATE auth.config SET value = 'true' WHERE name = 'email_template_enabled';

# 5. 检查更新后的配置
SELECT 
  name,
  value,
  description
FROM auth.config 
WHERE name IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_from_email', 'smtp_from_name', 'email_confirm_enabled');

# 6. 创建邮件发送测试函数
CREATE OR REPLACE FUNCTION test_email_send(
  to_email TEXT,
  subject TEXT,
  body TEXT
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- 这里可以添加邮件发送测试逻辑
  RETURN QUERY
  SELECT true, '邮件发送测试功能已配置';
END;
$$ LANGUAGE plpgsql;

# 7. 配置说明
-- 完成此脚本后，你需要：
-- 1. 提供SendGrid API密钥
-- 2. 提供验证过的发件人邮箱
-- 3. 测试邮件发送功能
-- 4. 验证邮件确认流程

-- 注意：Supabase的SMTP配置需要在控制台手动设置API密钥
-- 或者使用环境变量：SUPABASE_AUTH_SMTP_PASS=your_api_key