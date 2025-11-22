import { create } from 'zustand'
import { checkInApi, isSupabaseConfigured } from '../config/supabase'
import type { SubmitPayload, SubmitResult } from '../services/checkin/types'

interface State {
  events: any[]
  loading: boolean
  error: string | null
  offlineQueue: SubmitPayload[]
  submit: (payload: SubmitPayload) => Promise<SubmitResult | null>
  fetchEvents: (userId: string) => Promise<void>
  syncOffline: (userId: string) => Promise<void>
}

export const useCheckinNewStore = create<State>()((set, get) => ({
  events: [],
  loading: false,
  error: null,
  offlineQueue: [],
  submit: async (payload: SubmitPayload) => {
    set({ loading: true, error: null })
    if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      const q = [...get().offlineQueue, payload]
      set({ loading: false, error: '离线模式：已保存，将自动重试', offlineQueue: q })
      try {
        const today = new Date().toDateString()
        localStorage.setItem(`checkin_${payload.user_id}_${today}`, 'completed_offline')
      } catch {}
      return null
    }
    let attempt = 0
    while (attempt < 3) {
      try {
        const res = await checkInApi.submitEvent(payload)
        set({ loading: false })
        try {
          const today = new Date().toDateString()
          localStorage.setItem(`checkin_${payload.user_id}_${today}`, 'completed')
        } catch {}
        return res as SubmitResult
      } catch (err: any) {
        attempt++
        const code = err?.code || ''
        const msg = String(err?.message || '').toLowerCase()
        if (code === '42P01' || code === 'PGRST102' || msg.includes('schema cache') || msg.includes('could not find the table')) {
          const q = [...get().offlineQueue, payload]
          set({ loading: false, error: '后端未准备：已离线保存，将自动同步', offlineQueue: q })
          return null
        }
        if (attempt >= 3) {
          const q = [...get().offlineQueue, payload]
          set({ loading: false, error: err?.message || '提交失败', offlineQueue: q })
          try {
            const today = new Date().toDateString()
            localStorage.setItem(`checkin_${payload.user_id}_${today}`, 'completed_offline')
          } catch {}
          return null
        }
        await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)))
      }
    }
    set({ loading: false })
    return null
  },
  fetchEvents: async (userId: string) => {
    try {
      const data = await checkInApi.getEvents(userId, 50)
      set({ events: data, error: null })
    } catch (err: any) {
      set({ events: [], error: err?.message || '获取事件失败' })
    }
  },
  syncOffline: async (userId: string) => {
    const q = [...get().offlineQueue]
    const rest: SubmitPayload[] = []
    for (const p of q) {
      try { await checkInApi.submitEvent(p) } catch { rest.push(p) }
    }
    set({ offlineQueue: rest })
    await get().fetchEvents(userId)
  }
}))