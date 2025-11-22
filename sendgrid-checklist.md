# SendGrid配置检查清单

## ✅ 注册SendGrid账户

### 1. 访问注册页面
- [ ] 打开 https://signup.sendgrid.com/
- [ ] 点击 "Start for free"

### 2. 填写基本信息
- [ ] First Name: 你的英文名
- [ ] Last Name: 你的英文姓  
- [ ] Email: 你的邮箱（推荐Gmail）
- [ ] Password: 至少16位，包含大小写字母+数字+特殊符号
- [ ] Company: DREWEAVE
- [ ] Website: https://dreweave.com

### 3. 验证流程
- [ ] 邮箱验证（检查收件箱）
- [ ] 手机验证（需要接收短信）
- [ ] 保存恢复码（重要！）

## 🔑 获取API密钥

### 1. 登录控制台
- [ ] 访问 https://app.sendgrid.com/
- [ ] 使用注册的邮箱登录

### 2. 创建API密钥
- [ ] 点击左侧菜单 "Settings" → "API Keys"
- [ ] 点击 "Create API Key" 按钮
- [ ] API Key Name: `DREWEAVE-App-Key`
- [ ] 选择 "Restricted Access"
- [ ] 勾选权限：
  - [ ] ✅ Mail Send - Full Access
  - [ ] ✅ Mail Settings - Full Access  
  - [ ] ✅ Sender Authentication - Read Access

### 3. 保存密钥
- [ ] 点击 "Create & View"
- [ ] **立即复制API密钥**（只显示一次！）
- [ ] 将密钥粘贴到下方表单

## 📧 配置发件人身份

### 1. 发件人验证
- [ ] 点击 "Settings" → "Sender Authentication"
- [ ] 选择 "Single Sender Verification"
- [ ] 点击 "Create New Sender"

### 2. 填写发件人信息
- [ ] From Name: `DREWEAVE 织梦软件`
- [ ] From Email: `noreply@yourdomain.com`
- [ ] Reply To: `support@yourdomain.com`
- [ ] Company Address: 你的地址
- [ ] City: 城市
- [ ] Country: 国家

### 3. 验证邮箱
- [ ] 检查验证邮件
- [ ] 点击验证链接

## 🎯 收集配置信息

完成后请提供以下信息：

```
SendGrid API密钥: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
发件人邮箱: noreply@yourdomain.com
发件人名称: DREWEAVE 织梦软件
```

## ⚠️ 重要提醒

1. **API密钥只显示一次**，请务必保存
2. **需要科学上网**访问SendGrid
3. **手机验证**需要真实手机号
4. **邮箱验证**检查垃圾邮件文件夹

## 🚀 下一步

完成上述步骤后，我将帮你：
1. 配置Supabase SMTP设置
2. 测试邮件发送功能
3. 重新开启邮件确认
4. 验证整个邮件流程

有任何问题请随时告诉我！