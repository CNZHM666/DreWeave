import React from 'react'
import { safeRandomUUID } from '../../lib/utils'

import type { Task, Subtask } from '../../stores/tasksStore'

export default function TaskEditorCard({ open, initial, onClose, onSave, defaultGoalId }: { open: boolean; initial?: Partial<Task>; onClose: () => void; onSave: (data: Omit<Task, 'id' | 'history'>) => void; defaultGoalId?: string }) {
  const [name, setName] = React.useState(initial?.name || '')
  const [desc, setDesc] = React.useState(initial?.description || '')
  const [priority, setPriority] = React.useState<'low'|'medium'|'high'>(initial?.priority || 'medium')
  const [due, setDue] = React.useState<string>(initial?.dueDate || '')
  const [progress, setProgress] = React.useState<number>(initial?.progress ?? 0)
  const [subs, setSubs] = React.useState<Subtask[]>(initial?.subtasks || [])

  React.useEffect(() => {
    setName(initial?.name || '')
    setDesc(initial?.description || '')
    setPriority((initial?.priority as any) || 'medium')
    setDue(initial?.dueDate || '')
    setProgress(initial?.progress ?? 0)
    setSubs(initial?.subtasks || [])
  }, [initial?.name, initial?.description, initial?.priority, initial?.dueDate, initial?.progress, initial?.subtasks])

  const addSub = () => {
    const id = safeRandomUUID()
    setSubs([...subs, { id, title: '', completed: false }])
  }
  const setSubTitle = (id: string, title: string) => {
    setSubs(subs.map(s => s.id === id ? { ...s, title } : s))
  }
  const removeSub = (id: string) => {
    setSubs(subs.filter(s => s.id !== id))
  }

  return (
    <div className={`fixed inset-0 ${open ? '' : 'hidden'} z-50`}> 
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-xl rounded-3xl bg-white/80 backdrop-blur-lg p-6 transition-transform">
        <div className="text-blue-900 font-bold text-lg mb-4">编辑任务</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" placeholder="任务名称" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="p-3 rounded-2xl bg-white/60 text-blue-900">
            <option value="low">低优先级</option>
            <option value="medium">中优先级</option>
            <option value="high">高优先级</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" />
          <input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="p-3 rounded-2xl bg-white/60 text-blue-900" placeholder="进度 0-100" />
        </div>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-3 rounded-2xl bg-white/60 text-blue-900 mb-3" rows={3} placeholder="任务描述" />
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-900 font-semibold">子任务</div>
            <button onClick={addSub} className="px-3 py-2 rounded-2xl bg-indigo-600 text-white">添加</button>
          </div>
          <div className="space-y-2">
            {subs.map(s => (
              <div key={s.id} className="flex items-center gap-2">
                <input value={s.title} onChange={(e) => setSubTitle(s.id, e.target.value)} className="flex-1 p-2 rounded-2xl bg-white/60 text-blue-900" placeholder="子任务标题" />
                <button onClick={() => removeSub(s.id)} className="px-3 py-2 rounded-2xl bg-red-600 text-white">删除</button>
              </div>
            ))}
          </div>
        </div>
        <div className="text-right">
          <button onClick={() => onSave({ name, description: desc, priority, dueDate: due, progress, subtasks: subs, goalId: defaultGoalId })} className="px-4 py-2 rounded-2xl bg-green-600 text-white">保存</button>
        </div>
      </div>
    </div>
  )
}