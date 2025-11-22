import { describe, it, expect } from 'vitest'
import { computeGoalProgress, formatTimeAgo } from './utils'

describe('computeGoalProgress', () => {
  it('calculates percent with period and check-ins', () => {
    const goal = { start: '2025-01-01', end: '2025-01-10' }
    const checkIns = ['2025-01-01', '2025-01-02', '2025-01-05', '2025-01-10']
    const r = computeGoalProgress(goal as any, checkIns)
    expect(r.totalDays).toBe(10)
    expect(r.completed).toBe(4)
    expect(r.percent).toBe(Math.round((4 / 10) * 100))
  })
})

describe('formatTimeAgo', () => {
  it('formats recent seconds', () => {
    const ts = Date.now() - 3 * 1000
    expect(formatTimeAgo(ts)).toBe('刚刚')
  })
  it('formats minutes', () => {
    const ts = Date.now() - 2 * 60 * 1000
    expect(formatTimeAgo(ts)).toBe('2分钟前')
  })
})