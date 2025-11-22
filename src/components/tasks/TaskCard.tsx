import React from 'react'
import { useTasksStore, Task } from '../../stores/tasksStore'

function barColor(p: number) {
  if (p <= 0) return 'bg-red-500'
  if (p < 100) return 'bg-yellow-500'
  return 'bg-green-500'
}

function suggest(task: Task): string {
  const now = new Date()
  const due = task.dueDate ? new Date(task.dueDate) : null
  if (task.progress === 0) return '从最小可行子任务开始，确保快速起步'
  if (task.progress < 50) return '将任务拆分为更细的子任务并设定时间块'
  if (task.progress < 100) return '优先处理高优子任务，避免分心'
  if (due && now > due) return '任务已超期，考虑调整范围或延长截止日期'
  return '维护成果，总结经验并归档'
}

export default function TaskCard({ t }: { t: Task }) {
  const store = useTasksStore()
  const [open, setOpen] = React.useState(false)
  const toggle = () => setOpen(!open)
  const setProgress = (n: number) => store.setProgress(t.id, n)
  const toggleSub = (sid: string) => store.toggleSubtask(t.id, sid)

  return (
    <div className="glass-light p-5 rounded-3xl bg-white/20 backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-blue-900 font-bold text-lg">{t.name}</div>
          <div className="text-blue-800 text-sm">{t.description || ''}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-2xl ${t.priority==='high'?'bg-red-500 text-white':t.priority==='medium'?'bg-yellow-500 text-white':'bg-green-500 text-white'}`}>{t.priority==='high'?'高':t.priority==='medium'?'中':'低'}</span>
          <button onClick={toggle} className="px-3 py-2 rounded-2xl bg-indigo-600 text-white">{open? '收起详情' : '展开详情'}</button>
        </div>
      </div>
      <div className="mt-3">
        <div className="w-full h-3 bg-white/40 rounded">
          <div className={`h-3 rounded ${barColor(t.progress)}`} style={{ width: `${t.progress}%` }} />
        </div>
        <div className="mt-1 text-sm text-blue-900">进度：{t.progress}%</div>
      </div>
      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={100} defaultValue={t.progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <div className="text-blue-900 font-semibold mb-2">子任务</div>
            <ul className="space-y-2">
              {t.subtasks.map(s => (
                <li key={s.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={s.completed} onChange={() => toggleSub(s.id)} />
                  <span className={`text-blue-900 ${s.completed?'line-through':''}`}>{s.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-blue-900 font-semibold mb-1">智能建议</div>
            <div className="text-sm text-blue-800">{suggest(t)}</div>
          </div>
          <div>
            <div className="text-blue-900 font-semibold mb-1">历史记录</div>
            <ul className="text-sm text-blue-800 space-y-1">
              {t.history.slice().reverse().map(h => (
                <li key={h.ts}>{new Date(h.ts).toLocaleString()} · {h.change}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}