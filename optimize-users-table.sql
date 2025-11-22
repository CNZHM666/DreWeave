-- 优化数据库性能：为users表添加索引
-- 这将显著提升用户资料查询速度

-- 1. 为users表的id字段添加索引（主键已存在，无需重复）
-- 2. 为email字段添加索引（加速登录查询）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. 为username字段添加索引（加速用户名查询）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 4. 为role和status字段添加复合索引（加速权限检查）
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- 5. 为created_at字段添加索引（加速时间范围查询）
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 6. 验证索引创建
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY indexname;

-- 7. 分析表统计信息（优化查询计划）
ANALYZE users;