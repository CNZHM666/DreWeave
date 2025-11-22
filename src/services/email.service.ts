// SendGrid邮件服务测试工具
// 用于验证SMTP配置和邮件发送功能

import sendgridConfig from '../config/sendgrid.config';

// 邮件发送服务
export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private supabase: any;

  constructor(supabaseClient: any) {
    this.apiKey = import.meta.env.VITE_SENDGRID_API_KEY || '';
    this.fromEmail = import.meta.env.VITE_SMTP_FROM_EMAIL || '';
    this.fromName = import.meta.env.VITE_SMTP_FROM_NAME || 'DREWEAVE 织梦软件';
    this.supabase = supabaseClient;
    
    this.validateConfig();
  }

  // 验证配置
  private validateConfig() {
    if (!this.apiKey) {
      throw new Error('SendGrid API密钥未配置');
    }
    
    if (!this.fromEmail) {
      throw new Error('发件人邮箱未配置');
    }
    
    if (!this.apiKey.startsWith('SG.')) {
      throw new Error('SendGrid API密钥格式错误');
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.fromEmail)) {
      throw new Error('发件人邮箱格式错误');
    }
  }

  // 测试SendGrid API连接
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 测试SendGrid连接...');
      
      // 使用fetch测试API连接
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SendGrid连接成功', data);
        return {
          success: true,
          message: 'SendGrid API连接正常'
        };
      } else {
        const error = await response.text();
        console.debug('📝 SendGrid连接失败', error);
        return {
          success: false,
          message: `SendGrid连接失败: ${error}`
        };
      }
    } catch (error: any) {
      console.debug('📝 SendGrid连接异常', error);
      return {
        success: false,
        message: `SendGrid连接异常: ${error.message}`
      };
    }
  }

  // 发送测试邮件
  async sendTestEmail(toEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📧 发送测试邮件到: ${toEmail}`);
      
      const emailData = {
        personalizations: [{
          to: [{ email: toEmail }],
          subject: 'DREWEAVE邮件服务测试'
        }],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                <h1>🎉 DREWEAVE邮件服务</h1>
                <p>测试邮件发送成功！</p>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #333;">恭喜！</h2>
                <p>您的SendGrid邮件服务配置成功，可以正常发送邮件了。</p>
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #2e7d32;">
                    <strong>✅ 配置状态：</strong>正常<br>
                    <strong>📅 发送时间：</strong>${new Date().toLocaleString('zh-CN')}<br>
                    <strong>📧 发件人：</strong>${this.fromEmail}<br>
                    <strong>👤 收件人：</strong>${toEmail}
                  </p>
                </div>
                <p style="color: #666;">现在您可以：</p>
                <ul style="color: #666;">
                  <li>开启用户注册邮件确认</li>
                  <li>发送密码重置邮件</li>
                  <li>发送欢迎邮件</li>
                  <li>发送系统通知</li>
                </ul>
              </div>
            </div>
          `
        }],
        tracking_settings: {
          click_tracking: {
            enable: true
          },
          open_tracking: {
            enable: true
          }
        }
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log('✅ 测试邮件发送成功');
        return {
          success: true,
          message: '测试邮件发送成功，请检查收件箱'
        };
      } else {
        const error = await response.text();
        console.debug('📝 测试邮件发送失败', error);
        return {
          success: false,
          message: `邮件发送失败: ${error}`
        };
      }
    } catch (error: any) {
      console.debug('📝 测试邮件发送异常', error);
      return {
        success: false,
        message: `邮件发送异常: ${error.message}`
      };
    }
  }

  // 配置Supabase SMTP
  async configureSupabaseSMTP(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('⚙️ 配置Supabase SMTP...');
      
      // 这里应该调用Supabase API来配置SMTP
      // 由于安全原因，需要在Supabase控制台手动配置
      
      const config = {
        smtp_host: 'smtp.sendgrid.net',
        smtp_port: '587',
        smtp_user: 'apikey',
        smtp_pass: this.apiKey,
        smtp_from_email: this.fromEmail,
        smtp_from_name: this.fromName,
        email_confirm_enabled: true,
        email_template_enabled: true
      };

      console.log('📋 SMTP配置参数:', config);
      
      return {
        success: true,
        message: `Supabase SMTP配置信息已生成，请在控制台手动配置`
      };
    } catch (error: any) {
      console.debug('📝 Supabase SMTP配置失败', error);
      return {
        success: false,
        message: `SMTP配置失败: ${error.message}`
      };
    }
  }

  // 获取邮件发送统计
  async getEmailStats(): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      console.log('📊 获取邮件发送统计...');
      
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`https://api.sendgrid.com/v3/stats?start_date=${today}&end_date=${today}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ 邮件统计获取成功', data);
        return {
          success: true,
          data: data,
          message: '邮件统计获取成功'
        };
      } else {
        const error = await response.text();
        console.debug('📝 邮件统计获取失败', error);
        return {
          success: false,
          message: `邮件统计获取失败: ${error}`
        };
      }
    } catch (error: any) {
      console.debug('📝 邮件统计获取异常', error);
      return {
        success: false,
        message: `邮件统计获取异常: ${error.message}`
      };
    }
  }
}

// 邮件服务测试函数
export async function testEmailService(supabase: any) {
  try {
    console.log('🚀 开始邮件服务测试...');
    
    const emailService = new EmailService(supabase);
    
    // 1. 测试连接
    console.log('1️⃣ 测试SendGrid连接...');
    const connectionTest = await emailService.testConnection();
    console.log('连接测试结果:', connectionTest);
    
    if (!connectionTest.success) {
      return {
        success: false,
        step: 'connection',
        message: connectionTest.message
      };
    }
    
    // 2. 配置SMTP（提供配置信息）
    console.log('2️⃣ 生成SMTP配置...');
    const smtpConfig = await emailService.configureSupabaseSMTP();
    console.log('SMTP配置结果:', smtpConfig);
    
    // 3. 获取统计信息
    console.log('3️⃣ 获取邮件统计...');
    const stats = await emailService.getEmailStats();
    console.log('邮件统计结果:', stats);
    
    return {
      success: true,
      step: 'completed',
      message: '邮件服务测试完成',
      details: {
        connection: connectionTest,
        smtpConfig: smtpConfig,
        stats: stats
      }
    };
    
  } catch (error: any) {
    console.debug('📝 邮件服务测试异常', error);
    return {
      success: false,
      step: 'exception',
      message: `邮件服务测试异常: ${error.message}`
    };
  }
}

export default EmailService;
