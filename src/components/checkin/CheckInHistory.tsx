import React from 'react'
import { checkInApi } from '../../config/supabase'
import { useAuthStore } from '../../stores/authStore'

interface HistoryItem {
  id: string
  date?: string
  created_at: string
}

interface Props {
  pageSize?: number
}

export const CheckInHistory: React.FC<Props> = ({ pageSize = 20 }) => {
  const { user } = useAuthStore()
  const [items, setItems] = React.useState<HistoryItem[]>([])
  const [page, setPage] = React.useState(0)
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  const loadPage = async (p: number) => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, total } = await (checkInApi as any).getUserCheckInsPage(user.id, p, pageSize)
      setTotal(total)
      setItems((prev) => [...prev, ...data])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    setItems([])
    setPage(0)
    if (user?.id) loadPage(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const hasMore = items.length < total

  return (
    <div className="glass rounded-3xl p-8 mt-8">
      <h3 className="text-2xl font-bold mb-4 text-blue-900">打卡历史</h3>
      <ul className="space-y-2">
        {items.map((ci) => {
          const d = ci.date || (() => { const dd = new Date(ci.created_at); const y = dd.getFullYear(); const m = String(dd.getMonth()+1).padStart(2,'0'); const day = String(dd.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` })()
          return (
            <li key={ci.id} className="flex items-center justify-between hover-target-lg">
              <span className="text-blue-800">{d}</span>
              <span className="text-green-700">已打卡</span>
            </li>
          )
        })}
        {loading && (
          <li className="flex items-center justify-center py-3">
            <div className="loading-healing" />
            <span className="ml-2 text-blue-800">加载中...</span>
          </li>
        )}
      </ul>
      <div className="mt-4 text-center">
        {hasMore ? (
          <button
            className="px-4 py-2 rounded-xl btn-primary-desktop transition-gpu"
            onClick={async () => { const next = page + 1; setPage(next); await loadPage(next) }}
            disabled={loading}
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        ) : (
          <p className="text-blue-800 text-sm">已无更多记录</p>
        )}
      </div>
    </div>
  )
}