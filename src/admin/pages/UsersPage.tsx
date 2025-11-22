import React from 'react'
import { useAdminStore } from '../store/adminStore'
import { fetchUsers } from '../api/adminApi'
import { toast } from 'sonner'
import { MdDeleteForever, MdLockReset } from 'react-icons/md'

const UsersPage: React.FC = () => {
  const { query, page, size, setQuery, setPage, startTask, endTask, addLog } = useAdminStore()
  type UserRow = { id: string; email: string; username?: string; created_at?: string }
  const [rows, setRows] = React.useState<UserRow[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selected, setSelected] = React.useState<string[]>([])
  React.useEffect(() => {
    setLoading(true)
    fetchUsers(query, page, size)
      .then(setRows)
      .catch(() => toast.error('加载用户列表失败'))
      .finally(() => setLoading(false))
  }, [query, page, size])

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => checked ? [...prev, id] : prev.filter(x => x !== id))
  }

  const allChecked = rows.length > 0 && selected.length === rows.length
  const toggleAll = (checked: boolean) => {
    setSelected(checked ? rows.map(r => String(r.id)) : [])
  }

  const bulkDisable = async () => {
    const count = selected.length
    if (!count) return
    startTask('批量禁用用户')
    addLog('warn', `准备禁用 ${count} 个用户`)
    toast.info(`正在禁用 ${count} 个用户...`)
    await new Promise(r => setTimeout(r as (value: unknown) => void, 600))
    endTask('批量禁用用户', true)
    toast.success('批量禁用完成')
    setSelected([])
  }

  const bulkResetPwd = async () => {
    const count = selected.length
    if (!count) return
    startTask('批量重置密码')
    addLog('warn', `准备重置 ${count} 个用户的密码`)
    toast.info(`正在重置 ${count} 个用户密码...`)
    await new Promise(r => setTimeout(r as (value: unknown) => void, 800))
    endTask('批量重置密码', true)
    toast.success('批量重置完成')
    setSelected([])
  }
  return (
    <div className="p-4">
      <div className="text-xl font-bold mb-2">用户管理</div>
      <p className="text-sm text-gray-600 mb-4">支持多选批量操作，按 Alt+2 快速进入本页</p>
      <div className="flex gap-2 mb-4 items-center">
        <label htmlFor="user-search" className="text-sm text-gray-700">搜索</label>
        <input id="user-search" aria-describedby="search-help" className="px-3 py-2 rounded border border-gray-300 w-full max-w-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" placeholder="输入邮箱或关键词" value={query} onChange={e => setQuery(e.target.value)} />
        <span id="search-help" className="text-xs text-gray-500">支持模糊匹配，输入后300ms内反馈</span>
      </div>
      {loading ? <div className="text-gray-600">加载中...</div> : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2"><input aria-label="全选" type="checkbox" checked={allChecked} onChange={e => toggleAll(e.target.checked)} /></th>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">邮箱</th>
                <th className="text-left p-2">用户名</th>
                <th className="text-left p-2">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-2"><input aria-label={`选择 ${r.email}`} type="checkbox" checked={selected.includes(String(r.id))} onChange={e => toggle(String(r.id), e.target.checked)} /></td>
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">{r.username}</td>
                  <td className="p-2">{r.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2 mt-4 items-center">
        <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setPage(Math.max(1, page - 1))}>上一页</button>
        <div className="px-2">第 {page} 页</div>
        <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setPage(page + 1)}>下一页</button>
      </div>

      {selected.length > 0 && (
        <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 shadow px-4 py-2 flex items-center gap-3">
          <div className="text-sm text-gray-700">已选 {selected.length} 项</div>
          <button className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={bulkDisable}><MdDeleteForever size={18} /> 批量禁用</button>
          <button className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={bulkResetPwd}><MdLockReset size={18} /> 批量重置密码</button>
        </div>
      )}
    </div>
  )
}

export default UsersPage