import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { LogOut, User, Calendar, Brain, Heart, Award, Settings, Shield, Target } from 'lucide-react'
import { Toaster } from 'sonner'
const LazyParticles = React.lazy(() => import('../components/HealingParticles'))
import { useMarketStore } from '../stores/marketStore'
import { useCheckinNewStore } from '../stores/checkinNewStore'
import { useAchievementStore } from '../stores/achievementStore'
import { useAbstinenceStore } from '../stores/abstinenceStore'

const Home: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { coins: balance, fetchUserData: fetchMarketData } = useMarketStore()
  const { events, fetchEvents, offlineQueue } = useCheckinNewStore()
  const abst = useAbstinenceStore()
  const currentStreak = React.useMemo(() => {
    const byDate = new Set<string>()
    for (const e of events) {
      if (e.status === 'verified' || e.status === 'pending') {
        const d = new Date(e.ts_server)
        const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0')
        byDate.add(`${y}-${m}-${day}`)
      }
    }
    for (const p of offlineQueue || []) {
      const d = new Date(p.ts_client)
      const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0')
      byDate.add(`${y}-${m}-${day}`)
    }
    for (const iso of abst.checkIns || []) {
      byDate.add(iso)
    }
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0')
      const key = `${y}-${m}-${day}`
      if (byDate.has(key)) streak++
      else break
    }
    return streak
  }, [events, offlineQueue, abst.checkIns])
  const { stats, fetchUserAchievements } = useAchievementStore()
  const [allowMotion, setAllowMotion] = React.useState(true)
  const [showParticles, setShowParticles] = React.useState(false)
  const fetchTimerRef = React.useRef<number | null>(null)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    const reduced = document.documentElement.getAttribute('data-reduced-motion') === 'true'
    setAllowMotion(!reduced)
    const start = () => setShowParticles(!reduced)
    if ('requestIdleCallback' in window) {
      const h = (window as any).requestIdleCallback(() => start())
      return () => { try { (window as any).cancelIdleCallback(h) } catch {} }
    } else {
      const t = setTimeout(() => start(), 400)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const lastCheckinTs = React.useMemo(() => {
    let ts = 0
    for (const e of events) {
      if (e.ts_server) {
        const t = new Date(e.ts_server).getTime()
        if (t > ts) ts = t
      }
    }
    for (const p of offlineQueue || []) {
      const t = new Date(p.ts_client).getTime()
      if (t > ts) ts = t
    }
    for (const iso of abst.checkIns || []) {
      const t = new Date(`${iso}T00:00:00`).getTime()
      if (t > ts) ts = t
    }
    return ts
  }, [events, offlineQueue, abst.checkIns, tick])
  useEffect(() => {
    if (!user?.id) return
    const start = () => {
      try { fetchMarketData(user.id) } catch {}
      try { fetchUserAchievements(user.id) } catch {}
      try { fetchEvents(user.id) } catch {}
    }
    if ('requestIdleCallback' in window) {
      const h = (window as any).requestIdleCallback(() => start())
      return () => { try { (window as any).cancelIdleCallback(h) } catch {} }
    } else {
      const t = setTimeout(() => start(), 600)
      return () => clearTimeout(t)
    }
  }, [user?.id])

  // 监听签到完成事件，强制刷新数据
  useEffect(() => {
    const handleCheckInCompleted = () => {
      if (fetchTimerRef.current) return
      fetchTimerRef.current = window.setTimeout(() => {
        fetchTimerRef.current = null
        if (user?.id) {
          try { fetchEvents(user.id) } catch {}
        }
      }, 300)
    }

    const handleStoreUpdated = (event: any) => {
      if (fetchTimerRef.current) return
      fetchTimerRef.current = window.setTimeout(() => {
        fetchTimerRef.current = null
        if (user?.id) {
          try { fetchEvents(user.id) } catch {}
        }
      }, 300)
    }

    window.addEventListener('checkInCompleted', handleCheckInCompleted)
    window.addEventListener('checkInStoreUpdated', handleStoreUpdated)
    return () => {
      window.removeEventListener('checkInCompleted', handleCheckInCompleted)
      window.removeEventListener('checkInStoreUpdated', handleStoreUpdated)
    }
  }, [user?.id, fetchEvents])

  const navigationItems = [
    { path: '/discipline-journey', icon: Shield, label: '自律之旅', color: 'from-indigo-400 to-indigo-600' },
    { path: '/test', icon: Brain, label: '自测中心', color: 'from-blue-400 to-blue-600' },
    { path: '/calm', icon: Heart, label: '冷静空间', color: 'from-purple-400 to-purple-600' },
    { path: '/market', icon: Award, label: '时间交易所', color: 'from-yellow-400 to-yellow-600' },
    { path: '/achievements', icon: Award, label: '成就系统', color: 'from-pink-400 to-pink-600' },
    { path: '/profile', icon: Settings, label: '个人中心', color: 'from-indigo-400 to-indigo-600' },
  ]

  return (
    <div className="min-h-screen gradient-healing relative overflow-hidden transition-gpu">
      <React.Suspense fallback={null}>{allowMotion && showParticles && <LazyParticles />}</React.Suspense>
      <Toaster position="top-center" richColors />
      
      {/* 顶部导航栏 */}
      <nav className="glass-light p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-blue-900 font-bold text-lg">织</span>
            </div>
            <h1 className="text-2xl font-bold text-blue-900 drop-shadow-lg text-shadow-lg">DREWEAVE 织梦</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center space-x-2 text-blue-800 hover:text-blue-900 transition-colors duration-300 drop-shadow-md"
              title="个人中心"
            >
              <User className="w-5 h-5 drop-shadow-sm" />
              <span className="font-medium hidden sm:inline drop-shadow-md">{user?.username || user?.email}</span>
            </Link>
            <button
              onClick={logout}
              className="glass-light p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-300 drop-shadow-md"
              title="退出登录"
            >
              <LogOut className="w-5 h-5 text-blue-800 drop-shadow-sm" />
            </button>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="max-w-6xl mx-auto p-6">
        {/* 欢迎区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-blue-900 mb-4 drop-shadow-lg">欢迎来到你的治愈空间</h2>
          <p className="text-xl text-blue-800 drop-shadow-md">
            每一天都是新的开始，让我们一起织梦前行 🌱
          </p>
        </div>
        {/* 功能导航网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {navigationItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className="card-healing group hover:scale-105 transition-all duration-300 drop-shadow-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-blue-900 drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 drop-shadow-sm">
                      {item.label}
                    </h3>
                    <p className="text-sm text-gray-700 drop-shadow-sm">
                      {getDescription(item.path)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* 今日状态卡片 */}
        <div className="glass rounded-3xl p-8 text-center drop-shadow-lg">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 drop-shadow-md">今日状态</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2 drop-shadow-sm">{currentStreak}</div>
              <div className="text-blue-800 drop-shadow-sm">连续打卡天数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2 drop-shadow-sm">{balance}</div>
              <div className="text-blue-800 drop-shadow-sm">织梦豆余额</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2 drop-shadow-sm">{stats?.completed_achievements || 0}</div>
              <div className="text-blue-800 drop-shadow-sm">已解锁成就</div>
            </div>
          </div>
          <div className="mt-4 text-blue-800 text-sm">
            最近一次签到：{lastCheckinTs ? new Date(lastCheckinTs).toLocaleString() : '暂无'}
          </div>
          <div className="mt-4">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500 text-white text-sm">{abst.treeStage === 'seedling' ? '幼苗' : abst.treeStage === 'sapling' ? '小树' : abst.treeStage === 'young' ? '中树' : '大树'}</span>
          </div>
        </div>
        {/* 每日寄语 */}
        <div className="mt-12 text-center">
          <div className="glass-light rounded-3xl p-6 max-w-2xl mx-auto drop-shadow-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 drop-shadow-sm">每日寄语</h4>
            <p className="text-gray-800 italic drop-shadow-sm">
              "自律给我自由，每一天的坚持都是对未来的投资。"
            </p>
          </div>
        </div>
      </main>

      {/* 底部浮动冷静按钮 */}
      <div className="fixed bottom-6 right-6">
        <Link
          to="/calm"
          className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300 group drop-shadow-2xl border-2 border-white border-opacity-30"
        >
          <Heart className="w-8 h-8 text-blue-900 drop-shadow-md group-hover:animate-pulse" />
        </Link>
      </div>
    </div>
  )
}

// 获取功能描述
function getDescription(path: string): string {
  const descriptions: Record<string, string> = {
    '/discipline-journey': '围绕自律目标的每日打卡与连续统计',
    '/test': '科学评估状态，了解自己更好',
    '/calm': '当冲动来临时，给自己一个暂停的空间',
    '/market': '用努力换取奖励，让坚持更有动力',
    '/achievements': '解锁成就勋章，记录每一个里程碑',
    '/profile': '管理个人信息，查看成长数据',
  }
  return descriptions[path] || '探索更多功能'
}

export default Home