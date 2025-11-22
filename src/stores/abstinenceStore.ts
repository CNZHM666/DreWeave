import { create } from 'zustand'
import { safeRandomUUID } from '../lib/utils'

type YearMonth = { year: number; month: number }

interface AbstinenceState {
  goal: string
  periodStart: string | null
  periodEnd: string | null
  checkIns: string[]
  totalCheckins: number
  treeStage: 'seedling' | 'sapling' | 'young' | 'mature'
  dailyStatus: Record<string, { status: 'completed' | 'in_progress' | 'not_started'; progress: number; note?: string; goalId?: string }>
  pendingSync: any[]
  goals: Array<{ id: string; name: string; description?: string; start: string | null; end: string | null; priority?: 'low'|'medium'|'high'; dueDate?: string }>
  activeGoalId: string | null
  currentMonth: YearMonth
  totalCount: number
  streakCount: number
  init: (userId?: string) => void
  setGoal: (goal: string, userId?: string) => void
  setPeriod: (start: string | null, end: string | null, userId?: string) => void
  setDailyStatus: (dateISO: string, payload: { status: 'completed' | 'in_progress' | 'not_started'; progress: number; note?: string; goalId?: string }, userId?: string) => void
  toggleCheckIn: (dateISO: string, userId?: string) => void
  syncToCloud: (userId?: string) => Promise<void>
  addGoal: (name: string, description: string | undefined, start: string | null, end: string | null, userId?: string, priority?: 'low'|'medium'|'high', dueDate?: string) => string
  updateGoal: (id: string, patch: { name?: string; description?: string; start?: string | null; end?: string | null; priority?: 'low'|'medium'|'high'; dueDate?: string }, userId?: string) => void
  removeGoal: (id: string, userId?: string) => void
  setActiveGoal: (id: string | null, userId?: string) => void
  nextMonth: () => void
  prevMonth: () => void
  recompute: () => void
}

function ymNow(): YearMonth {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

function getKey(prefix: string, userId?: string) {
  return userId ? `${prefix}_${userId}` : prefix
}

function computeTotals(checkIns: string[]): number {
  return checkIns.length
}

function computeStreak(checkIns: string[]): number {
  const s = new Set(checkIns)
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 3650; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const key = `${y}-${m}-${day}`
    if (s.has(key)) streak++
    else break
  }
  return streak
}

function stageByCount(n: number): 'seedling' | 'sapling' | 'young' | 'mature' {
  if (n <= 0) return 'seedling'
  if (n <= 5) return 'seedling'
  if (n <= 15) return 'sapling'
  if (n <= 30) return 'young'
  return 'mature'
}

