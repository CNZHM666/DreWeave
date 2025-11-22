import React from 'react'
import { useAdminStore } from '../store/adminStore'
import { fetchMeasurements, exportCsv } from '../api/adminApi'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MeasurementsPage: React.FC = () => {
  const { userId, start, end, page, size, setUserId, setRange, setPage } = useAdminStore()
  const [rows, setRows] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  React.useEffect(() => { setLoading(true); fetchMeasurements(userId, start, end, page, size).then(setRows).finally(() => setLoading(false)) }, [userId, start, end, page, size])
  const data = rows.map(r => ({ x: r.completed_at, y: r.score }))
  return (
    <div className="p-4">
      <div className="text-xl font-bold mb-4">用户测量记录</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input className="glass-light px-3 py-2 rounded-xl" placeholder="用户ID" value={userId||''} onChange={e => setUserId(e.target.value || undefined)} />
        <input className="glass-light px-3 py-2 rounded-xl" type="datetime-local" value={start||''} onChange={e => setRange(e.target.value||undefined, end)} />
        <input className="glass-light px-3 py-2 rounded-xl" type="datetime-local" value={end||''} onChange={e => setRange(start, e.target.value||undefined)} />
        <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => exportCsv('measurements.csv', rows)} disabled={!rows.length}>导出CSV</button>
      </div>
      <div className="glass-light p-4 rounded-2xl mb-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="y" stroke="#2563eb" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {loading ? <div>加载中...</div> : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr><th className="text-left p-2">时间</th><th className="text-left p-2">测试类型</th><th className="text-left p-2">分数</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.completed_at}</td>
                  <td className="p-2">{r.test_type}</td>
                  <td className="p-2">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" onClick={() => setPage(Math.max(1, page - 1))}>上一页</button>
        <div className="px-2">第 {page} 页</div>
        <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" onClick={() => setPage(page + 1)}>下一页</button>
      </div>
    </div>
  )
}

export default MeasurementsPage