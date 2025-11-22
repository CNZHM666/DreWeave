// 🔧 Supabase Admin API 测试用户创建脚本
// 这个脚本使用Service Role Key创建测试用户，避免触发邮件限制

import { createClient } from '@supabase/supabase-js'

// 注意：Service Role Key只能在后端使用，绝不能暴露到前端
const supabaseUrl = 'https://baezjifhjknhxervaxzw.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZXpqaWZoamtuaHhlcnZheHp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc0OTU4MSwiZXhwIjoyMDc3MzI1NTgxfQ.5oYdP8pX8UcVnz6Heq5fX7gYcX4r5v8s9n0m1q2w3e4'

// 创建管理员客户端
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 测试用户数据
const testUsers = [
  {
    email: 'test@example.com',
    password: '123456',
    email_confirm: true,
    user_metadata: {
      name: '测试用户',
      student_id: 'TEST001',
      university: '测试大学'
    }
  },
  {
    email: 'student@university.edu',
    password: 'student123',
    email_confirm: true,
    user_metadata: {
      name: '大学生用户',
      student_id: 'STU2024001',
      university: '示例大学'
    }
  },
  {
    email: 'demo@dreweave.com',
    password: 'demo123456',
    email_confirm: true,
    user_metadata: {
      name: '演示用户',
      student_id: 'DEMO001',
      university: 'DREWEAVE大学'
    }
  }
]

async function createTestUsers() {
  console.log('🚀 开始创建测试用户...')
  
  for (const userData of testUsers) {
    try {
      console.log(`📧 创建用户: ${userData.email}`)
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: userData.email_confirm,
        user_metadata: userData.user_metadata
      })
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ 用户已存在: ${userData.email}`)
        } else {
          console.error(`❌ 创建用户失败: ${userData.email}`, error.message)
        }
      } else {
        console.log(`✅ 用户创建成功: ${userData.email}`)
        console.log(`   UID: ${data.user.id}`)
        console.log(`   姓名: ${userData.user_metadata.name}`)
      }
    } catch (error) {
      console.error(`❌ 创建用户异常: ${userData.email}`, error)
    }
  }
  
  console.log('\n🎉 测试用户创建完成！')
  console.log('\n📋 测试账户信息:')
  testUsers.forEach(user => {
    console.log(`   📧 ${user.email} / ${user.password}`)
  })
}

// 运行脚本
createTestUsers().catch(console.error)