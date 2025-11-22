// 备用网络检测工具
export const backupNetworkCheck = {
  // 使用图片加载方式检测网络（更可靠）
  checkWithImage: async (): Promise<boolean> => {
    const testImages = [
      'https://www.baidu.com/img/baidu_resultlogo@2.png', // 百度Logo
      'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png', // Google Logo
      'https://www.cloudflare.com/favicon.ico' // Cloudflare Favicon
    ]
    
    for (const imageUrl of testImages) {
      try {
        return await new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            console.log(`✅ 图片加载成功: ${imageUrl}`)
            resolve(true)
          }
          img.onerror = () => {
            console.debug(`📝 图片加载失败: ${imageUrl}`)
            resolve(false)
          }
          img.src = imageUrl
          
          // 3秒超时
          setTimeout(() => {
            console.debug(`📝 图片加载超时: ${imageUrl}`)
            resolve(false)
          }, 3000)
        })
      } catch (error: any) {
        console.debug(`📝 图片检测出错: ${imageUrl}`, error)
        continue
      }
    }
    
    return false
  },

  // 使用DNS解析检测（通过Web API）
  checkWithDNS: async (): Promise<boolean> => {
    try {
      // 尝试使用WebRTC或其他API检测网络可达性
      if (navigator.onLine === false) {
        return false
      }
      
      // 使用fetch API访问一个极简的端点（避免使用可能触发ERR_ABORTED的URL）
      const testEndpoints = [
        'https://www.cloudflare.com/cdn-cgi/trace', // Cloudflare trace endpoint
        'https://httpbin.org/status/200', // 简单的状态检查
        'https://www.google.com/generate_204' // Google的204生成器
      ]
      
      for (const endpoint of testEndpoints) {
        try {
          const controller = new AbortController()
          setTimeout(() => controller.abort(), 3000)
          
          await fetch(endpoint, {
            method: 'GET',
            mode: 'no-cors',
            signal: controller.signal,
            cache: 'no-cache'
          })
          
          console.log(`✅ DNS检测成功: ${endpoint}`)
          return true
        } catch (error: any) {
          // 特殊处理ERR_ABORTED错误
          if (error.name === 'AbortError' || 
              error.message.includes('aborted') || 
              error.message.includes('ERR_ABORTED')) {
            console.debug(`📝 请求被中止 (${endpoint})，尝试其他地址`)
            continue
          }
          console.debug(`📝 DNS检测失败: ${endpoint}`, error)
          continue
        }
      }
      
      return false
    } catch (error: any) {
      console.debug('📝 DNS检测出错:', error)
      return false
    }
  },

  // 综合检测方法
  comprehensiveCheck: async (): Promise<{
    online: boolean
    method: string
    details: any
  }> => {
    console.log('🔍 开始综合网络检测...')
    
    const results = {
      imageCheck: false,
      dnsCheck: false,
      browserOnline: navigator.onLine,
      timestamp: new Date().toISOString()
    }
    
    // 方法1: 图片检测
    try {
      results.imageCheck = await backupNetworkCheck.checkWithImage()
      console.log(`🖼️ 图片检测结果: ${results.imageCheck ? '在线' : '离线'}`)
    } catch (error: any) {
      console.debug('🖼️ 图片检测出错:', error)
    }
    
    // 方法2: DNS检测
    try {
      results.dnsCheck = await backupNetworkCheck.checkWithDNS()
      console.log(`🌐 DNS检测结果: ${results.dnsCheck ? '在线' : '离线'}`)
    } catch (error: any) {
      console.debug('🌐 DNS检测出错:', error)
    }
    
    // 综合判断
    const isOnline = results.imageCheck || results.dnsCheck || results.browserOnline
    const primaryMethod = results.imageCheck ? 'image' : 
                         results.dnsCheck ? 'dns' : 
                         results.browserOnline ? 'browser' : 'none'
    
    console.log(`📊 综合检测结果: ${isOnline ? '在线' : '离线'} (主要方法: ${primaryMethod})`)
    
    return {
      online: isOnline,
      method: primaryMethod,
      details: results
    }
  },

  // 快速检测（用于紧急情况）
  quickCheck: async (): Promise<boolean> => {
    // 首先检查浏览器内置的在线状态
    if (navigator.onLine === false) {
      return false
    }
    
    // 快速尝试一个可靠的端点（避免使用可能触发ERR_ABORTED的URL）
    try {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 2000)
      
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-cache'
      })
      
      return true
    } catch (error: any) {
      // 特殊处理ERR_ABORTED错误
      if (error.name === 'AbortError' || 
          error.message.includes('aborted') || 
          error.message.includes('ERR_ABORTED')) {
        console.debug('📝 快速检测被中止，回退到浏览器状态')
        return navigator.onLine
      }
      
      // 如果快速检测失败，回退到浏览器状态
      console.debug('📝 快速检测失败，回退到浏览器状态:', error)
      return navigator.onLine
    }
  }
}

export default backupNetworkCheck