import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function safeRandomUUID(): string {
  const c: any = (globalThis as any).crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
  }
  let uuid = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) uuid += '-'
    else if (i === 14) uuid += '4'
    else {
      const r = (Math.random() * 16) | 0
      uuid += (i === 19 ? ((r & 0x3) | 0x8) : r).toString(16)
    }
  }
  return uuid
}
export function formatTimeAgo(ts: number): string {
  const now = Date.now()
  const diff = Math.max(0, now - ts)
  const s = Math.floor(diff / 1000)
  if (s < 5) return '刚刚'
  if (s < 60) return `${s}秒前`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}天前`
  const D = new Date(ts)
  const y = D.getFullYear()
  const mm = String(D.getMonth()+1).padStart(2, '0')
  const dd = String(D.getDate()).padStart(2, '0')
  const HH = String(D.getHours()).padStart(2, '0')
  const MM = String(D.getMinutes()).padStart(2, '0')
  return `${y}-${mm}-${dd} ${HH}:${MM}`
}
export function computeGoalProgress(goal: { start: string | null; end: string | null }, checkIns: string[]) {
  const inPeriod = (() => {
    if (!goal.start || !goal.end) return [] as string[]
    return checkIns.filter(d => d >= goal.start! && d <= goal.end!)
  })()
  const totalDays = (() => {
    if (!goal.start || !goal.end) return 0
    const s = new Date(goal.start)
    const e = new Date(goal.end)
    const ms = Math.max(0, e.getTime() - s.getTime())
    return Math.floor(ms / 86400000) + 1
  })()
  const completed = inPeriod.length
  const percent = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0
  const last7Rate = (() => {
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
  })()
  return { percent, completed, totalDays, last7Rate }
}
