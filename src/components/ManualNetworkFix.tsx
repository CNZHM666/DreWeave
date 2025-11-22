import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { AlertTriangle, CheckCircle, Wifi, RefreshCw } from 'lucide-react'
import { emergencyNetworkBypass } from '../utils/emergencyNetworkBypass'
import { toast } from 'sonner'

const ManualNetworkFix: React.FC<{ onStatusChange?: (isOnline: boolean) => void }> = ({ onStatusChange }) => {
  const [isWorking, setIsWorking] = useState(false)
  const [lastResult, setLastResult] = useState<boolean | null>(null)

  const runNetworkFix = async () => {
    setIsWorking(true)
    
    try {
      console.log('🔧 开始手动网络修复流程...')
      
      // 步骤1: 启用紧急绕过模式
      console.log('🚨 步骤1: 启用紧急绕过模式')
      emergencyNetworkBypass.enableForceOnline()
      
      // 步骤2: 测试网络连接
      console.log('🧪 步骤2: 测试网络连接')
      const isOnline = await emergencyNetworkBypass.optimizedForTestSubmission()
      
      console.log(`📊 网络修复结果: ${isOnline ? '在线' : '离线'}`)
      setLastResult(isOnline)
      
      if (isOnline) {
        toast.success('网络修复成功！', {
          description: '网络连接已恢复，您可以正常提交测试了。'
        })
      } else {
        toast.warning('网络修复未成功', {
          description: '网络仍然离线，但已启用紧急模式，可以继续提交测试。'
        })
      }
      
      // 通知父组件状态变化
      if (onStatusChange) {
        onStatusChange(isOnline)
      }
      
    } catch (error: any) {
      console.error('❌ 网络修复失败:', error)
      toast.error('网络修复失败', {
        description: '请检查您的网络连接或联系技术支持。'
      })
      setLastResult(false)
    } finally {
      setIsWorking(false)
    }
  }

  const resetNetworkSettings = () => {
    console.log('🔄 重置网络设置...')
    emergencyNetworkBypass.disableForceOnline()
    setLastResult(null)
    toast.info('网络设置已重置')
  }

  return (
    <Card className="p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">网络连接修复</h3>
        <Badge variant="default">手动修复</Badge>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        如果网络状态显示异常，可以尝试使用此工具修复网络连接。
      </div>

      {lastResult !== null && (
        <div className={`mb-4 p-3 rounded-md ${lastResult ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center space-x-2">
            {lastResult ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">网络连接已恢复</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">网络仍然离线，但已启用紧急模式</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <Button
          onClick={runNetworkFix}
          disabled={isWorking}

          className="flex-1"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isWorking ? 'animate-spin' : ''}`} />
          {isWorking ? '修复中...' : '修复网络'}
        </Button>
        
        <Button
          onClick={resetNetworkSettings}
          disabled={isWorking}

          variant="secondary"
        >
          重置
        </Button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        💡 提示：此工具会尝试多种方法恢复网络连接，包括启用紧急在线模式。
      </div>
    </Card>
  )
}

export default ManualNetworkFix