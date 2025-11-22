import React from 'react'

export default function DailyNotesPanel({ dailyStatus, goals }: { dailyStatus: Record<string, { status: 'completed' | 'in_progress' | 'not_started'; progress: number; note?: string; goalId?: string }>; goals: Array<{ id: string; name: string }> }) {
  const [q, setQ] = React.useState('')
  const [gid, setGid] = React.useState<string | ''>('')
  const entries = React.useMemo(() => {
    return Object.entries(dailyStatus)
      .filter(([_, v]) => (v.note || '').trim().length > 0)
      .filter(([_, v]) => gid ? v.goalId === gid : true)
      .filter(([_, v]) => q ? (v.note || '').toLowerCase().includes(q.toLowerCase()) : true)
      .sort((a, b) => b[0].localeCompare(a[0]))
  }, [dailyStatus, q, gid])
  if (entries.length === 0) return (
    <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
      <div className="text-blue-900 font-bold mb-3">每日心得</div>
      <div className="text-blue-800">暂无心得</div>
    </div>
  )
  return (
    <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
      <div className="text-blue-900 font-bold mb-3">每日心得</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" placeholder="搜索心得关键词" />
        <select value={gid} onChange={(e) => setGid(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900">
          <option value="">全部目标</option>
          {goals.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
        </select>
      </div>
      <ul className="space-y-3">
        {entries.map(([date, v]) => (
          <li key={date} className="p-3 rounded-2xl bg-white/50">
            <div className="text-blue-900 font-semibold mb-1">{date} · {(goals.find(g => g.id === v.goalId)?.name) || '未关联目标'}</div>
            <div className="text-sm text-blue-800 whitespace-pre-wrap">{v.note}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}