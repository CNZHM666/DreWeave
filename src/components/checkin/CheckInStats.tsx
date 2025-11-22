import React from 'react'
import { Calendar, CheckCircle, Trophy } from 'lucide-react'

interface Props {
  currentStreak: number
  longestStreak: number
  monthCount: number
  isOnline: boolean
  onSync?: () => void
  syncing?: boolean
}

export const CheckInStats: React.FC<Props> = ({ currentStreak, longestStreak, monthCount, isOnline, onSync, syncing }) => {
  return (
    <div className="glass rounded-3xl p-8 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="space-y-2 hover:scale-105 transition-transform">
          <div className="flex items-center justify-center space-x-2">
            <Calendar className="w-6 h-6 text-green-300" />
            <span className="text-blue-800 text-shadow-light">连续签到</span>
          </div>
          <div className="text-3xl font-bold text-blue-900">{currentStreak} 天</div>
        </div>
        <div className="space-y-2 hover:scale-105 transition-transform">
          <div className="flex items-center justify-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <span className="text-blue-800 text-shadow-light">最长记录</span>
          </div>
          <div className="text-3xl font-bold text-blue-900">{longestStreak} 天</div>
        </div>
        <div className="space-y-2 hover:scale-105 transition-transform">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-6 h-6 text-blue-300" />
            <span className="text-blue-800 text-shadow-light">本月签到</span>
          </div>
          <div className="text-3xl font-bold text-blue-900">{monthCount} 次</div>
          {!isOnline && (
            <button
              onClick={onSync}
              disabled={!!syncing}
              className="mt-2 px-3 py-1 bg-[#8BC34A] text-white text-xs rounded-full hover:bg-[#7CB342] transition-colors duration-300 disabled:opacity-50"
            >
              {syncing ? '同步中...' : '尝试同步'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}