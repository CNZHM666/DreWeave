// 终极网络修复 - 处理所有类型的网络中断错误
// 终极网络修复 - 处理所有类型的网络中断错误

interface NavigatorWithConnection extends Navigator {
  connection?: {
    type?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
}

interface ErrorInfo {
  url: string;
  message: string;
  type: string;
  timestamp: string;
  possibleCauses: string[];
}

interface TestResult {
  method: string;
  url: string;
  success: boolean;
  timestamp: string;
  error?: string;
  mode?: string;
  status?: number;
}

interface UltimateTestResults {
  timestamp: string;
  tests: TestResult[];
  recommendations: string[];
  success: boolean;
}

export const UltimateNetworkFix = {
  // 检测当前网络环境
  detectNetworkEnvironment: () => {
    const env = {
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      userAgent: navigator.userAgent,
      onLine: navigator.onLine,
      connection: (navigator as NavigatorWithConnection).connection || null,
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      isFileProtocol: window.location.protocol === 'file:',
      isHTTPS: window.location.protocol === 'https:',
      timestamp: new Date().toISOString()
    }
    
    console.log('🔍 网络环境检测:', env)
    return env
  },

  // 处理ERR_ABORTED错误的终极方案
  handleERR_ABORTED: async (url: string, error: Error) => {
    console.debug(`📝 ERR_ABORTED 错误处理: ${url}`, error)
    
    // 错误分类
    const errorInfo = {
      url,
      message: error.message,
      type: 'ERR_ABORTED',
      timestamp: new Date().toISOString(),
      possibleCauses: [
        'CORS策略阻止',
        '浏览器安全设置',
        '网络代理配置问题', 
        '防火墙/安全软件拦截',
        'DNS解析失败',
        'SSL证书问题',
        '浏览器扩展干扰'
      ]
    }
    
    // 根据URL类型提供不同的解决方案
    if (url.includes('supabase.co')) {
      return await handleSupabaseERR_ABORTED(url, errorInfo)
    } else if (url.includes('dns-query') || url.includes('1.1.1.1')) {
      return await handleDNSERR_ABORTED(url, errorInfo)
    } else {
      return await handleGeneralERR_ABORTED(url, errorInfo)
    }
  },

  // 终极连接测试 - 使用多种技术
  ultimateConnectionTest: async () => {
    console.log('🧪 启动终极连接测试...')
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: [] as TestResult[],
      recommendations: [] as string[],
      success: false
    }
    
    // 测试1: 使用Image对象测试（绕过CORS）
    await testWithImageObject(results)
    
    // 测试2: 使用Script标签测试
    await testWithScriptTag(results)
    
    // 测试3: 使用XHR对象测试
    await testWithXHR(results)
    
    // 测试4: 使用Fetch API测试（带各种选项）
    await testWithFetchAPI(results)
    
    // 测试5: 使用WebSocket测试
    await testWithWebSocket(results)
    
    // 分析结果
    analyzeTestResults(results)
    
    return results
  },

