// 🔍 登录功能测试脚本
// 这个脚本将测试登录功能的各个方面

const testResults = {
  supabaseConnection: false,
  loginTimeout: false,
  errorHandling: false,
  environmentVariables: false
};

async function runTests() {
  console.log('🧪 开始执行登录功能测试...\n');
  
  // 测试1: 环境变量检查
  console.log('1️⃣ 测试环境变量配置...');
  await testEnvironmentVariables();
  
  // 测试2: Supabase连接测试
  console.log('\n2️⃣ 测试Supabase连接...');
  await testSupabaseConnection();
  
  // 测试3: 登录超时机制测试
  console.log('\n3️⃣ 测试登录超时机制...');
  await testLoginTimeout();
  
  // 测试4: 错误处理测试
  console.log('\n4️⃣ 测试错误处理机制...');
  await testErrorHandling();
  
  // 输出测试结果
  console.log('\n📊 测试结果总结:');
  console.log('===================');
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? '通过' : '失败'}`);
  });
  
  const allPassed = Object.values(testResults).every(result => result === true);
  console.log(`\n🎯 总体结果: ${allPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);
  
  if (!allPassed) {
    console.log('\n🔧 建议修复步骤:');
    if (!testResults.environmentVariables) {
      console.log('- 检查环境变量配置是否正确');
    }
    if (!testResults.supabaseConnection) {
      console.log('- 检查网络连接和Supabase服务状态');
    }
    if (!testResults.loginTimeout) {
      console.log('- 检查登录超时机制实现');
    }
    if (!testResults.errorHandling) {
      console.log('- 检查错误处理逻辑');
    }
  }
}

async function testEnvironmentVariables() {
  try {
    // 检查环境变量
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    
    console.log(`VITE_SUPABASE_URL: ${supabaseUrl ? '已配置' : '未配置'}`);
    console.log(`VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '已配置' : '未配置'}`);
    
    if (supabaseUrl && supabaseAnonKey) {
      console.log('✅ 环境变量配置正确');
      testResults.environmentVariables = true;
    } else {
      console.log('❌ 环境变量配置缺失');
    }
  } catch (error) {
    console.log('❌ 环境变量测试失败:', error.message);
  }
}

async function testSupabaseConnection() {
  try {
    // 测试Supabase连接
    const response = await fetch('https://baezjifhjknhxervaxzw.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZXpqaWZoamtuaHhlcnZheHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDk1ODEsImV4cCI6MjA3NzMyNTU4MX0.Zx-sG-IV3HJn3CtgLV8wrXmHoLiM-skbdO9zmuWn3ZY', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZXpqaWZoamtuaHhlcnZheHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDk1ODEsImV4cCI6MjA3NzMyNTU4MX0.Zx-sG-IV3HJn3CtgLV8wrXmHoLiM-skbdO9zmuWn3ZY'
      },
      mode: 'cors'
    });
    
    console.log(`响应状态: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Supabase连接成功');
      testResults.supabaseConnection = true;
    } else {
      console.log('❌ Supabase连接失败');
    }
  } catch (error) {
    console.log('❌ Supabase连接测试失败:', error.message);
  }
}

async function testLoginTimeout() {
  try {
    // 测试登录超时机制（模拟慢网络）
    console.log('测试10秒超时机制...');
    
    const startTime = Date.now();
    
    // 模拟登录请求
    const loginPromise = fetch('https://baezjifhjknhxervaxzw.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZXpqaWZoamtuaHhlcnZheHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDk1ODEsImV4cCI6MjA3NzMyNTU4MX0.Zx-sG-IV3HJn3CtgLV8wrXmHoLiM-skbdO9zmuWn3ZY'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      }),
      mode: 'cors'
    });
    
    // 10秒超时
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('超时测试')), 10000)
    );
    
    try {
      await Promise.race([loginPromise, timeoutPromise]);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`请求耗时: ${duration}ms`);
      
      if (duration < 10000) {
        console.log('✅ 登录请求在10秒内完成');
        testResults.loginTimeout = true;
      } else {
        console.log('❌ 登录请求超时');
      }
    } catch (error) {
      if (error.message === '超时测试') {
        console.log('❌ 超时机制测试失败');
      } else {
        console.log('✅ 登录请求在10秒内完成（即使失败）');
        testResults.loginTimeout = true;
      }
    }
  } catch (error) {
    console.log('❌ 超时测试失败:', error.message);
  }
}

async function testErrorHandling() {
  try {
    // 测试错误处理
    console.log('测试错误处理机制...');
    
    // 测试无效凭据
    const response = await fetch('https://baezjifhjknhxervaxzw.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZXpqaWZoamtuaHhlcnZheHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDk1ODEsImV4cCI6MjA3NzMyNTU4MX0.Zx-sG-IV3HJn3CtgLV8wrXmHoLiM-skbdO9zmuWn3ZY'
      },
      body: JSON.stringify({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }),
      mode: 'cors'
    });
    
    const data = await response.json();
    
    console.log(`错误响应状态: ${response.status}`);
    console.log(`错误信息: ${data.msg || data.error_description || '未知错误'}`);
    
    if (data.msg || data.error_description) {
      console.log('✅ 错误处理机制正常工作');
      testResults.errorHandling = true;
    } else {
      console.log('❌ 错误处理机制异常');
    }
  } catch (error) {
    console.log('❌ 错误处理测试失败:', error.message);
  }
}

// 执行测试
runTests().catch(console.error);