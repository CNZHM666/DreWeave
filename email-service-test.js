// DREWEAVE邮件服务测试脚本
const EmailService = require('./src/services/email.service.js');

// 测试配置
const testConfig = {
  // 这里填入你的SendGrid配置
  apiKey: process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key',
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
  fromName: 'DREWEAVE 织梦软件'
};

// 测试函数
async function runEmailTests() {
  console.log('🧪 开始DREWEAVE邮件服务测试...\n');
  
  try {
    // 初始化邮件服务
    const emailService = new EmailService(testConfig);
    
    // 测试1: 连接测试
    console.log('📡 测试1: SendGrid API连接测试');
    const connectionTest = await emailService.testConnection();
    console.log(`结果: ${connectionTest.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`详情: ${connectionTest.message}\n`);
    
    if (!connectionTest.success) {
      console.log('❌ 连接测试失败，停止后续测试');
      return;
    }
    
    // 测试2: 简单邮件测试
    console.log('📧 测试2: 简单邮件发送测试');
    const testEmail = 'your-test-email@example.com'; // 替换为你的测试邮箱
    const simpleTest = await emailService.sendSimpleTestEmail(testEmail);
    console.log(`结果: ${simpleTest.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`详情: ${simpleTest.message}\n`);
    
    // 测试3: 注册确认邮件测试
    console.log('🔐 测试3: 注册确认邮件测试');
    const confirmationTest = await emailService.sendConfirmationEmail(testEmail, 'test-user-id');
    console.log(`结果: ${confirmationTest.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`详情: ${confirmationTest.message}\n`);
    
    // 测试4: 欢迎邮件测试
    console.log('🌟 测试4: 欢迎邮件测试');
    const welcomeTest = await emailService.sendWelcomeEmail(testEmail, '新用户');
    console.log(`结果: ${welcomeTest.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`详情: ${welcomeTest.message}\n`);
    
    // 测试5: 密码重置邮件测试
    console.log('🔑 测试5: 密码重置邮件测试');
    const resetTest = await emailService.sendPasswordResetEmail(testEmail, 'test-reset-token');
    console.log(`结果: ${resetTest.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`详情: ${resetTest.message}\n`);
    
    // 测试6: 获取邮件统计
    console.log('📊 测试6: 邮件发送统计');
    const stats = await emailService.getEmailStats();
    console.log(`结果: ${stats.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`详情: ${stats.message}\n`);
    if (stats.data) {
      console.log('📈 统计信息:', JSON.stringify(stats.data, null, 2));
    }
    
    console.log('🎉 邮件服务测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('堆栈跟踪:', error.stack);
  }
}

// 运行测试
if (require.main === module) {
  runEmailTests();
}

module.exports = { runEmailTests };