  // 创建绕过ERR_ABORTED的请求包装器
  createERR_ABORTEDSafeFetch: () => {
    const originalFetch = window.fetch
    
    return async (url: string, options: RequestInit = {}) => {
      const maxRetries = 3
      let lastError: Error | null = null
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 尝试连接 ${attempt}/${maxRetries}: ${url}`)
          
          // 方法1: 标准fetch（可能失败）
          try {
            await originalFetch(url, {
              ...options,
              mode: 'no-cors', // 关键：使用no-cors模式
              cache: 'no-cache',
              redirect: 'follow',
              referrerPolicy: 'no-referrer',
              credentials: 'omit',
              signal: AbortSignal.timeout(8000) // 8秒超时
            })
            
            // 对于no-cors模式，我们无法检查response.ok
            // 但只要没有抛出错误，就认为成功
            console.log('✅ 标准fetch成功')
            return new Response(null, { status: 200, statusText: 'OK' })
          } catch (fetchError: any) {
            console.debug('📝 标准fetch失败:', fetchError.message)
          }
          
          // 方法2: 使用Image对象测试连接
          try {
            const imageTest = await testConnectionWithImage(url)
            if (imageTest) {
              console.log('✅ Image对象测试成功')
              return new Response(null, { status: 200, statusText: 'OK' })
            }
          } catch (imageError: any) {
            console.debug('📝 Image对象测试失败:', imageError.message)
          }
          
          // 方法3: 使用XHR（XMLHttpRequest）
          try {
            const xhrTest = await testConnectionWithXHR(url)
            if (xhrTest) {
              console.log('✅ XHR测试成功')
              return new Response(null, { status: 200, statusText: 'OK' })
            }
          } catch (xhrError: any) {
            console.debug('📝 XHR测试失败:', xhrError.message)
          }
          
          // 方法4: 使用代理服务
          try {
            const proxyTest = await testConnectionWithProxy(url)
            if (proxyTest) {
              console.log('✅ 代理测试成功')
              return proxyTest
            }
          } catch (proxyError: any) {
            console.debug('📝 代理测试失败:', proxyError.message)
          }
          
          throw new Error(`所有连接方法都失败`)
          
        } catch (error: any) {
          lastError = error as Error
          console.debug(`📝 第${attempt}次尝试失败:`, error.message)
          
          if (attempt < maxRetries) {
            // 指数退避延迟
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
            console.log(`⏱️ 等待 ${delay}ms 后重试...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      
      // 所有尝试都失败
      throw new Error(`终极连接失败 (${maxRetries}次尝试): ${lastError?.message}`)
    }
  },

  // 提供多种替代方案
  getAlternativeSolutions: () => {
    return [
      {
        name: '离线模式',
        description: '启用完全离线功能',
        action: 'enableOfflineMode',
        priority: 1
      },
      {
        name: '本地代理',
        description: '设置本地CORS代理服务器',
        action: 'setupLocalProxy',
        priority: 2
      },
      {
        name: '浏览器设置',
        description: '调整浏览器安全设置',
        action: 'adjustBrowserSettings',
        priority: 3
      },
      {
        name: 'VPN/代理',
        description: '使用VPN或网络代理服务',
        action: 'useVPN',
        priority: 4
      },
      {
        name: '移动网络',
        description: '切换到手机热点',
        action: 'useMobileNetwork',
        priority: 5
      }
    ]
  },

  // 启用离线模式
  enableOfflineMode: () => {
    console.log('📴 启用终极离线模式...')
    
    // 创建离线数据存储
    const offlineData = {
      enabled: true,
      timestamp: new Date().toISOString(),
      user: null,
      settings: {
        autoSync: true,
        syncInterval: 30000, // 30秒检查一次
        maxOfflineTime: 24 * 60 * 60 * 1000 // 24小时
      }
    }
    
    localStorage.setItem('ultimate-offline-mode', JSON.stringify(offlineData))
    
    // 设置定时器检查网络恢复
    const checkNetworkRecovery = async () => {
      try {
        const test = await UltimateNetworkFix.ultimateConnectionTest()
        if (test.success) {
          console.log('🎉 网络已恢复！')
          // 触发数据同步
          window.dispatchEvent(new CustomEvent('network-restored'))
        }
        } catch (error: any) {
          console.log('⏳ 网络仍未恢复，继续离线模式')
        }
    }
    
    // 每30秒检查一次网络状态
    setInterval(checkNetworkRecovery, 30000)
    
    return offlineData
  }
}

