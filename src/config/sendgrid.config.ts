// SendGrid邮件服务配置
// 用于Supabase自定义SMTP配置

export const sendgridConfig = {
  // SMTP服务器配置
  smtp: {
    host: 'smtp.sendgrid.net',
    port: 587, // 推荐端口，支持TLS加密
    secure: false, // 使用STARTTLS
    auth: {
      user: 'apikey', // SendGrid固定用户名
      pass: process.env.SENDGRID_API_KEY || '' // API密钥作为密码
    }
  },
  
  // 邮件模板配置
  templates: {
    // 确认邮件模板
    confirmation: {
      subject: '请确认您的DREWEAVE账户',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1>🧠 DREWEAVE 织梦软件</h1>
            <p>大学生心理健康管理平台</p>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">欢迎加入我们！</h2>
            <p>您好，</p>
            <p>感谢您注册DREWEAVE织梦软件。为了保障您的账户安全，请点击下方按钮确认您的邮箱地址：</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{ .ConfirmationURL }}" 
                 style="background: linear-gradient(45deg, #007bff, #0056b3); color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 25px; font-weight: bold;">
                🔐 确认邮箱地址
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              如果按钮无法点击，请复制以下链接到浏览器地址栏：<br>
              <code style="background: #e9ecef; padding: 5px; border-radius: 3px;">{{ .ConfirmationURL }}</code>
            </p>
            <p style="color: #666; font-size: 14px;">
              此链接将在24小时后过期，如果过期请重新注册。
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              如果这不是您的操作，请忽略此邮件。<br>
              DREWEAVE织梦软件 - 关注大学生心理健康
            </p>
          </div>
        </div>
      `,
      text: `
DREWEAVE织梦软件 - 邮箱确认

您好，

感谢您注册DREWEAVE织梦软件。

请访问以下链接确认您的邮箱地址：
{{ .ConfirmationURL }}

此链接将在24小时后过期。

如果这不是您的操作，请忽略此邮件。

DREWEAVE织梦软件
关注大学生心理健康
      `
    },
    
    // 密码重置邮件模板
    passwordReset: {
      subject: '重置您的DREWEAVE密码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
            <h1>🔐 密码重置</h1>
            <p>DREWEAVE织梦软件</p>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">忘记密码了？</h2>
            <p>您好，</p>
            <p>我们收到了您的密码重置请求。点击下方按钮重置您的密码：</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{ .ConfirmationURL }}" 
                 style="background: linear-gradient(45deg, #ff6b6b, #ee5a24); color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 25px; font-weight: bold;">
                🔑 重置密码
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              为了安全起见，此链接将在1小时后过期。<br>
              如果您没有请求重置密码，请忽略此邮件。
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              DREWEAVE织梦软件 - 关注大学生心理健康
            </p>
          </div>
        </div>
      `,
      text: `
DREWEAVE织梦软件 - 密码重置

您好，

我们收到了您的密码重置请求。

请访问以下链接重置您的密码：
{{ .ConfirmationURL }}

此链接将在1小时后过期。

如果您没有请求重置密码，请忽略此邮件。

DREWEAVE织梦软件
关注大学生心理健康
      `
    },
    
    // 欢迎邮件模板
    welcome: {
      subject: '欢迎加入DREWEAVE织梦软件！',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 30px; text-align: center; color: #333;">
            <h1>🌟 欢迎加入DREWEAVE</h1>
            <p>大学生心理健康管理平台</p>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">开始你的心理健康之旅</h2>
            <p>您好，{{ .Email }}！</p>
            <p>欢迎来到DREWEAVE织梦软件，我们致力于帮助大学生维护心理健康，提供专业的心理支持工具。</p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #007bff;">🎯 你可以开始：</h3>
              <ul style="color: #666;">
                <li>✅ 每日心情签到，追踪情绪变化</li>
                <li>✅ 参与专业心理测试，了解自己</li>
                <li>✅ 使用治愈工具，缓解压力</li>
                <li>✅ 获得虚拟币奖励，解锁成就</li>
                <li>✅ 加入社群，与同学交流</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://dreweave.com/dashboard" 
                 style="background: linear-gradient(45deg, #007bff, #0056b3); color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 25px; font-weight: bold;">
                🚀 开始探索
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              如有任何问题，请随时联系我们的支持团队。<br>
              邮箱：support@dreweave.com
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              DREWEAVE织梦软件 - 关注大学生心理健康<br>
              让每个人都能拥有健康的心理状态
            </p>
          </div>
        </div>
      `,
      text: `
欢迎加入DREWEAVE织梦软件！

您好，{{ .Email }}！

欢迎来到DREWEAVE织梦软件，我们致力于帮助大学生维护心理健康。

你可以开始：
✅ 每日心情签到，追踪情绪变化
✅ 参与专业心理测试，了解自己  
✅ 使用治愈工具，缓解压力
✅ 获得虚拟币奖励，解锁成就
✅ 加入社群，与同学交流

访问 https://dreweave.com/dashboard 开始探索！

如有问题，请联系：support@dreweave.com

DREWEAVE织梦软件
关注大学生心理健康
      `
    }
  },
  
  // 邮件发送配置
  sending: {
    // 发送限制（免费版）
    dailyLimit: 100, // 每日100封
    rateLimit: 3, // 每秒3封
    
    // 重试配置
    retryAttempts: 3,
    retryDelay: 1000, // 1秒
    
    // 超时配置
    timeout: 30000 // 30秒
  },
  
  // Webhook配置（可选）
  webhooks: {
    // 邮件事件通知
    events: [
      'delivered',    // 已送达
      'bounce',       // 退信
      'dropped',      // 丢弃
      'spam_report',  // 垃圾邮件举报
      'unsubscribe',  // 取消订阅
      'group_unsubscribe', // 组取消订阅
      'group_resubscribe', // 组重新订阅
      'processed',    // 已处理
      'open',         // 已打开
      'click'         // 已点击
    ]
  }
};

// 配置验证函数
export function validateSendGridConfig() {
  const required = [
    'SENDGRID_API_KEY',
    'SMTP_FROM_EMAIL',
    'SMTP_FROM_NAME'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`SendGrid配置缺失: ${missing.join(', ')}`);
  }
  
  // 验证API密钥格式
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey.startsWith('SG.')) {
    throw new Error('SendGrid API密钥格式错误，应该以 "SG." 开头');
  }
  
  // 验证邮箱格式
  const email = process.env.SMTP_FROM_EMAIL;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('发件人邮箱格式错误');
  }
  
  return true;
}

export default sendgridConfig;