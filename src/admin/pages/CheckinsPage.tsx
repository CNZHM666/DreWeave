import React from 'react'
import { useAdminStore } from '../store/adminStore'
import { fetchCheckins, exportCsv, flagCheckin } from '../api/adminApi'

const CheckinsPage: React.FC = () => {
  const { userId, start, end, page, size, setUserId, setRange, setPage } = useAdminStore()
  const [rows, setRows] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  React.useEffect(() => { setLoading(true); fetchCheckins(userId, start, end, page, size).then(setRows).finally(() => setLoading(false)) }, [userId, start, end, page, size])
  const toggleFlag = async (id: string, flagged: boolean) => { await flagCheckin(id, !flagged); setRows(rows.map(r => r.id===id?{...r, flagged:!flagged}:r)) }
  return (
    <div className="p-4">
      <div className="text-xl font-bold mb-4">用户打卡统计</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input className="glass-light px-3 py-2 rounded-xl" placeholder="用户ID" value={userId||''} onChange={e => setUserId(e.target.value || undefined)} />
        <input className="glass-light px-3 py-2 rounded-xl" type="datetime-local" value={start||''} onChange={e => setRange(e.target.value||undefined, end)} />
        <input className="glass-light px-3 py-2 rounded-xl" type="datetime-local" value={end||''} onChange={e => setRange(start, e.target.value||undefined)} />
        <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => exportCsv('checkins.csv', rows)} disabled={!rows.length}>导出CSV</button>
      </div>
      {loading ? <div>加载中...</div> : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr><th className="text-left p-2">时间</th><th className="text-left p-2">方式</th><th className="text-left p-2">状态</th><th className="text-left p-2">异常</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.ts_server}</td>
                  <td className="p-2">{r.method}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">
                    <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => toggleFlag(r.id, !!r.flagged)}>{r.flagged ? '取消异常' : '标记异常'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => setPage(Math.max(1, page - 1))}>上一页</button>
        <div className="px-2">第 {page} 页</div>
        <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => setPage(page + 1)}>下一页</button>
      </div>
    </div>
  )
}

export default CheckinsPage