export const useAbstinenceStore = create<AbstinenceState>()((set, get) => ({
  goal: '自律目标',
  periodStart: null,
  periodEnd: null,
  checkIns: [],
  totalCheckins: 0,
  treeStage: 'seedling',
  dailyStatus: {},
  pendingSync: [],
  goals: [],
  activeGoalId: null,
  currentMonth: ymNow(),
  totalCount: 0,
  streakCount: 0,
  init: (userId?: string) => {
    try {
      const goalRaw = localStorage.getItem(getKey('dreweave_discipline_goal', userId))
      const checksRaw = localStorage.getItem(getKey('dreweave_discipline_checkins', userId))
      const periodRaw = localStorage.getItem(getKey('dreweave_discipline_period', userId))
      const metaRaw = localStorage.getItem(getKey('dreweave_discipline_meta', userId))
      const statusRaw = localStorage.getItem(getKey('dreweave_discipline_daily_status', userId))
      const goalsRaw = localStorage.getItem(getKey('dreweave_discipline_goals', userId))
      const activeRaw = localStorage.getItem(getKey('dreweave_discipline_active_goal', userId))
      const goal = goalRaw ? goalRaw : '自律目标'
      const arr = checksRaw ? JSON.parse(checksRaw) : []
      const p = periodRaw ? JSON.parse(periodRaw) : { start: null, end: null }
      const meta = metaRaw ? JSON.parse(metaRaw) : { totalCheckins: Array.isArray(arr) ? arr.length : 0 }
      const status = statusRaw ? JSON.parse(statusRaw) : {}
      const goals = goalsRaw ? JSON.parse(goalsRaw) : []
      const activeGoalId = activeRaw ? JSON.parse(activeRaw) : null
      set({ goal, checkIns: Array.isArray(arr) ? arr : [], periodStart: p.start, periodEnd: p.end })
      set({ totalCheckins: Number(meta.totalCheckins || 0), treeStage: stageByCount(Number(meta.totalCheckins || 0)), dailyStatus: status })
      set({ goals: Array.isArray(goals) ? goals : [], activeGoalId })
    } catch {}
    get().recompute()
  },
  setGoal: (goal: string, userId?: string) => {
    set({ goal })
    try { localStorage.setItem(getKey('dreweave_discipline_goal', userId), goal) } catch {}
  },
  setPeriod: (start: string | null, end: string | null, userId?: string) => {
    set({ periodStart: start, periodEnd: end })
    try { localStorage.setItem(getKey('dreweave_discipline_period', userId), JSON.stringify({ start, end })) } catch {}
  },
  setDailyStatus: (dateISO: string, payload, userId?: string) => {
    const ds = { ...get().dailyStatus }
    ds[dateISO] = payload
    set({ dailyStatus: ds })
    try { localStorage.setItem(getKey('dreweave_discipline_daily_status', userId), JSON.stringify(ds)) } catch {}
  },
  toggleCheckIn: (dateISO: string, userId?: string) => {
    const d = new Date()
    const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0')
    const todayISO = `${y}-${m}-${day}`
    if (dateISO !== todayISO) return
    const arr = new Set(get().checkIns)
    if (arr.has(todayISO)) return
    arr.add(todayISO)
    const out = Array.from(arr)
    const total = Number(get().totalCheckins || 0) + 1
    set({ checkIns: out, totalCheckins: total, treeStage: stageByCount(total) })
    try {
      localStorage.setItem(getKey('dreweave_discipline_checkins', userId), JSON.stringify(out))
      localStorage.setItem(getKey('dreweave_discipline_meta', userId), JSON.stringify({ totalCheckins: total }))
    } catch {}
    get().setDailyStatus(todayISO, { status: 'completed', progress: 100, goalId: get().activeGoalId || undefined }, userId)
    get().recompute()
    get().syncToCloud(userId).catch(() => {
      const q = [...get().pendingSync, { dateISO: todayISO, totalCheckins: total, goal: get().goal, dailyStatus: get().dailyStatus[todayISO] }]
      set({ pendingSync: q })
    })
    try {
      window.dispatchEvent(new Event('checkInCompleted'))
      window.dispatchEvent(new Event('checkInStoreUpdated'))
    } catch {}
  },
  syncToCloud: async (userId?: string) => {
    try {
      const { supabase } = await import('../config/supabase')
      const payload = {
        user_id: userId || null,
        goal: get().goal,
        total_checkins: get().totalCheckins,
        tree_stage: get().treeStage,
        daily_status: get().dailyStatus,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('discipline_progress').upsert(payload, { onConflict: 'user_id' })
      if (error) throw error
      set({ pendingSync: [] })
    } catch (e) {
      throw e
    }
  },
  addGoal: (name: string, description: string | undefined, start: string | null, end: string | null, userId?: string, priority?: 'low'|'medium'|'high', dueDate?: string) => {
    const id = safeRandomUUID()
    const newGoals = [...get().goals, { id, name, description, start, end, priority, dueDate }]
    set({ goals: newGoals, activeGoalId: id })
    try {
      localStorage.setItem(getKey('dreweave_discipline_goals', userId), JSON.stringify(newGoals))
      localStorage.setItem(getKey('dreweave_discipline_active_goal', userId), JSON.stringify(id))
    } catch {}
    return id
  },
  updateGoal: (id: string, patch: { name?: string; description?: string; start?: string | null; end?: string | null; priority?: 'low'|'medium'|'high'; dueDate?: string }, userId?: string) => {
    const newGoals = get().goals.map(g => g.id === id ? { ...g, ...patch } : g)
    set({ goals: newGoals })
    try { localStorage.setItem(getKey('dreweave_discipline_goals', userId), JSON.stringify(newGoals)) } catch {}
  },
  removeGoal: (id: string, userId?: string) => {
    const newGoals = get().goals.filter(g => g.id !== id)
    let active = get().activeGoalId
    if (active === id) active = newGoals.length ? newGoals[0].id : null
    set({ goals: newGoals, activeGoalId: active })
    try {
      localStorage.setItem(getKey('dreweave_discipline_goals', userId), JSON.stringify(newGoals))
      localStorage.setItem(getKey('dreweave_discipline_active_goal', userId), JSON.stringify(active))
    } catch {}
  },
  setActiveGoal: (id: string | null, userId?: string) => {
    set({ activeGoalId: id })
    try { localStorage.setItem(getKey('dreweave_discipline_active_goal', userId), JSON.stringify(id)) } catch {}
  },
  nextMonth: () => {
    const { year, month } = get().currentMonth
    const nm = month === 12 ? 1 : month + 1
    const ny = month === 12 ? year + 1 : year
    set({ currentMonth: { year: ny, month: nm } })
  },
  prevMonth: () => {
    const { year, month } = get().currentMonth
    const pm = month === 1 ? 12 : month - 1
    const py = month === 1 ? year - 1 : year
    set({ currentMonth: { year: py, month: pm } })
  },
  recompute: () => {
    const arr = get().checkIns
    const total = computeTotals(arr)
    const streak = computeStreak(arr)
    set({ totalCount: total, streakCount: streak })
  }
}))