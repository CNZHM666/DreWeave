import React from 'react'
import { Users, BarChart, CheckSquare, FileText, Settings } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore()
  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">管理控制台</h1>
        <div className="text-right">
          <div>欢迎, {user?.email}</div>
        </div>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href="/admin/users" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <Users className="w-8 h-8 mr-4 text-blue-500" />
            <h2 className="text-xl font-semibold">用户管理</h2>
          </div>
        </a>
        <a href="/admin/measurements" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <BarChart className="w-8 h-8 mr-4 text-green-500" />
            <h2 className="text-xl font-semibold">用户测量记录</h2>
          </div>
        </a>
        <a href="/admin/checkins" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <CheckSquare className="w-8 h-8 mr-4 text-yellow-500" />
            <h2 className="text-xl font-semibold">用户打卡统计</h2>
          </div>
        </a>
        <a href="/admin/reports" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <FileText className="w-8 h-8 mr-4 text-red-500" />
            <h2 className="text-xl font-semibold">报表导出</h2>
          </div>
        </a>
        <a href="/admin/settings" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <Settings className="w-8 h-8 mr-4 text-gray-500" />
            <h2 className="text-xl font-semibold">设置</h2>
          </div>
        </a>
      </main>
    </div>
  )
}

export default AdminDashboard