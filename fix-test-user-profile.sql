-- 修复登录超时问题：为测试用户创建用户资料
-- 这个脚本将为测试用户创建对应的users表记录

-- 1. 检查测试用户是否存在
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'test@dreweave.com';

-- 2. 为测试用户创建用户资料
INSERT INTO users (
  id,
  email,
  username,
  full_name,
  is_verified,
  role,
  status,
  created_at,
  updated_at
) 
SELECT 
  id,
  email,
  '测试用户',
  '测试用户',
  true,
  'user',
  'active',
  created_at,
  created_at
FROM auth.users 
WHERE email = 'test@dreweave.com'
ON CONFLICT (id) DO NOTHING;

-- 3. 验证用户资料创建成功
SELECT 
  u.id,
  u.email,
  u.username,
  u.is_verified,
  u.role,
  u.status,
  u.created_at
FROM users u
WHERE u.email = 'test@dreweave.com';

-- 4. 检查权限设置
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND grantee IN ('anon', 'authenticated');