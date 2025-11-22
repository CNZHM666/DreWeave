import React from 'react'

export default function GoalManager({ goal, periodStart, periodEnd, onSave }: { goal: string; periodStart: string | null; periodEnd: string | null; onSave: (goal: string, start: string | null, end: string | null) => void }) {
  const [name, setName] = React.useState(goal)
  const [start, setStart] = React.useState<string>(periodStart || '')
  const [end, setEnd] = React.useState<string>(periodEnd || '')
  React.useEffect(() => { setName(goal) }, [goal])
  React.useEffect(() => { setStart(periodStart || ''); setEnd(periodEnd || '') }, [periodStart, periodEnd])
  return (
    <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
      <div className="text-blue-900 font-bold mb-3">目标管理</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" placeholder="目标名称" />
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" />
      </div>
      <div className="mt-3 text-right">
        <button className="px-4 py-2 rounded-2xl bg-indigo-600 text-white" onClick={() => onSave(name, start || null, end || null)}>保存修改</button>
      </div>
    </div>
  )
}