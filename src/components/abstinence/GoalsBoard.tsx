import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAbstinenceStore } from '../../stores/abstinenceStore'
import { useAuthStore } from '../../stores/authStore'
import { useAssessmentStore } from '../../stores/assessmentStore'
import { determineQuestionnaireForGoal } from '../../config/questionnaire-mapping'
import BackToHome from '../BackToHome'
import { computeGoalProgress } from '../../lib/utils'

export default function GoalsBoard() {
  const st = useAbstinenceStore()
  const navigate = useNavigate()
  const { user } = useAuthStore() as any
  const assess = useAssessmentStore()
  const goals = st.goals
  const active = goals.find(g => g.id === st.activeGoalId) || null
  const [editName, setEditName] = React.useState('')
  const [editDesc, setEditDesc] = React.useState('')
  const [editDue, setEditDue] = React.useState('')
  const [deleting, setDeleting] = React.useState(false)
  const [name, setName] = React.useState('')
  const [desc, setDesc] = React.useState('')
  const [priority, setPriority] = React.useState<'low'|'medium'|'high'>('medium')
  const [dueDate, setDueDate] = React.useState('')

  React.useEffect(() => {
    setEditName(active?.name || '')
    setEditDesc(active?.description || '')
    setEditDue(active?.dueDate || '')
  }, [active?.id])

  const saveEdit = () => {
    if (!active) return
    st.updateGoal(active.id, { name: editName, description: editDesc, dueDate: editDue }, user?.id)
    if (active.id === st.activeGoalId && editName) st.setGoal(editName, user?.id)
  }

  const saveGoal = () => {
    const id = st.addGoal(name || '新目标', desc || undefined, null, null, user?.id, priority, dueDate || undefined)
    st.setGoal(name || '新目标', user?.id)
    st.setActiveGoal(id, user?.id)
    const scale = determineQuestionnaireForGoal(name || '')
    assess.setScale(scale)
    try { console.log('[GoalsBoard.saveGoal]', { userId: user?.id, id, name, scale }) } catch {}
    setName(''); setDesc(''); setPriority('medium'); setDueDate('')
    navigate(`/discipline-journey/assessment?goalId=${id}`)
  }

  return (
    <div className="relative">
      <div className="fixed right-6 top-6 z-50">
        <BackToHome className="active:scale-95" showText={true} />
      </div>
      <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-blue-900 font-bold">当前目标</div>
          <div className="flex items-center gap-2">
            <select value={st.activeGoalId || ''} onChange={(e) => st.setActiveGoal(e.target.value, user?.id)} className="p-2 rounded-2xl bg-white/60 text-blue-900">
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
        {!active ? (
          <div className="text-blue-800">尚未选择当前目标</div>
        ) : (
          (() => {
            const { percent, completed, totalDays, last7Rate } = computeGoalProgress(active, st.checkIns)
            const overdue = (() => { if (!active.dueDate) return false; const d = new Date(active.dueDate); const t = new Date(); return d.getTime() < new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() })()
            return (
              <div className={`p-4 rounded-3xl bg-white/40 ring-2 ring-indigo-500`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-blue-900 font-semibold">{active.name}</div>
                  <div className="flex gap-2">
                    <Link to={`/goal/${active.id}`} className="px-3 py-1 rounded-2xl bg-blue-600 text-white active:scale-95">详情</Link>
                    <button
                      className="px-3 py-1 rounded-2xl bg-red-600 text-white active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={deleting}
                      onClick={() => {
                        if (!active || deleting) return
                        if (window.confirm(`确认删除目标「${active.name}」？此操作不可撤回`)) {
                          setDeleting(true)
                          try {
                            st.removeGoal(active.id, user?.id)
                            st.setActiveGoal(null, user?.id)
                          } finally {
                            setTimeout(() => setDeleting(false), 500)
                          }
                        }
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className="text-sm text-blue-800 mb-2">{active.description || '无描述'}</div>
                <div className={`mb-2 text-sm ${overdue?'text-red-600 font-semibold':'text-blue-800'}`}>截止：{active.dueDate || '未设'}</div>
                <div className="w-full h-3 bg-white/50 rounded">
                  <div className="h-3 bg-green-500 rounded" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
                </div>
                <div className="mt-2 text-xs text-blue-900">完成度：{percent}%（{completed}/{totalDays || '未设置'}） · 近7天完成率：{last7Rate}%</div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" placeholder="修改名称" />
                  <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" />
                  <button onClick={saveEdit} className="px-4 py-2 rounded-2xl bg-indigo-600 text-white active:scale-95">保存修改</button>
                </div>
                <div className="mt-3">
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full p-3 rounded-2xl bg-white/60 text-blue-900" rows={3} placeholder="修改描述" />
                </div>
              </div>
            )
          })()
        )}
      </div>
      <div className="mt-6 glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
        <div className="text-blue-900 font-bold mb-3">新增目标</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" placeholder="目标名称" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="p-3 rounded-2xl bg-white/60 text-blue-900">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="p-3 rounded-2xl bg-white/60 text-blue-900" rows={2} placeholder="目标描述" />
        </div>
        <div className="text-right">
          <button onClick={saveGoal} className="px-4 py-2 rounded-2xl bg-indigo-600 text-white active:scale-95">保存</button>
        </div>
      </div>
    </div>
  )
}