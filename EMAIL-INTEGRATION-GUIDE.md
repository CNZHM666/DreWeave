# 🧠 DREWEAVE 邮件系统完整配置指南

## 📋 配置清单

### ✅ 已完成步骤
- [x] SendGrid 账户注册
- [x] API 密钥获取
- [x] 发件人邮箱验证
- [x] 邮件服务代码实现
- [x] 测试工具创建

### 🔄 当前步骤：邮件功能测试

## 🧪 测试邮件功能

### 方法1：使用浏览器验证工具
1. 打开 SendGrid 验证工具：`http://localhost:3001/sendgrid-validator.html`
2. 输入你的 SendGrid API 密钥（以 `SG.` 开头）
3. 输入已验证的发件人邮箱
4. 点击"验证配置"按钮
5. 验证通过后，发送测试邮件

### 方法2：使用命令行测试
```bash
# 设置环境变量
export SENDGRID_API_KEY="你的API密钥"
export SENDGRID_FROM_EMAIL="你的发件人邮箱"

# 运行测试
node email-service-test.js
```

### 方法3：使用 Node.js 测试
```javascript
const EmailService = require('./src/services/email.service');

const emailService = new EmailService({
  apiKey: '你的SendGrid API密钥',
  fromEmail: '你的发件人邮箱',
  fromName: 'DREWEAVE 织梦软件'
});

// 发送测试邮件
emailService.sendSimpleTestEmail('你的测试邮箱')
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

## ⚙️ Supabase SMTP 配置

### 配置参数
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [你的SendGrid API密钥]
SMTP From Email: [你的验证邮箱]
SMTP From Name: DREWEAVE 织梦软件
```

### 配置步骤
1. 登录 Supabase 控制台
2. 进入 Authentication → Providers → Email
3. 填写以上 SMTP 配置
4. 开启 "Enable Email Confirmations"
5. 保存设置

## 📧 支持的邮件类型

### 1. 注册确认邮件
- 用途：新用户注册时发送确认链接
- 模板：包含确认按钮和品牌标识
- 触发时机：用户注册时

### 2. 欢迎邮件
- 用途：用户确认注册后发送欢迎信息
- 模板：包含使用指南和功能介绍
- 触发时机：邮箱确认后

### 3. 密码重置邮件
- 用途：用户忘记密码时发送重置链接
- 模板：包含安全重置按钮
- 触发时机：用户请求重置密码时

### 4. 系统通知邮件
- 用途：重要系统更新或通知
- 模板：简洁专业的通知格式
- 触发时机：系统事件发生时

## 🔧 故障排除

### 常见问题

#### 1. API 连接失败
**症状**：验证配置时显示连接失败
**解决**：
- 检查 API 密钥是否正确（以 `SG.` 开头）
- 确认密钥具有 Mail Send 权限
- 检查网络连接

#### 2. 邮件发送失败
**症状**：测试邮件发送失败
**解决**：
- 确认发件人邮箱已通过验证
- 检查收件人邮箱格式是否正确
- 查看 SendGrid 控制台的发送日志

#### 3. SMTP 配置错误
**症状**：Supabase 邮件功能不工作
**解决**：
- 确认所有 SMTP 参数正确
- 检查防火墙设置（端口 587）
- 验证发件人身份

#### 4. 邮件进入垃圾箱
**症状**：邮件发送成功但进入垃圾箱
**解决**：
- 设置 SPF、DKIM、DMARC 记录
- 使用专业的发件人域名
- 避免使用垃圾邮件关键词

## 📊 监控和统计

### SendGrid 控制台
- 查看邮件发送统计
- 监控退信率和投诉率
- 分析邮件打开率和点击率

### 关键指标
- 发送成功率：应 > 95%
- 退信率：应 < 5%
- 投诉率：应 < 0.1%

## 🚀 下一步操作

### 完成测试后
1. ✅ 验证所有邮件类型都能正常发送
2. ✅ 确认邮件模板显示正确
3. ✅ 测试 Supabase SMTP 配置
4. ✅ 重新开启邮件确认功能
5. ✅ 进行完整用户注册流程测试

### 性能优化
- 启用邮件发送队列
- 实现批量发送功能
- 添加邮件发送重试机制
- 设置邮件发送限制

## 📞 技术支持

### 获取帮助
- SendGrid 官方文档：https://docs.sendgrid.com/
- Supabase 邮件文档：https://supabase.com/docs/guides/auth/auth-email
- DREWEAVE 项目文档：查看项目内的文档文件

### 联系支持
- SendGrid 支持：通过 SendGrid 控制台提交工单
- Supabase 支持：通过 Supabase 控制台获取帮助
- 项目支持：查看项目 README 文件

---

🎉 **完成以上步骤后，你的 DREWEAVE 邮件系统将完全配置完成，可以为用户提供稳定可靠的邮件服务！**