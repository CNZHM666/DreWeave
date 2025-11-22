# DREWEAVE织梦软件 - 部署文档

## 项目概述

DREWEAVE织梦软件是一款专为大学生设计的移动端戒瘾康复应用，采用React + TypeScript + Vite技术栈，集成Supabase后端服务，提供治愈系UI设计和全面的戒瘾支持功能。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand
- **UI框架**: TailwindCSS
- **后端服务**: Supabase (认证、数据库、存储)
- **路由**: React Router
- **通知**: Sonner
- **图表**: Recharts
- **图标**: Lucide React

## 环境要求

- Node.js 18+ 
- npm 或 pnpm
- Supabase 账户

## 本地开发部署

### 1. 克隆项目
```bash
git clone [项目地址]
cd dreweave-app
```

### 2. 安装依赖
```bash
npm install
# 或
pnpm install
```

### 3. 环境配置
创建 `.env` 文件并配置以下变量：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE=your_service_role_key
```

### 4. 数据库设置
在Supabase控制台执行以下SQL脚本创建必要表结构：

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  avatar_url TEXT,
  student_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 签到记录表
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 测试结果表
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  result_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 虚拟币交易表
CREATE TABLE coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 奖励表
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  is_redeemed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  redeemed_at TIMESTAMP WITH TIME ZONE
);

-- 成就表
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户成就表
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 插入默认成就数据
INSERT INTO achievements (title, description, category, requirement_type, requirement_value, reward_coins, icon) VALUES
('首次签到', '完成第一次签到', 'daily', 'days', 1, 10, '🎯'),
('连续7天', '连续签到7天', 'daily', 'streak', 7, 50, '🔥'),
('连续30天', '连续签到30天', 'daily', 'streak', 30, 200, '⭐'),
('测试新手', '完成第一次心理测试', 'test', 'tests', 1, 20, '🧠'),
('测试达人', '完成5次心理测试', 'test', 'tests', 5, 100, '📊'),
('冷静新手', '完成第一次冷静练习', 'calm', 'calm_sessions', 1, 15, '😌'),
('冷静大师', '完成10次冷静练习', 'calm', 'calm_sessions', 10, 150, '🧘'),
('财富新手', '首次获得织梦豆', 'market', 'coins', 1, 5, '💰'),
('财富积累', '累计获得100织梦豆', 'market', 'coins', 100, 50, '💎'),
('财富自由', '累计获得500织梦豆', 'market', 'coins', 500, 300, '👑');

-- 配置RLS策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "用户可查看自己的资料" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户可更新自己的资料" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "用户可插入自己的资料" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "用户可查看自己的签到记录" ON check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可插入自己的签到记录" ON check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可查看自己的测试结果" ON test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可插入自己的测试结果" ON test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可查看自己的交易记录" ON coins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可插入自己的交易记录" ON coins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可查看自己的奖励" ON rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可插入自己的奖励" ON rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可更新自己的奖励" ON rewards FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "所有用户可查看成就" ON achievements FOR SELECT USING (true);

CREATE POLICY "用户可查看自己的成就进度" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可插入自己的成就进度" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可更新自己的成就进度" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);
```

### 5. 启动开发服务器
```bash
npm run dev
# 或
pnpm dev
```

应用将在 http://localhost:5175 启动

## 生产环境部署

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 配置环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_SERVICE_ROLE`
3. 构建命令：`npm run build`
4. 输出目录：`dist`

### 其他平台部署

构建生产版本：
```bash
npm run build
```

构建输出在 `dist` 目录，可部署到任何静态文件服务器。

## 功能特性

### 核心功能
- ✅ 用户认证系统（注册/登录/注销）
- ✅ 每日签到系统（连续签到奖励）
- ✅ 心理测试评估（IAT成瘾测试、性压抑测试）
- ✅ 冷静空间（呼吸练习、冥想、治愈文案）
- ✅ 虚拟币系统（赚取和消费织梦豆）
- ✅ 成就系统（多维度进度跟踪）
- ✅ 治愈系UI设计（磨砂玻璃、粒子动画、渐变背景）

### 技术特色
- 🎨 治愈系配色方案（薄荷绿、薰衣草紫、天空蓝）
- 🌊 动态粒子效果与呼吸动画
- 📱 移动优先响应式设计
- 🔄 实时状态管理与数据持久化
- 🏆 游戏化成就与奖励机制

## 数据库架构

### 核心表结构
- `users` - 用户基本信息
- `check_ins` - 签到记录
- `test_results` - 心理测试结果
- `coins` - 虚拟币交易记录
- `rewards` - 奖励系统
- `achievements` - 成就定义
- `user_achievements` - 用户成就进度

### 安全策略
- 行级安全(RLS)已启用
- 用户只能访问自己的数据
- 认证用户才能进行写操作

## 环境配置详解

### Supabase配置
```typescript
// src/config/supabase.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### 状态管理配置
```typescript
// 所有store都配置了持久化
persist(
  (set, get) => ({...}),
  {
    name: 'store-name',
    storage: localStorage
  }
)
```

## 性能优化

### 代码分割
- 路由级别代码分割已配置
- 组件按需加载

### 缓存策略
- Zustand状态持久化到localStorage
- 图片资源使用懒加载

### 移动端优化
- 触摸事件优化
- 减少动画复杂度（移动端）
- 响应式图片处理

## 监控与维护

### 错误监控
- 控制台错误日志
- Supabase错误处理
- 用户友好的错误提示

### 数据备份
- Supabase自动备份
- 定期导出用户数据

### 性能监控
- 页面加载时间监控
- API响应时间跟踪

## 安全注意事项

### 前端安全
- 环境变量不包含敏感信息
- 用户输入验证
- XSS防护

### 后端安全
- RLS策略严格配置
- API密钥安全存储
- 数据库连接加密

### 用户隐私
- 数据最小化收集
- 用户数据加密存储
- 符合GDPR要求

## 故障排除

### 常见问题

1. **Supabase连接失败**
   - 检查环境变量配置
   - 验证网络连接
   - 确认Supabase服务状态

2. **认证功能异常**
   - 检查RLS策略配置
   - 验证用户表结构
   - 确认邮箱验证设置

3. **状态管理问题**
   - 清除localStorage缓存
   - 检查store持久化配置
   - 验证状态更新逻辑

### 调试工具
- 浏览器开发者工具
- React Developer Tools
- Supabase Dashboard

## 更新与升级

### 依赖更新
```bash
npm update
# 或
pnpm update
```

### 数据库迁移
- 使用Supabase迁移功能
- 备份现有数据
- 逐步应用schema变更

## 支持与联系

如需技术支持或有疑问，请通过以下方式联系：
- 邮箱：support@dreweave.com
- 文档：查看项目README.md
- 社区：加入开发者社区

---

**版本**: 1.0.0  
**最后更新**: 2024年11月13日  
**文档状态**: 完整版