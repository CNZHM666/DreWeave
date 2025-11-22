import React from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
const LoginForm = React.lazy(() => import('./components/LoginForm'))
const Home = React.lazy(() => import('./pages/Home'))
const TestCenter = React.lazy(() => import('./pages/TestCenter'))
const CalmingSpace = React.lazy(() => import('./pages/CalmingSpace'))
const Market = React.lazy(() => import('./pages/Market'))
const Achievements = React.lazy(() => import('./pages/Achievements'))
const Profile = React.lazy(() => import('./pages/Profile'))
const HabitCheckIn = React.lazy(() => import('./pages/HabitCheckIn'))
const GoalDetail = React.lazy(() => import('./pages/GoalDetail'))
const TestCapabilityAnalysis = React.lazy(() => import('./components/TestCapabilityAnalysis'))
const TestVerification = React.lazy(() => import('./components/TestVerification'))
import { useTestStore } from './stores/testStore'
import { useCalmingStore, getBreathingAnimations } from './stores/calmingStore'
import { useMarketStore } from './stores/marketStore'
import { useAchievementStore } from './stores/achievementStore'
import { testTypes } from './data/testQuestions'
import { recordEvent } from './utils/metrics'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import { Toaster } from 'sonner'
const AdminLogin = React.lazy(() => import('./admin/pages/AdminLogin'))
const AdminDashboard = React.lazy(() => import('./admin/pages/AdminDashboard'))
const AssessmentsPage = React.lazy(() => import('./admin/pages/AssessmentsPage'))
const AddictionAssessment = React.lazy(() => import('./pages/AddictionAssessment'))
const AdminRegister = React.lazy(() => import('./admin/pages/AdminRegister'))
const UsersPage = React.lazy(() => import('./admin/pages/UsersPage'))
const MeasurementsPage = React.lazy(() => import('./admin/pages/MeasurementsPage'))
const CheckinsPage = React.lazy(() => import('./admin/pages/CheckinsPage'))
const ReportsPage = React.lazy(() => import('./admin/pages/ReportsPage'))
const SettingsPage = React.lazy(() => import('./admin/pages/SettingsPage'))
const AdminLayout = React.lazy(() => import('./admin/pages/AdminLayout'))

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-healing">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">加载中...</p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

// 公开路由组件
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>
}

