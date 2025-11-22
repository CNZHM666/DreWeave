-- 🔧 临时关闭邮件确认功能
-- 这个脚本用于开发阶段，避免触发邮件率限制

-- 查看当前邮件确认设置
SELECT 
  name,
  value,
  default_value,
  description
FROM auth.config 
WHERE name = 'email_confirm';

-- 临时关闭邮件确认（开发环境使用）
-- 注意：生产环境建议保持开启
UPDATE auth.config 
SET value = 'false' 
WHERE name = 'email_confirm';

-- 验证设置已更新
SELECT 
  name,
  value,
  description
FROM auth.config 
WHERE name = 'email_confirm';