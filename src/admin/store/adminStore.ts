import { create } from 'zustand'

type AdminState = {
  query: string
  userId?: string
  start?: string
  end?: string
  page: number
  size: number
  logs: { ts: number; level: 'info' | 'warn' | 'error'; message: string }[]
  busyCount: number
}

type AdminActions = {
  setQuery: (q: string) => void
  setUserId: (id?: string) => void
  setRange: (s?: string, e?: string) => void
  setPage: (p: number) => void
  setSize: (s: number) => void
  addLog: (level: 'info' | 'warn' | 'error', message: string) => void
  startTask: (desc?: string) => void
  endTask: (desc?: string, ok?: boolean) => void
}

export const useAdminStore = create<AdminState & AdminActions>()((set) => ({
  query: '',
  page: 1,
  size: 20,
  logs: [],
  busyCount: 0,
  setQuery: (q) => set({ query: q, page: 1 }),
  setUserId: (id) => set({ userId: id, page: 1 }),
  setRange: (s, e) => set({ start: s, end: e, page: 1 }),
  setPage: (p) => set({ page: p }),
  setSize: (s) => set({ size: s }),
  addLog: (level, message) => set((st) => ({ logs: [...st.logs, { ts: Date.now(), level, message }] })),
  startTask: (desc) => set((st) => ({ busyCount: st.busyCount + 1, logs: desc ? [...st.logs, { ts: Date.now(), level: 'info', message: `开始任务：${desc}` }] : st.logs })),
  endTask: (desc, ok = true) => set((st) => ({ busyCount: Math.max(0, st.busyCount - 1), logs: desc ? [...st.logs, { ts: Date.now(), level: ok ? 'info' : 'error', message: `结束任务：${desc}（${ok ? '成功' : '失败'}）` }] : st.logs }))
}))