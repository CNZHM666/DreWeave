import React from 'react'
import { Link } from 'react-router-dom'

export default function GoalPanel({ goals, activeGoalId, checkIns, onAdd, onUpdate, onRemove, onSetActive, onSaveDailyNote, todayNote }: { goals: Array<{ id: string; name: string; description?: string; start: string | null; end: string | null }>; activeGoalId: string | null; checkIns: string[]; onAdd: (name: string, description: string | undefined, start: string | null, end: string | null) => void; onUpdate: (id: string, patch: { name?: string; description?: string; start?: string | null; end?: string | null }) => void; onRemove: (id: string) => void; onSetActive: (id: string | null) => void; onSaveDailyNote: (note: string) => void; todayNote?: string }) {
  const active = React.useMemo(() => goals.find(g => g.id === activeGoalId) || null, [goals, activeGoalId])
  const [name, setName] = React.useState(active?.name || '')
  const [start, setStart] = React.useState<string>(active?.start || '')
  const [end, setEnd] = React.useState<string>(active?.end || '')
  const [desc, setDesc] = React.useState<string>(active?.description || '')
  const [note, setNote] = React.useState<string>(todayNote || '')
  const [saved, setSaved] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string>('')
  React.useEffect(() => { setName(active?.name || ''); setStart(active?.start || ''); setEnd(active?.end || ''); setDesc(active?.description || '') }, [active?.name, active?.start, active?.end, active?.description])
  React.useEffect(() => { setNote(todayNote || '') }, [todayNote])
  const inPeriod = React.useMemo(() => {
    if (!start || !end) return checkIns
    return checkIns.filter(d => d >= start && d <= end)
  }, [start, end, checkIns])
  const totalDays = React.useMemo(() => {
    if (!start || !end) return 0
    const s = new Date(start)
    const e = new Date(end)
    const ms = Math.max(0, e.getTime() - s.getTime())
    return Math.floor(ms / 86400000) + 1
  }, [start, end])
  const completed = inPeriod.length
  const percent = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0
  const last7Rate = React.useMemo(() => {
    const today = new Date()
    let cnt = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0')
      const iso = `${y}-${m}-${dd}`
      if (checkIns.includes(iso)) cnt++
    }
    return Math.round((cnt / 7) * 100)
  }, [checkIns])
  return (
    <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
      <div className="text-blue-900 font-bold mb-3">自律目标</div>
      {saved && <div className="mb-3 px-3 py-2 rounded-2xl bg-green-600 text-white">已保存</div>}
      {active && <div className="mb-2 text-blue-800">{active.description || ''}</div>}
      {error && <div className="mb-3 px-3 py-2 rounded-2xl bg-red-600 text-white">{error}</div>}
      {goals.length === 0 ? (
        <div className="text-blue-800">尚未设置目标，请在此保存</div>
      ) : (
        <div className="mb-3 text-blue-900 font-semibold">当前目标：{active?.name || '未选择'}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" placeholder="目标名称" />
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" />
      </div>
      <div className="mb-4">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-3 rounded-2xl bg-white/60 text-blue-900" rows={3} placeholder="目标描述" />
      </div>
      <div className="flex justify-end gap-2 mb-4">
        <button className={`px-4 py-2 rounded-2xl ${saving ? 'bg-indigo-400' : 'bg-indigo-600'} text-white`} disabled={saving} onClick={async () => { try { setSaving(true); setError(''); if (active) { await onUpdate(active.id, { name, description: desc, start: start || null, end: end || null }); setSaved(true) } else { await onAdd(name || '新目标', desc || undefined, start || null, end || null); setSaved(true); setName(''); setStart(''); setEnd(''); setDesc('') } setTimeout(() => setSaved(false), 1600) } catch (e: any) { setError(e?.message || '保存失败'); } finally { setSaving(false) } }}>
          保存
        </button>
        {active && <button className="px-4 py-2 rounded-2xl bg-red-600 text-white" onClick={() => onRemove(active.id)}>删除</button>}
        {active && <Link to={`/goal/${active.id}`} className="px-4 py-2 rounded-2xl bg-blue-600 text-white">查看详情</Link>}
      </div>
      
    </div>
  )
}