function App() {
  const { checkAuth } = useAuthStore()
  const { checkNetworkStatus } = useAuthStore()
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  React.useEffect(() => {
    const start = () => {
      const supaConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY
      if (!supaConfigured) {
        try { useAuthStore.getState().switchToOfflineMode() } catch {}
        return
      }
      try { checkAuth().catch(() => {}) } catch {}
      try {
        const t = setTimeout(() => {
          const s = useAuthStore.getState()
          if (!s.isAuthenticated && s.networkStatus !== 'online') {
            try { s.switchToOfflineMode() } catch {}
          }
        }, 2500)
        return () => clearTimeout(t)
      } catch {}
      recordEvent('app_mount')
    }
    if ('requestIdleCallback' in window) {
      const h = (window as any).requestIdleCallback(() => start())
      return () => { try { (window as any).cancelIdleCallback(h) } catch {} }
    } else {
      const t = setTimeout(() => start(), 0)
      return () => clearTimeout(t)
    }
  }, [checkAuth])

  React.useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      const dm = (navigator as any).deviceMemory
      const lowMem = typeof dm === 'number' && dm <= 2
      const cores = navigator.hardwareConcurrency || 8
      const lowCpu = cores <= 4
      const reduce = m.matches || lowMem || lowCpu
      if (reduce) document.documentElement.setAttribute('data-reduced-motion', 'true')
      else document.documentElement.removeAttribute('data-reduced-motion')
    }
    apply()
    m.addEventListener('change', apply)
    return () => m.removeEventListener('change', apply)
  }, [])

  React.useEffect(() => {
    try {
      const reduce = () => document.documentElement.setAttribute('data-reduced-motion', 'true')
      const dm = (navigator as any).deviceMemory
      const lowMem = typeof dm === 'number' && dm <= 2
      const cores = navigator.hardwareConcurrency || 8
      const lowCpu = cores <= 4
      if (lowMem || lowCpu) reduce()
    } catch {}
  }, [])

  React.useEffect(() => {
    const start = () => {
      const supaConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY
      if (!supaConfigured) return
      try { checkNetworkStatus().catch(() => {}) } catch {}
      const id = setInterval(() => {
        try { useAuthStore.getState().checkNetworkStatus().catch(() => {}) } catch {}
      }, 60000)
      recordEvent('network_check_init')
      return () => clearInterval(id)
    }
    if ('requestIdleCallback' in window) {
      const h = (window as any).requestIdleCallback(() => start())
      return () => { try { (window as any).cancelIdleCallback(h) } catch {} }
    } else {
      const t = setTimeout(() => start(), 1200)
      return () => clearTimeout(t)
    }
  }, [checkNetworkStatus])

  React.useEffect(() => {
    if (!import.meta.env.DEV) return
    const params = new URLSearchParams(location.search)
    const dbg = params.get('debug')
    if (dbg === 'stores' && isAuthenticated && user?.id) {
      ;(async () => {
        // 已移除旧签到集成测试

        try {
          const ts = useTestStore.getState()
          ts.startTest('iat')
          const currentTestData = testTypes.IAT
          for (const q of currentTestData.questions) {
            ts.answerQuestion(q.id, 3)
          }
          await ts.submitTest(user.id)
        } catch (e: any) {
          console.debug('TestCenter test error', e)
        }

        try {
          const calm = useCalmingStore.getState()
          const animations = getBreathingAnimations()
          calm.startBreathing(animations[0])
          setTimeout(() => {
            calm.stopBreathing()
            useAchievementStore.getState().updateProgress(user.id, 'calm_sessions', 1)
          }, 1000)
        } catch (e: any) {
          console.debug('CalmingSpace test error', e)
        }

        try {
          const market = useMarketStore.getState()
          await market.fetchUserData(user.id)
          await market.earnCoins(user.id, 5, '自动化测试奖励')
          await market.createReward(user.id, { title: '自动化测试奖励', description: '测试用', cost: 1 })
        } catch (e: any) {
          console.debug('Market test error', e)
        }

        try {
          const ach = useAchievementStore.getState()
          await ach.fetchAchievements()
          await ach.fetchUserAchievements(user.id)
          await ach.updateProgress(user.id, 'tests', 1)
          await ach.checkAchievements(user.id)
        } catch (e: any) {
          console.debug('Achievements test error', e)
        }
        console.log('Zustand stores integration test completed')
      })()
    }
  }, [location.search, isAuthenticated, user?.id])

  return (
    <div className="App">
      <Toaster richColors position="top-center" />
      <ErrorBoundary>
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
        <Routes>
        {/* 登录页面 */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginForm onSuccess={() => navigate('/')} />
            </PublicRoute>
          }
        />
        
        {/* 主应用页面 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        
        {/* 其他受保护的路由 */}
        

        <Route
          path="/discipline-journey"
          element={
            <ProtectedRoute>
              <HabitCheckIn />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discipline-journey/assessment"
          element={
            <ProtectedRoute>
              <AddictionAssessment />
            </ProtectedRoute>
          }
        />

        

        <Route
          path="/goal/:id"
          element={
            <ProtectedRoute>
              <GoalDetail />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/test"
          element={
            <ProtectedRoute>
              <TestCenter />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/calm"
          element={
            <ProtectedRoute>
              <CalmingSpace />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/market"
          element={
            <ProtectedRoute>
              <Market />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/achievements"
          element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        {/* 能力分析图表测试页面 */}
        <Route
          path="/test-charts"
          element={
            <ProtectedRoute>
              <TestCapabilityAnalysis />
            </ProtectedRoute>
          }
        />
        
        {/* 测试验证页面 */}
        <Route
          path="/test-verification"
          element={
            <ProtectedRoute>
              <TestVerification />
            </ProtectedRoute>
          }
        />

        {/* 管理员入口与控制台 */}
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="measurements" element={<MeasurementsPage />} />
          <Route path="checkins" element={<CheckinsPage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
      </ErrorBoundary>
    </div>
  )
}

export default App
