import { toast } from 'sonner'

// 性压抑量表提交错误处理
export const handleSexualRepressionSubmissionError = (error: unknown) => {
  console.error('❌ 性压抑量表提交错误:', error)
  
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // 常见错误类型和处理
  if (errorMessage.includes('Radar data generation failed')) {
    toast.error('数据生成失败', {
      description: '能力分析图表生成出错，请稍后重试或联系技术支持。',
      duration: 5000
    })
    return 'radar_generation_error'
  }
  
  if (errorMessage.includes('localStorage')) {
    toast.error('本地存储错误', {
      description: '无法保存测试结果到本地存储，请检查浏览器存储权限。',
      duration: 5000
    })
    return 'storage_error'
  }
  
  if (errorMessage.includes('Network') || errorMessage.includes('ERR_ABORTED')) {
    toast.error('网络连接问题', {
      description: '网络连接不稳定，测试结果已保存到本地，网络恢复后会自动同步。',
      duration: 5000
    })
    return 'network_error'
  }
  
  if (errorMessage.includes('timeout')) {
    toast.error('请求超时', {
      description: '服务器响应超时，请检查网络连接或稍后重试。',
      duration: 5000
    })
    return 'timeout_error'
  }
  
  // 通用错误处理
  toast.error('测试提交失败', {
    description: errorMessage.includes('离线模式') 
      ? '离线模式保存失败，请检查本地存储空间'
      : '请检查网络连接或稍后重试，如问题持续存在请联系技术支持。',
    duration: 5000
  })
  
  return 'unknown_error'
}

// 性压抑量表专用提交包装器
export const wrapSexualRepressionSubmission = async (submitFunction: () => Promise<unknown>) => {
  try {
    console.log('🧪 开始性压抑量表提交包装器')
    const result = await submitFunction()
    console.log('✅ 性压抑量表提交成功')
    return result
  } catch (error: any) {
    const errorType = handleSexualRepressionSubmissionError(error)
    console.error(`❌ 性压抑量表提交失败 [${errorType}]:`, error)
    
    // 返回一个模拟的成功结果，避免用户界面卡死
    return {
      success: false,
      error: errorType,
      fallback: true,
      message: error instanceof Error ? error.message : '提交过程中发生错误'
    }
  }
}

// 网络错误恢复建议
export const getNetworkRecoverySuggestion = (networkStatus: string, isOfflineMode: boolean) => {
  if (isOfflineMode) {
    return {
      title: '离线模式',
      message: '您当前处于离线模式，测试结果将保存在本地。',
      action: '检查网络连接'
    }
  }
  
  if (networkStatus === 'offline') {
    return {
      title: '网络断开',
      message: '网络连接已断开，请检查您的网络设置。',
      action: '重新连接网络'
    }
  }
  
  if (networkStatus === 'unknown') {
    return {
      title: '网络状态未知',
      message: '无法确定网络状态，可能影响数据同步。',
      action: '刷新网络状态'
    }
  }
  
  return {
    title: '网络正常',
    message: '网络连接正常，可以正常提交测试。',
    action: ''
  }
}