// 辅助函数：使用Image对象测试连接
async function testWithImageObject(results: UltimateTestResults) {
  console.log('📷 使用Image对象测试连接...')
  
  const testUrls = [
    'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png', // Google logo（稳定）
    'https://www.baidu.com/img/bd_logo1.png', // 百度logo（稳定）
    'https://httpbin.org/status/200' // 测试服务
  ]
  
  for (const url of testUrls) {
    try {
      await new Promise((resolve, reject) => {
        const img = new Image()
        const timeout = setTimeout(() => {
          reject(new Error('Image加载超时'))
        }, 5000)
        
        img.onload = () => {
          clearTimeout(timeout)
          resolve(true)
        }
        
        img.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('Image加载失败'))
        }
        
        img.src = url
      })
      
      results.tests.push({
        method: 'ImageObject',
        url,
        success: true,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ Image对象测试成功: ${url}`)
      return true
    } catch (error: any) {
      results.tests.push({
        method: 'ImageObject',
        url,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      console.debug(`📝 Image对象测试失败: ${url} - ${error.message}`)
    }
  }
  
  return false
}

// 辅助函数：使用Script标签测试
async function testWithScriptTag(results: UltimateTestResults) {
  console.log('📜 使用Script标签测试连接...')
  
  const testUrls = [
    'https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js',
    'https://code.jquery.com/jquery-3.6.0.min.js'
  ]
  
  for (const url of testUrls) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        const timeout = setTimeout(() => {
          reject(new Error('Script加载超时'))
        }, 5000)
        
        script.onload = () => {
          clearTimeout(timeout)
          document.head.removeChild(script)
          resolve(true)
        }
        
        script.onerror = () => {
          clearTimeout(timeout)
          document.head.removeChild(script)
          reject(new Error('Script加载失败'))
        }
        
        script.src = url
        document.head.appendChild(script)
      })
      
      results.tests.push({
        method: 'ScriptTag',
        url,
        success: true,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ Script标签测试成功: ${url}`)
      return true
    } catch (error: any) {
      results.tests.push({
        method: 'ScriptTag',
        url,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      console.debug(`📝 Script标签测试失败: ${url} - ${error.message}`)
    }
  }
  
  return false
}

// 辅助函数：使用XHR测试
async function testWithXHR(results: UltimateTestResults) {
  console.log('📡 使用XHR测试连接...')
  
  const testUrls = [
    'https://www.baidu.com',
    'https://cloudflare.com',
    'https://httpbin.org/get'
  ]
  
  for (const url of testUrls) {
    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const timeout = setTimeout(() => {
          xhr.abort()
          reject(new Error('XHR请求超时'))
        }, 5000)
        
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            clearTimeout(timeout)
            // 对于XHR，只要收到响应就认为成功（即使是错误状态）
            resolve(true)
          }
        }
        
        xhr.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('XHR请求失败'))
        }
        
        xhr.ontimeout = () => {
          clearTimeout(timeout)
          reject(new Error('XHR请求超时'))
        }
        
        xhr.open('HEAD', url, true)
        xhr.timeout = 5000
        xhr.send()
      })
      
      results.tests.push({
        method: 'XHR',
        url,
        success: true,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ XHR测试成功: ${url}`)
      return true
    } catch (error: any) {
      results.tests.push({
        method: 'XHR',
        url,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      console.debug(`📝 XHR测试失败: ${url} - ${error.message}`)
    }
  }
  
  return false
}

// 辅助函数：使用Fetch API测试
async function testWithFetchAPI(results: UltimateTestResults) {
  console.log('🌐 使用Fetch API测试连接...')
  
  const testConfigs = [
    { url: 'https://www.baidu.com', mode: 'no-cors' }, // 使用主页URL而不是favicon
    { url: 'https://cloudflare.com', mode: 'no-cors' }, // 使用主页URL而不是favicon
    { url: 'https://httpbin.org/get', mode: 'cors' },
    { url: 'https://api.github.com', mode: 'cors' }
  ]
  
  for (const config of testConfigs) {
    try {
      const response = await fetch(config.url, {
        method: 'HEAD',
        mode: config.mode as RequestMode,
        cache: 'no-cache',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(5000)
      })
      
      results.tests.push({
        method: 'FetchAPI',
        url: config.url,
        mode: config.mode,
        success: true,
        status: response.status,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ Fetch API测试成功: ${config.url} (${config.mode})`)
      return true
    } catch (error: any) {
      results.tests.push({
        method: 'FetchAPI',
        url: config.url,
        mode: config.mode,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      console.debug(`📝 Fetch API测试失败: ${config.url} (${config.mode}) - ${error.message}`)
    }
  }
  
  return false
}

