# 🚀 DREWEAVE SendGrid API 快速获取指南

## 📋 API获取步骤

### 1️⃣ 注册SendGrid账户
访问：https://signup.sendgrid.com/

需要准备：
- 📧 邮箱地址（建议使用Gmail或企业邮箱）
- 👤 用户名
- 🔒 强密码

### 2️⃣ 创建API密钥
登录后按以下路径操作：
```
SendGrid控制台 → Settings → API Keys → Create API Key
```

**推荐配置：**
- **名称**：`DREWEAVE-Email-Service`
- **权限**：选择 **"Full Access"**（完全访问）
- **类型**：General API Key

### 3️⃣ 验证发件人身份
路径：Settings → Sender Authentication → Single Sender Verification

填写信息：
- **发件人名称**：`DREWEAVE 织梦软件`
- **发件人邮箱**：`noreply@yourdomain.com`（使用你的域名）
- **回复邮箱**：`support@yourdomain.com`

## 🔑 API密钥格式
正确的SendGrid API密钥格式：
```
SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- 以 `SG.` 开头
- 总长度约70个字符
- 包含字母、数字和特殊字符

## ⚡ 快速验证
获取API密钥后，立即进行验证：

### 方法1：使用在线验证工具
访问：`http://localhost:3002/sendgrid-validator.html`

### 方法2：使用curl命令
```bash
curl -X GET "https://api.sendgrid.com/v3/scopes" \
  -H "Authorization: Bearer SG.your-api-key-here" \
  -H "Content-Type: application/json"
```

### 方法3：使用测试脚本
```bash
# 设置环境变量
export SENDGRID_API_KEY="你的API密钥"
export SENDGRID_FROM_EMAIL="你的发件人邮箱"

# 运行测试
node email-service-test.js
```

## 📧 配置Supabase SMTP

获取API密钥后，在Supabase中配置：

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [你的完整API密钥]
SMTP From Email: [你的验证邮箱]
SMTP From Name: DREWEAVE 织梦软件
```

配置路径：
```
Supabase控制台 → Authentication → Providers → Email
```

## 🎯 下一步操作

1. ✅ **获取API密钥**（现在进行）
2. ✅ **验证API连接**（使用提供的工具）
3. ✅ **配置Supabase SMTP**
4. ✅ **测试邮件发送**
5. ✅ **重新开启邮件确认功能**

## 🔍 常见问题

### Q1: API密钥无效？
**检查：**
- 是否以 `SG.` 开头
- 是否复制完整（无空格或换行）
- 是否具有 Mail Send 权限

### Q2: 发件人验证失败？
**解决：**
- 使用真实存在的邮箱地址
- 检查邮箱是否能正常接收邮件
- 确保邮箱域名DNS设置正确

### Q3: 邮件发送失败？
**排查：**
- 检查SendGrid控制台的发送日志
- 验证收件人邮箱格式
- 检查是否超出免费额度

## 📞 获取帮助

- **SendGrid官方文档**：https://docs.sendgrid.com/
- **SendGrid支持**：通过控制台提交支持工单
- **项目文档**：查看项目内的 `EMAIL-INTEGRATION-GUIDE.md`

---

**🚀 现在就开始获取你的SendGrid API密钥吧！**