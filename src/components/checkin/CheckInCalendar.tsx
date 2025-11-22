import React from 'react'
import { CheckCircle } from 'lucide-react'

interface DayItem {
  day: number
  hasCheckIn: boolean
  isToday: boolean
  date: string
}

interface Props {
  days: Array<DayItem | null>
  monthName: string
}

export const CheckInCalendar: React.FC<Props> = ({ days, monthName }) => {
  return (
    <div className="glass rounded-3xl p-8">
      <h3 className="text-2xl font-bold mb-6 text-center text-shadow-lg text-blue-900">{monthName} 签到日历</h3>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center text-blue-100 text-opacity-90 text-shadow-light font-medium py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <div key={index} className="aspect-square flex items-center justify-center">
            {day ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                day.hasCheckIn
                  ? 'bg-[#4CAF50] text-white shadow-lg'
                  : day.isToday
                  ? 'bg-blue-500 text-white'
                  : 'bg-white bg-opacity-20 text-blue-800 hover:bg-opacity-30 text-shadow-light'
              }`}>
                {day.hasCheckIn ? <CheckCircle className="w-4 h-4" /> : day.day}
              </div>
            ) : (
              <div />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}