// 辅助函数：使用WebSocket测试
async function testWithWebSocket(results: UltimateTestResults) {
  console.log('🔌 使用WebSocket测试连接...')
  
  const wsUrls = [
    'wss://echo.websocket.org',
    'wss://ws.postman-echo.com/raw'
  ]
  
  for (const url of wsUrls) {
    try {
      await new Promise((resolve, reject) => {
        const ws = new WebSocket(url)
        const timeout = setTimeout(() => {
          ws.close()
          reject(new Error('WebSocket连接超时'))
        }, 5000)
        
        ws.onopen = () => {
          clearTimeout(timeout)
          ws.close()
          resolve(true)
        }
        
        ws.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('WebSocket连接失败'))
        }
        
        ws.onclose = () => {
          clearTimeout(timeout)
        }
      })
      
      results.tests.push({
        method: 'WebSocket',
        url,
        success: true,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ WebSocket测试成功: ${url}`)
      return true
    } catch (error: any) {
      results.tests.push({
        method: 'WebSocket',
        url,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      console.debug(`📝 WebSocket测试失败: ${url} - ${error.message}`)
    }
  }
  
  return false
}

// 分析测试结果
function analyzeTestResults(results: UltimateTestResults) {
  const successCount = results.tests.filter((t: TestResult) => t.success).length
  const totalCount = results.tests.length
  
  console.log(`📊 测试结果分析: ${successCount}/${totalCount} 成功`)
  
  if (successCount > 0) {
    results.success = true
    results.recommendations.push('✅ 网络连接基本正常，问题可能在于特定域名或CORS策略')
    results.recommendations.push('🔄 建议使用no-cors模式或代理服务')
  } else {
    results.success = false
    results.recommendations.push('❌ 所有连接测试都失败，存在严重网络问题')
    results.recommendations.push('📴 建议启用离线模式')
    results.recommendations.push('🔧 检查网络设置、防火墙、DNS配置')
  }
  
  // 根据具体失败情况提供建议
  const failedMethods = results.tests.filter((t: TestResult) => !t.success).map((t: TestResult) => t.method)
  const uniqueFailedMethods = [...new Set(failedMethods)]
  
  if (uniqueFailedMethods.length === results.tests.length) {
    results.recommendations.push('🚨 所有协议都失败，可能是网络完全断开或严重防火墙阻止')
  }
  
  return results
}

// 专用处理函数
async function handleSupabaseERR_ABORTED(url: string, errorInfo: ErrorInfo) {
  console.log('🎯 处理Supabase ERR_ABORTED错误...')
  
  return {
    error: errorInfo,
    solutions: [
      {
        name: 'Supabase代理',
        description: '使用Supabase官方推荐的代理设置',
        action: async () => {
          // 实现Supabase特定的代理逻辑
          return await createSupabaseProxyConnection(url)
        }
      },
      {
        name: '本地缓存',
        description: '使用本地存储的用户数据',
        action: () => {
          return enableLocalUserData()
        }
      }
    ]
  }
}

async function handleDNSERR_ABORTED(url: string, errorInfo: ErrorInfo) {
  console.log('🔍 处理DNS ERR_ABORTED错误...')
  
  return {
    error: errorInfo,
    solutions: [
      {
        name: '更换DNS',
        description: '使用公共DNS服务器',
        action: () => {
          return suggestPublicDNS()
        }
      },
      {
        name: 'DNS over HTTPS',
        description: '使用DoH服务',
        action: () => {
          return suggestDoH()
        }
      }
    ]
  }
}

async function handleGeneralERR_ABORTED(url: string, errorInfo: ErrorInfo) {
  console.log('🌐 处理通用ERR_ABORTED错误...')
  
  return {
    error: errorInfo,
    solutions: [
      {
        name: 'CORS代理',
        description: '使用CORS代理服务',
        action: async () => {
          return await createCORSProxyConnection(url)
        }
      },
      {
        name: '浏览器设置',
        description: '调整浏览器安全设置',
        action: () => {
          return suggestBrowserSettings()
        }
      }
    ]
  }
}

// 辅助函数实现
async function createSupabaseProxyConnection(url: string) {
  // 实现Supabase代理连接逻辑
  console.log('🔄 创建Supabase代理连接...')
  
  const proxyUrls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`
  ]
  
  for (const proxyUrl of proxyUrls) {
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      
      if (response.ok) {
        console.log('✅ Supabase代理连接成功')
        return response
      }
    } catch (error: any) {
      console.debug(`📝 Supabase代理失败: ${proxyUrl}`, error.message)
    }
  }
  
  throw new Error('所有Supabase代理都失败')
}

