import backupNetworkCheck from './backupNetworkCheck'

// 紧急网络绕过机制
export const emergencyNetworkBypass = {
  // 强制在线模式（用于紧急情况）
  forceOnlineMode: false,
  
  // 启用强制在线模式
  enableForceOnline: () => {
    emergencyNetworkBypass.forceOnlineMode = true
    console.log('🚨 启用强制在线模式')
    return true
  },
  
  // 禁用强制在线模式
  disableForceOnline: () => {
    emergencyNetworkBypass.forceOnlineMode = false
    console.log('✅ 禁用强制在线模式')
    return false
  },
  
  // 获取当前模式
  isForceOnline: () => emergencyNetworkBypass.forceOnlineMode,
  
  // 智能网络状态判断
  smartNetworkCheck: async (): Promise<{
    status: 'online' | 'offline' | 'force-online'
    method: string
    confidence: number // 置信度 0-1
  }> => {
    console.log('🧠 开始智能网络状态判断...')
    
    // 如果启用了强制在线模式，直接返回在线
    if (emergencyNetworkBypass.isForceOnline()) {
      return {
        status: 'force-online',
        method: 'force-online',
        confidence: 1.0
      }
    }
    
    // 方法1: 浏览器内置状态
    const browserOnline = navigator.onLine !== false
    console.log(`🌐 浏览器在线状态: ${browserOnline}`)
    
    // 方法2: 快速检测
    let quickCheckResult = false
    try {
      quickCheckResult = await backupNetworkCheck.quickCheck()
      console.log(`⚡ 快速检测结果: ${quickCheckResult}`)
    } catch (error: any) {
      console.debug('⚡ 快速检测出错:', error)
    }
    
    // 方法3: 综合检测
    let comprehensiveResult = { online: false, method: 'none', details: {} }
    try {
      comprehensiveResult = await backupNetworkCheck.comprehensiveCheck()
      console.log(`🔍 综合检测结果:`, comprehensiveResult)
    } catch (error: any) {
      console.debug('🔍 综合检测出错:', error)
    }
    
    // 智能判断逻辑
    const results = [
      { source: 'browser', online: browserOnline, weight: 0.2 },
      { source: 'quick', online: quickCheckResult, weight: 0.3 },
      { source: 'comprehensive', online: comprehensiveResult.online, weight: 0.5 }
    ]
    
    let confidence = 0
    let onlineScore = 0
    
    results.forEach(result => {
      if (result.online) {
        onlineScore += result.weight
        confidence += result.weight
      }
    })
    
    const isOnline = onlineScore >= 0.5 // 需要至少50%的置信度
    
    console.log(`📊 智能判断结果: ${isOnline ? '在线' : '离线'} (置信度: ${(confidence * 100).toFixed(1)}%)`)
    
    return {
      status: isOnline ? 'online' : 'offline',
      method: comprehensiveResult.method !== 'none' ? comprehensiveResult.method : 
              quickCheckResult ? 'quick' : 'browser',
      confidence: confidence
    }
  },
  
  // 为测试提交优化的网络检查
  optimizedForTestSubmission: async (): Promise<boolean> => {
    console.log('🎯 为测试提交优化的网络检查...')
    
    // 首先尝试快速检查
    const quickResult = await backupNetworkCheck.quickCheck()
    if (quickResult) {
      console.log('✅ 快速检查通过，认为网络在线')
      return true
    }
    
    // 如果快速检查失败，但浏览器显示在线，给予第二次机会
    if (navigator.onLine !== false) {
      console.log('🔄 快速检查失败但浏览器显示在线，尝试综合检测...')
      const comprehensiveResult = await backupNetworkCheck.comprehensiveCheck()
      
      if (comprehensiveResult.online) {
        console.log('✅ 综合检测通过，认为网络在线')
        return true
      }
    }
    
    console.log('❌ 所有检测方法都失败，认为网络离线')
    return false
  }
}

// 网络状态管理器
export const networkStateManager = {
  currentStatus: 'unknown' as 'online' | 'offline' | 'force-online' | 'unknown',
  lastCheck: null as Date | null,
  checkCount: 0,
  
  // 更新网络状态
  updateStatus: async () => {
    networkStateManager.checkCount++
    console.log(`🔄 第${networkStateManager.checkCount}次网络状态检查`)
    
    const result = await emergencyNetworkBypass.smartNetworkCheck()
    networkStateManager.currentStatus = result.status
    networkStateManager.lastCheck = new Date()
    
    console.log(`📊 网络状态更新: ${result.status} (方法: ${result.method}, 置信度: ${(result.confidence * 100).toFixed(1)}%)`)
    
    return result
  },
  
  // 获取当前状态
  getStatus: () => ({
    status: networkStateManager.currentStatus,
    lastCheck: networkStateManager.lastCheck,
    checkCount: networkStateManager.checkCount
  }),
  
  // 重置状态
  reset: () => {
    networkStateManager.currentStatus = 'unknown'
    networkStateManager.lastCheck = null
    networkStateManager.checkCount = 0
    emergencyNetworkBypass.disableForceOnline()
  }
}

export default emergencyNetworkBypass