import { recordEvent } from './metrics'

interface PerfEventTiming extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface PerfLayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerfLongTaskTiming extends PerformanceEntry {
  duration: number;
}


function observe(type: string, cb: (entry: PerformanceEntry) => void) {
  try {
    const obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) cb(e)
    })
    obs.observe({ type, buffered: true })
    return obs
  } catch {
    return null
  }
}

export function initPerfVitals() {
  observe('largest-contentful-paint', (e: PerformanceEntry) => {
    recordEvent('vitals:LCP', { value: Math.round(e.startTime) })
  })
  observe('first-input', (e: PerfEventTiming) => {
    recordEvent('vitals:FID', { value: Math.round(e.processingStart - e.startTime) })
  })
  observe('layout-shift', (e: PerfLayoutShift) => {
    if (!e.hadRecentInput) recordEvent('vitals:CLS', { value: e.value })
  })
  try {
    const longObs = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      for (const e of entries) recordEvent('perf:longtask', { duration_ms: Math.round((e as PerfLongTaskTiming).duration) })
    })
    longObs.observe({ entryTypes: ['longtask'] })
  } catch (e) { /* not supported */ }
}