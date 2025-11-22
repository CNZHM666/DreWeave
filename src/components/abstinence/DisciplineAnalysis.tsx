import React from 'react'

export default function DisciplineAnalysis({ goal, periodStart, periodEnd, checkIns }: { goal: string; periodStart: string | null; periodEnd: string | null; checkIns: string[] }) {
  const inPeriod = React.useMemo(() => {
    if (!periodStart || !periodEnd) return checkIns
    return checkIns.filter(d => d >= periodStart && d <= periodEnd)
  }, [periodStart, periodEnd, checkIns])
  const totalDays = React.useMemo(() => {
    if (!periodStart || !periodEnd) return 0
    const s = new Date(periodStart)
    const e = new Date(periodEnd)
    const ms = Math.max(0, e.getTime() - s.getTime())
    return Math.floor(ms / 86400000) + 1
  }, [periodStart, periodEnd])
  const completed = inPeriod.length
  const percent = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0
  const last7Rate = React.useMemo(() => {
    const today = new Date()
    let cnt = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0')
      const iso = `${y}-${m}-${day}`
      if (checkIns.includes(iso)) cnt++
    }
    return Math.round((cnt / 7) * 100)
  }, [checkIns])
  return (
    <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
      <div className="mb-3 text-blue-900 font-bold">目标进度与分析</div>
      <div className="text-sm text-blue-800 mb-2">{goal}</div>
      <div className="w-full h-3 bg-white/40 rounded">
        <div className="h-3 bg-green-500 rounded" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
      <div className="mt-2 text-sm text-blue-900">周期完成度：{percent}%（{completed}/{totalDays || '未设置周期'}）</div>
      <div className="mt-1 text-sm text-blue-900">近7天完成率：{last7Rate}%</div>
    </div>
  )
}