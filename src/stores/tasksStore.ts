import { create } from 'zustand'
import { safeRandomUUID } from '../lib/utils'

type Priority = 'low' | 'medium' | 'high'

export type Subtask = { id: string; title: string; completed: boolean }
export type Task = {
  id: string
  name: string
  description?: string
  priority: Priority
  dueDate?: string
  progress: number
  subtasks: Subtask[]
  history: { ts: string; change: string }[]
  goalId?: string
}

interface TasksState {
  tasks: Task[]
  load: (userId?: string) => void
  add: (t: Omit<Task, 'id' | 'history'>) => string
  update: (id: string, patch: Partial<Task>) => void
  remove: (id: string) => void
  setProgress: (id: string, progress: number) => void
  toggleSubtask: (taskId: string, subId: string) => void
}

function key(userId?: string) {
  return userId ? `dreweave_tasks_${userId}` : 'dreweave_tasks'
}

export const useTasksStore = create<TasksState>()((set, get) => ({
  tasks: [],
  load: (userId?: string) => {
    try {
      const raw = localStorage.getItem(key(userId))
      const arr = raw ? JSON.parse(raw) : []
      set({ tasks: Array.isArray(arr) ? arr : [] })
    } catch {}
  },
  add: (t) => {
    const id = safeRandomUUID()
    const nt: Task = { id, name: t.name, description: t.description, priority: t.priority, dueDate: t.dueDate, progress: t.progress, subtasks: t.subtasks || [], history: [{ ts: new Date().toISOString(), change: '创建任务' }] }
    const tasks = [...get().tasks, nt]
    set({ tasks })
    try { localStorage.setItem(key(), JSON.stringify(tasks)) } catch {}
    return id
  },
  update: (id, patch) => {
    const tasks = get().tasks.map(x => x.id === id ? { ...x, ...patch, history: [...x.history, { ts: new Date().toISOString(), change: '更新任务' }] } : x)
    set({ tasks })
    try { localStorage.setItem(key(), JSON.stringify(tasks)) } catch {}
  },
  remove: (id) => {
    const tasks = get().tasks.filter(x => x.id !== id)
    set({ tasks })
    try { localStorage.setItem(key(), JSON.stringify(tasks)) } catch {}
  },
  setProgress: (id, progress) => {
    const tasks = get().tasks.map(x => x.id === id ? { ...x, progress, history: [...x.history, { ts: new Date().toISOString(), change: `进度更新为${progress}%` }] } : x)
    set({ tasks })
    try { localStorage.setItem(key(), JSON.stringify(tasks)) } catch {}
  },
  toggleSubtask: (taskId, subId) => {
    const tasks = get().tasks.map(x => {
      if (x.id !== taskId) return x
      const subs = x.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
      return { ...x, subtasks: subs, history: [...x.history, { ts: new Date().toISOString(), change: '切换子任务状态' }] }
    })
    set({ tasks })
    try { localStorage.setItem(key(), JSON.stringify(tasks)) } catch {}
  }
}))