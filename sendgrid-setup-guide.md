# SendGrid SMTP 配置指南

## 🚀 快速开始（5分钟完成）

### 第一步：注册SendGrid账户
1. 访问 [https://signup.sendgrid.com/](https://signup.sendgrid.com/)
2. 使用邮箱注册（推荐Gmail）
3. 选择"Email API"计划
4. 完成验证流程

### 第二步：创建API密钥
1. 登录SendGrid控制台
2. 进入 Settings → API Keys
3. 点击 "Create API Key"
4. 选择 "Restricted Access"
5. 勾选以下权限：
   - ✅ Mail Send
   - ✅ Mail Settings
   - ✅ Sender Authentication
6. 保存生成的API密钥（只显示一次）

### 第三步：配置发件人身份
1. 进入 Settings → Sender Authentication
2. 配置 Single Sender Verification
3. 验证你的邮箱地址

### 第四步：配置Supabase SMTP
在Supabase控制台：
1. 进入 Authentication → Providers → Email
2. 配置SMTP设置：
   - SMTP Host: `smtp.sendgrid.net`
   - SMTP Port: `587`
   - SMTP User: `apikey`（固定值）
   - SMTP Pass: 你的SendGrid API密钥
   - SMTP Admin Email: 你验证的发件人邮箱

## 📋 配置参数

```bash
# 环境变量配置
SENDGRID_API_KEY=你的API密钥
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=你的API密钥
SMTP_FROM_EMAIL=你的发件人邮箱
```

## ✅ 测试配置

使用以下命令测试SMTP连接：
```bash
telnet smtp.sendgrid.net 587
```

或使用我们的测试脚本验证配置。

## 📊 SendGrid优势

- ✅ 免费12,000封邮件/月
- ✅ 99.9%送达率保证
- ✅ 详细发送统计
- ✅ 邮件模板支持
- ✅ 反垃圾邮件保护
- ✅ API集成简单

## ⚠️ 注意事项

1. **API密钥安全**：不要泄露，只显示一次
2. **发件人验证**：必须验证发件人邮箱
3. **域名认证**：建议配置域名认证提升信誉
4. **发送限制**：免费版每小时限制100封邮件
5. **内容合规**：遵守SendGrid服务条款

## 🎯 下一步

完成注册后，提供以下信息给我：
1. SendGrid API密钥
2. 验证的发件人邮箱
3. 是否需要邮件模板定制

我将帮你完成Supabase的SMTP配置！