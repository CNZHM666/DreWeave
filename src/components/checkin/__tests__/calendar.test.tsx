import { describe, it, expect } from 'vitest'

function toLocalDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('calendar generation', () => {
  it('generates correct days count for current month', () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const days: any[] = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dateStr = toLocalDateStr(date)
      const isToday = day === today.getDate()
      days.push({ day, isToday, date: dateStr, hasCheckIn: false })
    }
    expect(days.filter(Boolean).length).toBe(daysInMonth)
  })
})