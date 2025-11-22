import React from 'react'

interface Props {
  goal: string
  periodStart: string | null
  periodEnd: string | null
  onSave: (goal: string, description: string, start: string | null, end: string | null) => void
}

const presets = ['早起', '读书', '运动', '冥想', '控糖']

export default function GoalSelector({ goal, periodStart, periodEnd, onSave }: Props) {
  const [value, setValue] = React.useState(goal)
  const [start, setStart] = React.useState<string>(periodStart || '')
  const [end, setEnd] = React.useState<string>(periodEnd || '')
  const [desc, setDesc] = React.useState<string>('')
  React.useEffect(() => { setValue(goal) }, [goal])
  React.useEffect(() => { setStart(periodStart || ''); setEnd(periodEnd || '') }, [periodStart, periodEnd])
  const applyGoal = (g: string) => { setValue(g) }
  const saveAll = () => { onSave(value, desc, start || null, end || null) }
  return (
    <div className="glass-light p-4 rounded-3xl bg-white/30 backdrop-blur-md">
      <div className="mb-2 text-blue-900 font-bold text-lg">自律目标</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((p) => (
          <button key={p} onClick={() => applyGoal(p)} className={`px-3 py-2 rounded-2xl ${value===p ? 'bg-blue-600 text-white' : 'bg-white/40 text-blue-900 hover:bg-white/60'}`}>{p}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 p-3 rounded-2xl bg-white/60 text-blue-900" placeholder="目标名称" />
      </div>
      <div className="mt-3">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-3 rounded-2xl bg-white/60 text-blue-900" rows={3} placeholder="目标描述（可选）" />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-900">开始日期</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="flex-1 p-3 rounded-2xl bg-white/60 text-blue-900" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-900">结束日期</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="flex-1 p-3 rounded-2xl bg-white/60 text-blue-900" />
        </div>
      </div>
      <div className="mt-3">
        <button onClick={saveAll} className="px-4 py-2 rounded-2xl bg-indigo-600 text-white">保存目标与周期</button>
      </div>
    </div>
  )
}