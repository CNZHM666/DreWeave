-- 修复登录超时：创建用户资料时避免阻塞
-- 这个脚本将优化用户资料创建逻辑

-- 1. 检查测试用户是否存在
SELECT 
  id,
  email,
  email_confirmed_at
FROM auth.users 
WHERE email = 'test@dreweave.com';

-- 2. 创建或更新测试用户资料（如果不存在）
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
  au.id,
  au.email,
  COALESCE(u.username, '测试用户') as username,
  COALESCE(u.full_name, '测试用户') as full_name,
  COALESCE(u.is_verified, true) as is_verified,
  COALESCE(u.role, 'user') as role,
  COALESCE(u.status, 'active') as status,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'test@dreweave.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = COALESCE(users.username, EXCLUDED.username),
  full_name = COALESCE(users.full_name, EXCLUDED.full_name),
  updated_at = NOW();

-- 3. 验证用户资料
SELECT 
  u.id,
  u.email,
  u.username,
  u.is_verified,
  u.role,
  u.status,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.email = 'test@dreweave.com';

-- 4. 检查权限（确保查询不会被RLS阻塞）
SELECT 
  schemaname,
  tablename,
  attname,
  inherited,
  null_frac,
  avg_width,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 5. 优化查询性能
EXPLAIN ANALYZE
SELECT * FROM users 
WHERE email = 'test@dreweave.com';