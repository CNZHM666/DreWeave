-- 关闭邮件确认功能的SQL脚本
-- 这将允许用户无需邮件验证即可直接登录

-- 1. 更新用户元数据，标记为已验证
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. 注意：Supabase控制台设置
-- 需要在Supabase控制台中手动关闭邮件确认：
-- 1. 登录Supabase控制台
-- 2. 进入 Authentication -> Providers -> Email
-- 3. 关闭 "Confirm email" 选项
-- 4. 保存设置

-- 3. 创建测试账户
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@dreweave.com',
  crypt('test123456', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"is_student": true, "student_id": "TEST001"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 5. 检查测试账户
SELECT 
  email,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'test@dreweave.com';