import React from 'react'

interface Props {
  year: number
  month: number
  checked: Set<string>
  onPrevMonth: () => void
  onNextMonth: () => void
  onToggleDate: (iso: string) => void
  periodStartISO?: string | null
  periodEndISO?: string | null
  statusByDate?: Record<string, { status: 'completed' | 'in_progress' | 'not_started'; progress: number; note?: string }>
  onCellInfo?: (iso: string) => void
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function firstDayWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarGrid({ year, month, checked, onPrevMonth, onNextMonth, onToggleDate, periodStartISO, periodEndISO, statusByDate, onCellInfo }: Props) {
  const [anim, setAnim] = React.useState<'none'|'left'|'right'>('none')
  const onPrev = () => { setAnim('right'); setTimeout(() => { onPrevMonth(); setAnim('none') }, 250) }
  const onNext = () => { setAnim('left'); setTimeout(() => { onNextMonth(); setAnim('none') }, 250) }
  const total = daysInMonth(year, month)
  const first = firstDayWeek(year, month)
  const prevDays = Array.from({ length: first }, (_, i) => ({ type: 'pad', day: i }))
  const mainDays = Array.from({ length: total }, (_, i) => ({ type: 'day', day: i + 1 }))
  const grid = [...prevDays, ...mainDays]

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'Enter') {
        const d = new Date()
        const iso = toISO(d.getFullYear(), d.getMonth() + 1, d.getDate())
        onToggleDate(iso)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [year, month])

  const todayISO = (() => { const d = new Date(); return toISO(d.getFullYear(), d.getMonth()+1, d.getDate()) })()
  const todayChecked = checked.has(todayISO)
  const inPeriod = (iso: string) => {
    if (!periodStartISO || !periodEndISO) return false
    return iso >= periodStartISO && iso <= periodEndISO
  }
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="px-3 py-2 rounded-2xl bg-white/30 text-blue-900 hover:bg-white/40">上一月</button>
        <div className="text-xl font-bold text-blue-900">{year}年 {String(month).padStart(2,'0')}月</div>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (!todayChecked) onToggleDate(todayISO) }} className={`px-3 py-2 rounded-2xl bg-indigo-600 text-white ${todayChecked ? 'opacity-60 cursor-not-allowed' : ''}`}>今日打卡</button>
          <button onClick={onNext} className="px-3 py-2 rounded-2xl bg-white/30 text-blue-900 hover:bg-white/40">下一月</button>
        </div>
      </div>
      <div className={`relative overflow-hidden rounded-3xl bg-white/20 backdrop-blur-md p-4`}>
        <div className={`grid grid-cols-7 gap-2 transition-transform duration-200 ease-out ${anim==='left' ? '-translate-x-full opacity-80' : ''} ${anim==='right' ? 'translate-x-full opacity-80' : ''}`}>
          {['日','一','二','三','四','五','六'].map((w) => (
            <div key={w} className="text-center text-blue-900 font-medium">{w}</div>
          ))}
          {grid.map((g, idx) => {
            if (g.type === 'pad') return <div key={`p-${idx}`} className="h-12 rounded-2xl bg-white/10" />
            const iso = toISO(year, month, g.day as number)
            const isChecked = checked.has(iso)
            const within = inPeriod(iso)
            const isFuture = iso > todayISO
            const isPast = iso < todayISO
            const disabled = (iso !== todayISO) || isChecked || (!!periodStartISO && !!periodEndISO && !within)
            return (
              <RippleCell key={iso} onClick={() => { if (!disabled) onToggleDate(iso); if (onCellInfo) onCellInfo(iso) }} checked={isChecked} within={within} disabled={disabled} label={String(g.day)} status={statusByDate?.[iso]?.status} progress={statusByDate?.[iso]?.progress} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RippleCell({ onClick, checked, within, disabled, label, status, progress }: { onClick: () => void; checked: boolean; within: boolean; disabled: boolean; label: string; status?: 'completed'|'in_progress'|'not_started'; progress?: number }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return
    const el = ref.current
    if (!el) return onClick()
    const ripple = document.createElement('span')
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    ripple.className = 'ripple-ink'
    ripple.style.width = `${size}px`
    ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    el.appendChild(ripple)
    setTimeout(() => { try { el.removeChild(ripple) } catch {} }, 450)
    onClick()
  }
  return (
    <div ref={ref} onClick={handleClick} className={`relative h-12 rounded-2xl flex items-center justify-center select-none ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-[#4CAF50] text-white' : 'bg-white/20 text-blue-900'} ${!disabled && !checked ? 'hover:bg-white/30' : ''} ${within && !checked ? 'ring-2 ring-indigo-300' : ''}`} title={disabled ? '仅允许当日打卡（周期外或非今日不可打卡）' : ''}>
      <span className="font-semibold">{label}</span>
      {status === 'completed' && <span className="absolute top-1 right-1 text-[#4CAF50]">✓</span>}
      {status === 'not_started' && <span className="absolute top-1 right-1 text-red-500">!</span>}
      {status === 'in_progress' && (
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-blue-200 rounded">
          <div className="h-1 bg-blue-600 rounded" style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }} />
        </div>
      )}
      <style>{`.ripple-ink{position:absolute;border-radius:50%;background:rgba(255,255,255,0.5);transform:scale(0);animation:ripple .45s ease-out;pointer-events:none}@keyframes ripple{to{transform:scale(1);opacity:0}}`}</style>
    </div>
  )
}