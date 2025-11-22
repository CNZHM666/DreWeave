import React from 'react'
import { useAuthStore } from '../stores/authStore'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

export const OfflineModeToggle: React.FC = () => {
  const { isOfflineMode, networkStatus, switchToOfflineMode, switchToOnlineMode, checkNetworkStatus } = useAuthStore()
  
  const handleToggleOffline = async () => {
    if (!isOfflineMode) {
      const confirm = window.confirm(
        '确定要切换到离线模式吗？\n\n' +
        '离线模式下：\n' +
        '✅ 可以正常注册和登录\n' +
        '✅ 数据将保存在本地\n' +
        '⚠️ 无法同步到云端\n' +
        '⚠️ 更换设备后数据不会同步'
      )
      
      if (confirm) {
        switchToOfflineMode()
      }
    } else {
      const status = await checkNetworkStatus()
      if (status === 'online') {
        switchToOnlineMode()
        alert('网络已恢复，已切换到在线模式。')
      } else {
        alert('网络仍未恢复，请继续离线使用。')
      }
    }
  }
  
  const getNetworkIcon = () => {
    if (isOfflineMode) return <WifiOff className="w-4 h-4" />
    if (networkStatus === 'online') return <Wifi className="w-4 h-4" />
    return <AlertCircle className="w-4 h-4" />
  }
  
  const getNetworkText = () => {
    if (isOfflineMode) return '离线模式'
    if (networkStatus === 'online') return '在线模式'
    return '网络异常'
  }
  
  const getButtonClass = () => {
    const baseClass = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
    
    if (isOfflineMode) {
      return `${baseClass} bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100`
    }
    
    if (networkStatus === 'online') {
      return `${baseClass} bg-green-50 text-green-700 border-green-200 hover:bg-green-100`
    }
    
    return `${baseClass} bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100`
  }
  
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleToggleOffline}
        className={getButtonClass()}
        title={isOfflineMode ? '点击检查网络状态' : '点击切换到离线模式'}
      >
        {getNetworkIcon()}
        <span>{getNetworkText()}</span>
      </button>
      
      {isOfflineMode && (
        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3" />
            <span className="font-medium">离线模式说明</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-orange-700">
            <li>您正在使用离线模式</li>
            <li>所有数据保存在本地设备</li>
            <li>功能完全正常，无需网络</li>
            <li>点击上方按钮可检查网络状态</li>
          </ul>
        </div>
      )}
      
      {networkStatus === 'offline' && !isOfflineMode && (
        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3" />
            <span className="font-medium">网络连接异常</span>
          </div>
          <p className="text-yellow-700">
            检测到网络问题，建议切换到离线模式以确保正常使用。
          </p>
        </div>
      )}
    </div>
  )
}
