import React from 'react'
import { useAdminStore } from '../store/adminStore'
import { fetchAssessments, exportCsv } from '../api/adminApi'

const AssessmentsPage: React.FC = () => {
  const { userId, start, end, page, size, setUserId, setRange, setPage } = useAdminStore()
  const [rows, setRows] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  React.useEffect(() => { setLoading(true); fetchAssessments(userId, start, end, page, size).then(setRows).finally(() => setLoading(false)) }, [userId, start, end, page, size])
  return (
    <div className="p-4">
      <div className="text-xl font-bold mb-4">成瘾评估风险概览</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input className="glass-light px-3 py-2 rounded-xl" placeholder="用户ID" value={userId||''} onChange={e => setUserId(e.target.value || undefined)} />
        <input className="glass-light px-3 py-2 rounded-xl" type="datetime-local" value={start||''} onChange={e => setRange(e.target.value||undefined, end)} />
        <input className="glass-light px-3 py-2 rounded-xl" type="datetime-local" value={end||''} onChange={e => setRange(start, e.target.value||undefined)} />
        <button className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => exportCsv('assessments.csv', rows)} disabled={!rows.length}>导出CSV</button>
      </div>
      {loading ? <div>加载中...</div> : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr><th className="text-left p-2">时间</th><th className="text-left p-2">用户</th><th className="text-left p-2">目标</th><th className="text-left p-2">评分</th><th className="text-left p-2">风险等级</th><th className="text-left p-2">下次跟进</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.created_at}</td>
                  <td className="p-2">{r.user_id}</td>
                  <td className="p-2">{r.goal_id || '-'}</td>
                  <td className="p-2">{r.score}</td>
                  <td className="p-2">{r.risk_profile}</td>
                  <td className="p-2">{r.next_follow_up || '-'}</td>
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

export default AssessmentsPage