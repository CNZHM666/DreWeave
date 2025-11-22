import React from 'react'
import { Circle, TreePine, CheckCircle } from 'lucide-react'

interface Props {
  canSubmit: boolean
  cooldown: number
  submitting: boolean
  hasCheckedInToday: boolean
  onClick: () => void
  isOnline: boolean
}

export const CheckInButton: React.FC<Props> = ({ canSubmit, cooldown, submitting, hasCheckedInToday, onClick, isOnline }) => {
  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => { if (canSubmit && (e.key === 'Enter' || e.key === ' ')) onClick() }}
      disabled={!canSubmit}
      className={`relative px-14 py-6 rounded-3xl text-xl font-bold transition-all duration-300 btn-glow ${
        hasCheckedInToday
          ? 'bg-[#4CAF50] text-white cursor-not-allowed'
          : isOnline
          ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white hover:scale-105 hover:shadow-lg'
          : 'bg-gradient-to-r from-orange-400 to-yellow-500 text-white hover:scale-105 hover:shadow-lg'
      }`}
      aria-label="签到"
      title={hasCheckedInToday ? '签到成功' : '签到'}
    >
      {submitting ? (
        <div className="flex items-center space-x-2">
          <div className="loading-healing" />
          <span>签到中...</span>
        </div>
      ) : hasCheckedInToday ? (
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-6 h-6" />
          <span>签到成功</span>
        </div>
      ) : cooldown > 0 ? (
        <div className="flex items-center space-x-2">
          <Circle className="w-6 h-6" />
          <span>{cooldown} 秒后可再次操作</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <TreePine className="w-6 h-6" />
          <span>签到</span>
        </div>
      )}
    </button>
  )
}