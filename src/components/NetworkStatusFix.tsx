import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Wifi, WifiOff, RefreshCw, AlertCircle, Power } from 'lucide-react'
import { emergencyNetworkBypass } from '../utils/emergencyNetworkBypass'

const NetworkStatusFix: React.FC = () => {
  const { networkStatus, isOfflineMode, checkNetworkStatus } = useAuthStore()
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [forceOnlineEnabled, setForceOnlineEnabled] = useState(false)

  const handleCheckNetwork = async () => {
    setIsChecking(true)
    try {
      await checkNetworkStatus()
      setLastCheck(new Date())
    } catch (error: any) {
      console.error('网络检查失败:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleToggleForceOnline = () => {
    const newState = !forceOnlineEnabled
    if (newState) {
      emergencyNetworkBypass.enableForceOnline()
      setForceOnlineEnabled(true)
    } else {
      emergencyNetworkBypass.disableForceOnline()
      setForceOnlineEnabled(false)
    }
  }

  const getStatusColor = () => {
    if (networkStatus === 'online') return 'bg-green-500'
    if (networkStatus === 'offline') return 'bg-red-500'
    return 'bg-yellow-500'
  }

  const getStatusIcon = () => {
    if (networkStatus === 'online') return <Wifi className="w-4 h-4" />
    return <WifiOff className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (isOfflineMode) return '离线模式已启用'
    if (networkStatus === 'online') return '网络连接正常'
    if (networkStatus === 'offline') return '网络连接断开'
    return '网络状态未知'
  }

  // 自动检查网络状态
  useEffect(() => {
    const interval = setInterval(() => {
      checkNetworkStatus()
    }, 30000) // 每30秒检查一次

    return () => clearInterval(interval)
  }, [checkNetworkStatus])

  return (
    <Card className="p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium">网络状态</span>
        </div>
        <Badge variant={networkStatus === 'online' ? 'success' : 'error'}>
          {getStatusIcon()}
          <span className="ml-1">{networkStatus}</span>
        </Badge>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        {getStatusText()}
      </div>

      {lastCheck && (
        <div className="text-xs text-gray-500 mb-3">
          最后检查: {lastCheck.toLocaleTimeString()}
        </div>
      )}

      <div className="flex space-x-2 mb-3">
        <Button
          onClick={handleCheckNetwork}
          disabled={isChecking}

          variant="secondary"
          className="flex-1"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
          重新检查
        </Button>
        <Button
          onClick={handleToggleForceOnline}

          variant={forceOnlineEnabled ? 'secondary' : 'ghost'}
          className="flex-1"
        >
          <Power className="w-3 h-3 mr-1" />
          {forceOnlineEnabled ? '关闭强制在线' : '强制在线'}
        </Button>
      </div>

      {isOfflineMode && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">离线模式提示</p>
              <p>您的数据将保存在本地，网络恢复后会自动同步。</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default NetworkStatusFix