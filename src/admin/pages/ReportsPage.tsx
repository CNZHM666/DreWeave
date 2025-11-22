import React from 'react'
import { useAdminStore } from '../store/adminStore'
import { fetchMeasurements, fetchCheckins, exportCsv } from '../api/adminApi'

const ReportsPage: React.FC = () => {
  const { userId, start, end, page, size, setUserId, setRange } = useAdminStore()
  const [mRows, setMRows] = React.useState<any[]>([])
  const [cRows, setCRows] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const load = async () => {
    setLoading(true)
    const [m, c] = await Promise.all([fetchMeasurements(userId, start, end, page, size), fetchCheckins(userId, start, end, page, size)])
    setMRows(m); setCRows(c); setLoading(false)
  }
  React.useEffect(() => { load() }, [userId, start, end, page, size])
  return (
    <div className="p-4">
      <div className="text-xl font-bold mb-4">报表导出</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input className="glass-light px-3 py-2 rounded-xl" placeholder="用户ID" value={userId||''} onChange={e => setUserId(e.target.value || undefined)} />
        <input className="glass-light px-3 py-2 rounded-xl" type="datetime-local" value={start||''} onChange={e => setRange(e.target.value||undefined, end)} />
        <input className="glass-light px-3 py-2 rounded-xl" type="datetime-local" value={end||''} onChange={e => setRange(start, e.target.value||undefined)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-light p-4 rounded-2xl">
          <div className="font-semibold mb-2">测量记录</div>
          <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2" onClick={() => exportCsv('measurements.csv', mRows)} disabled={!mRows.length}>导出CSV</button>
          <div>记录数：{mRows.length}</div>
        </div>
        <div className="glass-light p-4 rounded-2xl">
          <div className="font-semibold mb-2">打卡记录</div>
          <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2" onClick={() => exportCsv('checkins.csv', cRows)} disabled={!cRows.length}>导出CSV</button>
          <div>记录数：{cRows.length}</div>
        </div>
      </div>
      {loading && <div className="mt-4">加载中...</div>}
    </div>
  )
}

export default ReportsPage