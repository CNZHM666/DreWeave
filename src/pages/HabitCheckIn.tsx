import React from 'react'
import { useAuthStore } from '../stores/authStore'
import { useAbstinenceStore } from '../stores/abstinenceStore'
import CalendarGrid from '../components/abstinence/CalendarGrid'
import StatsCard from '../components/abstinence/StatsCard'
import DisciplineAnalysis from '../components/abstinence/DisciplineAnalysis'
import GoalSelector from '../components/abstinence/GoalSelector'
import TreeGrowth from '../components/abstinence/TreeGrowth'
import GoalsBoard from '../components/abstinence/GoalsBoard'

export default function HabitCheckIn() {
  const { user } = useAuthStore()
  const st = useAbstinenceStore()
  const uid = user?.id

  React.useEffect(() => {
    st.init(uid || undefined)
  }, [uid])


  React.useEffect(() => {
    const recomputeOnFocus = () => st.recompute()
    window.addEventListener('visibilitychange', recomputeOnFocus)
    window.addEventListener('focus', recomputeOnFocus)
    return () => {
      window.removeEventListener('visibilitychange', recomputeOnFocus)
      window.removeEventListener('focus', recomputeOnFocus)
    }
  }, [])

  const checkedSet = React.useMemo(() => new Set(st.checkIns), [st.checkIns])
  const [growthVisible, setGrowthVisible] = React.useState(false)
  const [infoDate, setInfoDate] = React.useState<string | null>(null)

  return (
    <div className="min-h-screen gradient-healing p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white">自律之旅</h1>
          <p className="text-blue-100">设定目标，日历打卡，持续自律</p>
        </div>
        
        <div className="mb-6">
          <GoalsBoard />
        </div>
        <div className="glass p-6 rounded-3xl bg-white/20 backdrop-blur-lg mb-6">
          <CalendarGrid
            year={st.currentMonth.year}
            month={st.currentMonth.month}
            checked={checkedSet}
            onPrevMonth={() => st.prevMonth()}
            onNextMonth={() => st.nextMonth()}
            onToggleDate={(iso) => { const wasChecked = st.checkIns.includes(iso); st.toggleCheckIn(iso, uid || undefined); if (!wasChecked && iso === (() => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` })()) setGrowthVisible(true) }}
            periodStartISO={st.periodStart || undefined}
            periodEndISO={st.periodEnd || undefined}
            statusByDate={st.dailyStatus}
            onCellInfo={(iso) => setInfoDate(iso)}
            
          />
        </div>
        <div className="glass-light p-6 rounded-3xl bg-white/20 backdrop-blur-lg">
          <StatsCard total={st.totalCount} streak={st.streakCount} stage={st.treeStage} />
        </div>
        {growthVisible && <TreeGrowth stage={st.treeStage} visible={growthVisible} onDone={() => setGrowthVisible(false)} />}
        {infoDate && (
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setInfoDate(null)} />
            <div className="relative z-10 w-80 max-w-[90vw] glass-light p-4 rounded-3xl bg-white/70 backdrop-blur-md">
              <div className="text-blue-900 font-bold mb-2">{st.goal} · {infoDate}</div>
              {(() => {
                const ds = st.dailyStatus[infoDate!]
                const status = ds?.status || 'not_started'
                const progress = ds?.progress ?? 0
                const note = ds?.note || '无备注'
                return (
                  <div>
                    <div className="mb-2 text-sm">进度：{progress}%</div>
                    <div className="mb-2 text-sm">状态：{status === 'completed' ? '已完成' : status === 'in_progress' ? '进行中' : '未开始'}</div>
                    <div className="text-sm">备注：{note}</div>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="text-sm text-blue-900">更新进度</label>
                        <input type="range" min={0} max={100} defaultValue={progress} onChange={(e) => st.setDailyStatus(infoDate!, { status: 'in_progress', progress: Number(e.target.value), note: ds?.note }, uid || undefined)} className="w-full" />
                      </div>
                      <div>
                        <label className="text-sm text-blue-900">备注</label>
                        <textarea defaultValue={ds?.note || ''} onBlur={(e) => st.setDailyStatus(infoDate!, { status: ds?.status || 'in_progress', progress: ds?.progress ?? 0, note: e.target.value }, uid || undefined)} className="w-full p-2 rounded-2xl bg-white/60 text-blue-900" rows={3} placeholder="填写备注" />
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-2 rounded-2xl bg-blue-600 text-white" onClick={() => st.setDailyStatus(infoDate!, { status: 'in_progress', progress: ds?.progress ?? 0, note: ds?.note }, uid || undefined)}>保存进度</button>
                        <button className="px-3 py-2 rounded-2xl bg-green-600 text-white" onClick={() => st.setDailyStatus(infoDate!, { status: 'completed', progress: 100, note: ds?.note }, uid || undefined)}>标记完成</button>
                      </div>
                    </div>
                  </div>
                )
              })()}
              <div className="mt-3 text-right">
                <button className="px-4 py-2 rounded-2xl bg-indigo-600 text-white" onClick={() => setInfoDate(null)}>关闭</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}