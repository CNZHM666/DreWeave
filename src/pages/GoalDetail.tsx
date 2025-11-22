import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAbstinenceStore } from '../stores/abstinenceStore'
import { useTasksStore } from '../stores/tasksStore'
import TaskCard from '../components/tasks/TaskCard'
import TaskEditorCard from '../components/tasks/TaskEditorCard'
import { useAuthStore } from '../stores/authStore'
import { ArrowLeft, Target, TrendingUp, Calendar as CalendarIcon, Award, CheckCircle } from 'lucide-react'

function barColor(p: number) { if (p <= 0) return 'bg-red-500'; if (p < 100) return 'bg-yellow-500'; return 'bg-green-500' }

export default function GoalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const st = useAbstinenceStore()
  const tasksStore = useTasksStore()
  const { user } = useAuthStore()
  const [taskOpen, setTaskOpen] = React.useState(false)
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null)
  const [filterStart, setFilterStart] = React.useState('')
  const [filterEnd, setFilterEnd] = React.useState('')
  const [keyword, setKeyword] = React.useState('')
  const [noteOpen, setNoteOpen] = React.useState(false)
  const [noteText, setNoteText] = React.useState('')
  const [noteDate, setNoteDate] = React.useState<string>('')
  const goal = st.goals.find(g => g.id === id) || null
  const name = goal?.name || st.goal
  const start = goal?.start ?? st.periodStart
  const end = goal?.end ?? st.periodEnd
  const percent = React.useMemo(() => {
    if (!start || !end) return 0
    const s = new Date(start); const e = new Date(end)
    const totalMs = Math.max(0, e.getTime() - s.getTime())
    const totalDays = Math.floor(totalMs / 86400000) + 1
    const completed = st.checkIns.filter(d => d >= start && d <= end).length
    return totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0
  }, [start, end, st.checkIns])

  const last7 = React.useMemo(() => {
    const today = new Date(); const arr: { date: string; progress: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0')
      const iso = `${y}-${m}-${day}`
      const v = st.dailyStatus[iso]
      arr.push({ date: iso, progress: v?.progress ?? 0 })
    }
    return arr
  }, [st.dailyStatus])

  React.useEffect(() => {
    tasksStore.load(user?.id)
  }, [user?.id])

  const relatedTasks = React.useMemo(() => tasksStore.tasks.filter(t => t.goalId === id), [tasksStore.tasks, id])
  const filteredNotes = React.useMemo(() => {
    return Object.entries(st.dailyStatus)
      .filter(([date, v]) => v.goalId === id && (v.note || '').trim().length > 0)
      .filter(([date]) => (!filterStart || date >= filterStart) && (!filterEnd || date <= filterEnd))
      .filter(([_, v]) => keyword ? (v.note || '').toLowerCase().includes(keyword.toLowerCase()) : true)
      .sort((a, b) => b[0].localeCompare(a[0]))
  }, [st.dailyStatus, id, filterStart, filterEnd, keyword])

  return (
    <div className="min-h-screen gradient-healing p-6">
      <div className="max-w-5xl mx-auto">
        <div className="fixed right-6 top-6 z-50">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-700 hover:from-primary-700 hover:to-accent-800 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg border border-white border-opacity-30"
            title="返回"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">返回</span>
          </button>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white">目标详情</h1>
          <p className="text-blue-100">{name}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
            <div className="text-blue-900 font-bold mb-2">进度概览</div>
            <div className="w-full h-3 bg-white/40 rounded">
              <div className={`h-3 rounded ${barColor(percent)}`} style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-1 text-sm text-blue-900">总进度：{percent}%</div>
          </div>
          <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
            <div className="text-blue-900 font-bold mb-2">优化建议</div>
            <div className="text-sm text-blue-800">{percent===0?'设置最小可行任务，快速开始':percent<50?'将目标拆分为更细分阶段并设定时间块':percent<100?'优先处理关键任务，避免低价值活动':'总结经验并考虑设置下一阶段目标'}</div>
          </div>
        </div>
        <div className="mt-6 glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
          <div className="text-blue-900 font-bold mb-2">图标进程</div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <Target className={`${percent>=25?'text-green-600':'text-blue-300'} w-8 h-8 mx-auto`} />
              <div className="text-xs text-blue-800 mt-1">启动(25%)</div>
            </div>
            <div>
              <TrendingUp className={`${percent>=50?'text-green-600':'text-blue-300'} w-8 h-8 mx-auto`} />
              <div className="text-xs text-blue-800 mt-1">推进(50%)</div>
            </div>
            <div>
              <CalendarIcon className={`${percent>=75?'text-green-600':'text-blue-300'} w-8 h-8 mx-auto`} />
              <div className="text-xs text-blue-800 mt-1">稳定(75%)</div>
            </div>
            <div>
              <Award className={`${percent>=100?'text-green-600':'text-blue-300'} w-8 h-8 mx-auto`} />
              <div className="text-xs text-blue-800 mt-1">达成(100%)</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-900 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>当前进度：{percent}%</span>
          </div>
        </div>
        <div className="mt-6 glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
          <div className="text-blue-900 font-bold mb-2">近7天进度</div>
          <div className="grid grid-cols-7 gap-2">
            {last7.map(item => (
              <div key={item.date} className="text-center">
                <div className="h-20 w-full bg-white/40 rounded flex items-end">
                  <div className="w-full bg-blue-600 rounded" style={{ height: `${Math.min(100, Math.max(0, item.progress))}%` }} />
                </div>
                <div className="text-xs text-blue-800 mt-1">{item.date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-900 font-bold">关联任务</div>
            <button className="px-4 py-2 rounded-2xl bg-indigo-600 text-white active:scale-95" onClick={() => { setEditingTaskId(null); setTaskOpen(true) }}>新建/编辑任务</button>
          </div>
          {relatedTasks.length === 0 ? (
            <div className="text-blue-800">暂无关联任务</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedTasks.map(t => (
                <div key={t.id}>
                  <TaskCard t={t} />
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => { setEditingTaskId(t.id); setTaskOpen(true) }} className="px-3 py-2 rounded-2xl bg-blue-600 text-white active:scale-95">编辑</button>
                    <button onClick={() => tasksStore.remove(t.id)} className="px-3 py-2 rounded-2xl bg-red-600 text白 active:scale-95">删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <TaskEditorCard
          open={taskOpen}
          initial={editingTaskId ? (tasksStore.tasks.find(x => x.id === editingTaskId) || undefined) : undefined}
          onClose={() => setTaskOpen(false)}
          onSave={(data) => {
            if (editingTaskId) tasksStore.update(editingTaskId, data)
            else tasksStore.add(data)
            setTaskOpen(false)
            setEditingTaskId(null)
          }}
          defaultGoalId={id}
        />
        <div className="mt-6 glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-900 font-bold">关联每日心得</div>
            <button className="px-3 py-2 rounded-2xl bg-indigo-600 text-white active:scale-95" onClick={() => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); const todayISO = `${y}-${m}-${day}`; setNoteDate(todayISO); setNoteText(st.dailyStatus[todayISO]?.note || ''); setNoteOpen(true) }}>新增每日心得</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-900">开始</span>
              <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="flex-1 p-2 rounded-2xl bg-white/60 text-blue-900" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-900">结束</span>
              <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="flex-1 p-2 rounded-2xl bg-white/60 text-blue-900" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-900">关键词</span>
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="flex-1 p-2 rounded-2xl bg-white/60 text-blue-900" placeholder="按关键词筛选" />
            </div>
          </div>
          <div className="text-right mb-3">
            <button className="px-3 py-2 rounded-2xl bg-green-600 text-white active:scale-95" onClick={() => {
              const lines = filteredNotes.map(([date, v]) => `${date}\n${(v.note||'').trim()}\n`).join('\n')
              const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `notes_${id || 'goal'}.txt`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}>导出为文本</button>
          </div>
          <ul className="space-y-2">
            {filteredNotes.map(([date, v]) => (
              <li key={date} className="p-3 rounded-2xl bg-white/50">
                <div className="text-blue-900 font-semibold mb-1">{date}</div>
                <div className="text-sm text-blue-800 whitespace-pre-wrap">{v.note}</div>
                <div className="mt-2 text-right">
                  <button className="px-3 py-1 rounded-2xl bg-blue-600 text-white active:scale-95" onClick={() => { setNoteDate(date); setNoteText(v.note || ''); setNoteOpen(true) }}>编辑该日心得</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {noteOpen && (
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setNoteOpen(false)} />
            <div className="relative z-10 w-[92vw] max-w-md glass-light p-4 rounded-3xl bg-white/70 backdrop-blur-md">
              <div className="text-blue-900 font-bold mb-2">新增每日心得</div>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-blue-900">日期</span>
                <input type="date" value={noteDate} onChange={(e) => { const v = e.target.value; setNoteDate(v); setNoteText(st.dailyStatus[v]?.note || '') }} className="flex-1 p-2 rounded-2xl bg-white/60 text-blue-900" />
              </div>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full p-3 rounded-2xl bg-white/60 text-blue-900" rows={4} placeholder="记录今天的心得与反思" />
              <div className="mt-3 text-right flex items-center justify-end gap-2">
                <button className="px-4 py-2 rounded-2xl bg-gray-300 text-blue-900" onClick={() => setNoteOpen(false)}>取消</button>
                <button className="px-4 py-2 rounded-2xl bg-indigo-600 text-white" onClick={() => {
                  const iso = noteDate || (() => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` })()
                  const ds = st.dailyStatus[iso]
                  const stt = ds?.status || 'in_progress'
                  const prog = ds?.progress ?? 0
                  st.setDailyStatus(iso, { status: stt, progress: prog, note: noteText, goalId: id || undefined }, user?.id)
                  setNoteOpen(false)
                }}>保存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}