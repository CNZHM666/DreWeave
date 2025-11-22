type MetricsEvent = {
  name: string
  ts: number
  data?: Record<string, any>
}

const KEY = 'dreweave_metrics'

export function recordEvent(name: string, data?: Record<string, any>) {
  try {
    const raw = localStorage.getItem(KEY)
    const list: MetricsEvent[] = raw ? JSON.parse(raw) : []
    list.push({ name, ts: Date.now(), data })
    localStorage.setItem(KEY, JSON.stringify(list))
    console.log('[metrics:event]', { name, ts: Date.now(), data })
  } catch {}
}

export function getEvents(): MetricsEvent[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearEvents() {
  try { localStorage.removeItem(KEY) } catch {}
}

const timers = new Map<string, number>()

export function startTimer(name: string) {
  try { timers.set(name, performance.now()) } catch { timers.set(name, Date.now()) }
}

export function endTimer(name: string, extra?: Record<string, any>) {
  const start = timers.get(name)
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  const dur = start ? Math.round(now - start) : -1
  recordEvent(`timer:${name}`, { duration_ms: dur, ...extra })
  timers.delete(name)
  return dur
}