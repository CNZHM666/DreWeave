import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { MdHomeFilled, MdPeople, MdSettings, MdInsights, MdChecklist, MdInsertChart, MdMenu, MdMenuOpen, MdHistory } from 'react-icons/md'
import { toast } from 'sonner'
import { useAdminStore } from '../store/adminStore'
import { supabase } from '../../config/supabase'
import { useAuthStore } from '../../stores/authStore'

const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = React.useState(false)
  const [showLogs, setShowLogs] = React.useState(false)
  const { busyCount, logs } = useAdminStore()
  const auth = useAuthStore()

  React.useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed')
    setCollapsed(saved === 'true')
  }, [])

  React.useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', String(collapsed))
  }, [collapsed])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case '1': navigate('/admin'); toast.info('跳转：控制台概览'); break
          case '2': navigate('/admin/users'); toast.info('跳转：用户管理'); break
          case '3': navigate('/admin/measurements'); toast.info('跳转：测量记录'); break
          case '4': navigate('/admin/checkins'); toast.info('跳转：打卡统计'); break
          case '5': navigate('/admin/reports'); toast.info('跳转：数据报表'); break
          case '6': navigate('/admin/settings'); toast.info('跳转：系统设置'); break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="flex h-screen bg-[#F4F6F8] text-gray-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-blue-900 px-3 py-1 rounded">跳到主要内容</a>
      <aside
        className={`flex-shrink-0 ${collapsed ? 'w-[64px]' : 'w-[240px]'} transition-all duration-200 bg-blue-900 text-white flex flex-col`} 
        role="navigation" aria-label="管理员导航"
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-blue-800">
          <button
            aria-label={collapsed ? '展开导航栏' : '折叠导航栏'}
            onClick={() => setCollapsed(c => !c)}
            className="inline-flex items-center justify-center w-9 h-9 rounded hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {collapsed ? <MdMenu size={20} /> : <MdMenuOpen size={20} />}
          </button>
          {!collapsed && <h1 className="text-lg font-semibold">管理后台</h1>}
        </div>

        <nav className="flex-1 py-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'} rounded mx-2`}
            title="控制台概览"
          >
            <MdInsights size={20} />
            {!collapsed && <span>概览</span>}
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'} rounded mx-2`} title="用户管理">
            <MdPeople size={20} />
            {!collapsed && <span>用户管理</span>}
          </NavLink>
          <NavLink to="/admin/measurements" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'} rounded mx-2`} title="测量记录">
            <MdInsertChart size={20} />
            {!collapsed && <span>测量记录</span>}
          </NavLink>
          <NavLink to="/admin/checkins" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'} rounded mx-2`} title="打卡统计">
            <MdChecklist size={20} />
            {!collapsed && <span>打卡统计</span>}
          </NavLink>
          <NavLink to="/admin/assessments" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'} rounded mx-2`} title="评估风险">
            <MdInsights size={20} />
            {!collapsed && <span>评估风险</span>}
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'} rounded mx-2`} title="数据报表">
            <MdInsertChart size={20} />
            {!collapsed && <span>数据报表</span>}
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'} rounded mx-2`} title="系统设置">
            <MdSettings size={20} />
            {!collapsed && <span>系统设置</span>}
          </NavLink>
        </nav>

        <div className="px-3 py-2 text-xs text-blue-100 border-t border-blue-800">按 Alt+1..6 快捷跳转</div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center justify-center w-9 h-9 rounded hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="返回控制台概览"
          >
            <MdHomeFilled size={24} className="text-blue-700" />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">企业级管理控制台</div>
            <button onClick={() => setShowLogs(s => !s)} className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100" aria-expanded={showLogs} aria-controls="admin-logs">
              <MdHistory size={18} className="text-blue-700" />
              <span className="text-sm text-gray-700">操作日志</span>
            </button>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 px-3 py-1 rounded btn-healing">
              <span className="text-sm">退出登录</span>
            </button>
          </div>
        </header>

        {busyCount > 0 && (
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50} className="h-1 bg-blue-100">
            <div className="h-1 w-1/2 bg-blue-600 animate-[breathing_1.5s_ease_infinite]"></div>
          </div>
        )}

        {showLogs && (
          <section id="admin-logs" className="max-h-40 overflow-auto bg-white border-b border-gray-200 px-4 py-2 text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">暂无日志</div>
            ) : (
              <ul className="list-disc ml-6">
                {logs.slice(-50).map((l, i) => (
                  <li key={i} className={l.level === 'error' ? 'text-red-600' : l.level === 'warn' ? 'text-amber-700' : 'text-gray-800'}>{new Date(l.ts).toLocaleString()} - {l.message}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        <main id="main" className="flex-1 p-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
  const handleLogout = async () => {
    try {
      toast.info('正在退出登录...')
      try {
        const { error } = await supabase.auth.signOut({ scope: 'local' })
        if (error && !String(error.message || '').toLowerCase().includes('abort')) {
          throw error
        }
      } catch (e: any) {
        const msg = String(e?.message || '').toLowerCase()
        if (!msg.includes('abort')) {
          console.debug('Admin logout error:', e)
        }
      }
      try { await auth.logout() } catch {}
      try { navigate('/admin/login') } catch {}
      try { window.location.href = '/admin/login' } catch {}
      toast.success('已退出登录')
    } catch (e: any) {
      toast.error('退出登录失败：' + (e?.message || 'unknown'))
    }
  }