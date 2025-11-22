import React from 'react'
import { Link } from 'react-router-dom'

export default function CurrentGoalSummary({ name, start, end, checkIns, goalId }: { name: string; start: string | null; end: string | null; checkIns: string[]; goalId?: string | null }) {
  const percent = React.useMemo(() => {
    if (!start || !end) return 0
    const s = new Date(start)
    const e = new Date(end)
    const totalMs = Math.max(0, e.getTime() - s.getTime())
    const totalDays = Math.floor(totalMs / 86400000) + 1
    const completed = checkIns.filter(d => d >= start && d <= end).length
    return totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0
  }, [start, end, checkIns])
  const eta = end ? new Date(end).toLocaleDateString() : '未设置'
  return (
    <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
      <div className="text-blue-900 font-bold mb-2">当前目标</div>
      <div className="text-blue-800">
        {goalId ? <Link to={`/goal/${goalId}`} className="underline underline-offset-2 hover:text-blue-600">{name || '未设置'}</Link> : (name || '未设置')}
      </div>
      <div className="mt-3">
        <div className="w-full h-3 bg-white/40 rounded">
          <div className="h-3 bg-green-500 rounded" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
        <div className="mt-1 text-sm text-blue-900">进度：{percent}%</div>
        <div className="mt-1 text-sm text-blue-900">预计完成时间：{eta}</div>
      </div>
    </div>
  )
}