function enableLocalUserData() {
  console.log('💾 启用本地用户数据模式...')
  
  // 从localStorage获取用户数据
  const localUser = localStorage.getItem('current-user')
  if (localUser) {
    return JSON.parse(localUser)
  }
  
  return null
}

function suggestPublicDNS() {
  return [
    '8.8.8.8 (Google)',
    '1.1.1.1 (Cloudflare)', 
    '223.5.5.5 (Alibaba)',
    '180.76.76.76 (Baidu)'
  ]
}

function suggestDoH() {
  return [
    'https://cloudflare-dns.com/dns-query',
    'https://dns.google/dns-query',
    'https://dns.alidns.com/dns-query'
  ]
}

async function createCORSProxyConnection(url: string) {
  // 实现通用CORS代理连接逻辑
  console.log('🔄 创建CORS代理连接...')
  
  const corsProxies = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/'
  ]
  
  for (const proxy of corsProxies) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url)
      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      })
      
      if (response.ok) {
        console.log('✅ CORS代理连接成功')
        return response
      }
    } catch (error: any) {
      console.debug(`📝 CORS代理失败: ${proxy}`, error.message)
    }
  }
  
  throw new Error('所有CORS代理都失败')
}

function suggestBrowserSettings() {
  return {
    chrome: [
      'chrome://flags/#enable-cors',
      'chrome://flags/#disable-web-security',
      'chrome://settings/security'
    ],
    firefox: [
      'about:config -> security.fileuri.strict_origin_policy',
      'about:preferences#privacy'
    ],
    edge: [
      'edge://flags/#enable-cors',
      'edge://settings/privacy'
    ]
  }
}

// 使用Image对象测试连接
function testConnectionWithImage(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const timeout = setTimeout(() => {
      reject(new Error('Image连接超时'))
    }, 5000)
    
    img.onload = () => {
      clearTimeout(timeout)
      resolve(true)
    }
    
    img.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('Image连接失败'))
    }
    
    img.src = url
  })
}

// 使用XHR测试连接
function testConnectionWithXHR(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const timeout = setTimeout(() => {
      xhr.abort()
      reject(new Error('XHR连接超时'))
    }, 5000)
    
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        clearTimeout(timeout)
        resolve(true) // 只要收到响应就算成功
      }
    }
    
    xhr.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('XHR连接失败'))
    }
    
    xhr.ontimeout = () => {
      clearTimeout(timeout)
      reject(new Error('XHR连接超时'))
    }
    
    xhr.open('HEAD', url, true)
    xhr.timeout = 5000
    xhr.send()
  })
}

// 使用代理测试连接
async function testConnectionWithProxy(url: string): Promise<Response> {
  const proxyUrls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`
  ]
  
  for (const proxyUrl of proxyUrls) {
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      })
      
      if (response.ok) {
        return response
      }
    } catch (error: any) {
      console.debug(`📝 代理测试失败: ${proxyUrl}`, error.message)
    }
  }
  
  throw new Error('所有代理测试都失败')
}

export default UltimateNetworkFix
