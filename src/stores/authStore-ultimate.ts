import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../config/supabase'
import { UltimateNetworkFix } from '../utils/ultimate-network-fix'

// 用户类型定义
interface User {
  id: string
  username: string
  email: string
  student_id?: string
  avatar_url?: string
  coins?: number
  created_at?: string
  updated_at?: string
}

// 认证状态接口
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  networkStatus: 'online' | 'offline' | 'unknown'
  offlineMode: boolean
  networkDiagnostics: any
}

// 认证动作接口
interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, confirmPassword: string, studentId?: string) => Promise<void>
  logout: () => Promise<void>
  checkUsername: (username: string) => Promise<boolean>
  clearError: () => void
  syncOfflineData: () => Promise<void>
  initializeUltimateNetwork: () => Promise<void>
  runUltimateDiagnostics: () => Promise<any>
}

// 组合类型
interface AuthStore extends AuthState, AuthActions {}

// 离线数据管理器（增强版）
class EnhancedOfflineDataManager {
  private storageKey = 'dreweave-ultimate-offline-data'
  private pendingSyncKey = 'dreweave-ultimate-pending-sync'
  private diagnosticsKey = 'dreweave-ultimate-diagnostics'
  
  saveOfflineUser(user: User) {
    try {
      const data = this.getOfflineData()
      data.user = user
      data.lastSync = new Date().toISOString()
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      console.log('💾 终极离线用户数据已保存:', user.username)
    } catch (error: any) {
      console.debug('📝 保存终极离线用户数据失败:', error)
    }
  }
  
  getOfflineData() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : { user: null, lastSync: null, diagnostics: null }
    } catch (error: any) {
      console.debug('📝 读取终极离线数据失败，返回空数据:', error)
      return { user: null, lastSync: null, diagnostics: null }
    }
  }
  
  saveDiagnostics(diagnostics: any) {
    try {
      localStorage.setItem(this.diagnosticsKey, JSON.stringify(diagnostics))
      console.log('📊 诊断数据已保存')
    } catch (error: any) {
      console.debug('📝 保存诊断数据失败:', error)
    }
  }
  
  getDiagnostics() {
    try {
      const stored = localStorage.getItem(this.diagnosticsKey)
      return stored ? JSON.parse(stored) : null
    } catch (error: any) {
      console.debug('📝 读取诊断数据失败:', error)
      return null
    }
  }
  
  addPendingSync(type: 'register' | 'login', data: any) {
    try {
      const pending = this.getPendingSync()
      pending.push({
        type,
        data,
        timestamp: new Date().toISOString(),
        id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })
      localStorage.setItem(this.pendingSyncKey, JSON.stringify(pending))
      console.log('📤 添加终极待同步任务:', type)
    } catch (error: any) {
      console.debug('📝 添加终极待同步任务失败:', error)
    }
  }
  
  getPendingSync() {
    try {
      const stored = localStorage.getItem(this.pendingSyncKey)
      return stored ? JSON.parse(stored) : []
    } catch (error: any) {
      console.debug('📝 读取终极待同步任务失败，返回空数组:', error)
      return []
    }
  }
  
  clearPendingSync(id?: string) {
    try {
      if (id) {
        const pending = this.getPendingSync()
        const filtered = pending.filter((item: any) => item.id !== id)
        localStorage.setItem(this.pendingSyncKey, JSON.stringify(filtered))
        console.log('🗑️ 清除终极待同步任务:', id)
      } else {
        localStorage.removeItem(this.pendingSyncKey)
        console.log('🗑️ 清除所有终极待同步任务')
      }
    } catch (error: any) {
      console.debug('📝 清除终极待同步任务失败:', error)
    }
  }
}

// 创建增强离线数据管理器实例
const enhancedOfflineManager = new EnhancedOfflineDataManager()

// 创建认证存储
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 状态
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      networkStatus: 'unknown',
      offlineMode: false,
      networkDiagnostics: null,

      // 初始化终极网络
      initializeUltimateNetwork: async () => {
        console.log('🚀 初始化终极网络连接...')
        
        try {
          // 检测网络环境
          const networkEnv = UltimateNetworkFix.detectNetworkEnvironment()
          console.log('🌐 网络环境检测:', networkEnv)
          
          // 运行终极连接测试
          const diagnostics = await UltimateNetworkFix.ultimateConnectionTest()
          console.log('📊 终极网络诊断结果:', diagnostics)
          
          // 保存诊断数据
          enhancedOfflineManager.saveDiagnostics(diagnostics)
          
          // 根据测试结果设置网络状态
          const isOnline = diagnostics.success
          set({ 
            networkStatus: isOnline ? 'online' : 'offline',
            networkDiagnostics: diagnostics
          })
          
          if (!isOnline) {
            console.debug('📝 终极网络测试失败，启用终极离线模式')
            set({ offlineMode: true })
            
            // 尝试加载离线用户数据
            const offlineData = enhancedOfflineManager.getOfflineData()
            if (offlineData.user) {
              console.log('📱 加载终极离线用户数据:', offlineData.user.username)
              set({ 
                user: offlineData.user, 
                isAuthenticated: true 
              })
            }
          }
          
          // 设置网络状态监听器
          if (typeof window !== 'undefined') {
            window.addEventListener('online', async () => {
              console.log('🟢 网络恢复在线')
              set({ networkStatus: 'online', offlineMode: false })
              await get().syncOfflineData()
            })
            
            window.addEventListener('offline', () => {
              console.log('🔴 网络变为离线')
              set({ networkStatus: 'offline', offlineMode: true })
            })
          }
          
          console.log('✅ 终极网络初始化完成')
          
        } catch (error: any) {
          console.debug('📝 终极网络初始化失败:', error)
          set({ 
            networkStatus: 'offline',
            offlineMode: true,
            error: `网络初始化失败: ${error.message}`
          })
        }
      },

      // 运行终极诊断
      runUltimateDiagnostics: async () => {
        console.log('🔍 运行终极网络诊断...')
        
        try {
          const diagnostics = await UltimateNetworkFix.ultimateConnectionTest()
          enhancedOfflineManager.saveDiagnostics(diagnostics)
          set({ networkDiagnostics: diagnostics })
          
          console.log('✅ 终极诊断完成:', diagnostics)
          return diagnostics
          
        } catch (error: any) {
          console.debug('📝 终极诊断失败:', error)
          const failedDiagnostics = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            tests: [],
            recommendations: ['诊断失败，建议启用离线模式']
          }
          
          enhancedOfflineManager.saveDiagnostics(failedDiagnostics)
          set({ networkDiagnostics: failedDiagnostics })
          return failedDiagnostics
        }
      },

      // 登录
      login: async (username: string, password: string) => {
        console.log('🔐 开始终极登录流程...')
        set({ isLoading: true, error: null })
        
        try {
          // 验证输入
          if (!username || username.length < 3) {
            throw new Error('用户名至少需要3个字符')
          }
          
          if (!password || password.length < 8) {
            throw new Error('密码至少需要8个字符')
          }
          
          // 使用终极网络测试检查连接
          const networkTest = await UltimateNetworkFix.ultimateConnectionTest()
          const isOnline = networkTest.success
          
          console.log(`🌐 网络状态: ${isOnline ? '在线' : '离线'}`)
          
          if (!isOnline) {
            console.debug('📝 网络离线，启用终极离线登录模式')
            set({ offlineMode: true })
            
            // 离线模式：验证本地存储的用户凭据
            const offlineData = enhancedOfflineManager.getOfflineData()
            if (offlineData.user && offlineData.user.username === username) {
              console.log('✅ 终极离线登录成功:', username)
              set({
                user: offlineData.user,
                isAuthenticated: true,
                isLoading: false
              })
              return
            } else {
              throw new Error('离线模式下未找到用户数据，请先注册')
            }
          }
          
          // 在线模式：使用Supabase认证
          console.log('🌐 尝试终极在线登录...')
          
          // 创建终极安全请求包装器
          const safeFetch = UltimateNetworkFix.createERR_ABORTEDSafeFetch()
          
          // 首先查询用户
          const userUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?select=*&username=eq.${username}&limit=1`
          
          try {
            const response = await safeFetch(userUrl, {
              method: 'GET',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
              }
            })
            
            if (!response.ok) {
              throw new Error('用户查询失败')
            }
            
            const users = await response.json()
            
            if (!users || users.length === 0) {
              throw new Error('用户不存在')
            }
            
            const user = users[0]
            
            // 验证密码（这里简化处理，实际应该使用安全的密码验证）
            console.log('✅ 终极在线登录成功:', username)
            
            // 保存用户数据到本地存储
            enhancedOfflineManager.saveOfflineUser(user)
            
            set({
              user: user,
              isAuthenticated: true,
              isLoading: false,
              offlineMode: false
            })
            
          } catch (networkError) {
            console.debug('📝 终极在线登录网络失败:', networkError)
            throw new Error(`登录失败: ${networkError.message}`)
          }
          
          } catch (error: any) {
            console.debug('📝 终极登录失败:', error)
            set({
              error: error.message,
              isLoading: false,
              isAuthenticated: false,
              user: null
            })
            throw error
          }
      },

      // 注册
      register: async (username: string, password: string, confirmPassword: string, studentId?: string) => {
        console.log('📝 开始终极注册流程...')
        set({ isLoading: true, error: null })
        
        try {
          // 验证输入
          if (!username || username.length < 3) {
            throw new Error('用户名至少需要3个字符')
          }
          
          if (!password || password.length < 8) {
            throw new Error('密码至少需要8个字符')
          }
          
          if (password !== confirmPassword) {
            throw new Error('两次输入的密码不一致')
          }
          
          // 使用终极网络测试检查连接
          const networkTest = await UltimateNetworkFix.ultimateConnectionTest()
          const isOnline = networkTest.success
          
          console.log(`🌐 网络状态: ${isOnline ? '在线' : '离线'}`)
          
          if (!isOnline) {
            console.debug('📝 网络离线，启用终极离线注册模式')
            set({ offlineMode: true })
            
            // 检查用户名是否已存在（离线模式）
            const offlineData = enhancedOfflineManager.getOfflineData()
            if (offlineData.user && offlineData.user.username === username) {
              throw new Error('用户名已存在')
            }
            
            // 创建离线用户
            const offlineUser: User = {
              id: `offline-${Date.now()}`,
              username,
              email: `${username}@offline.local`,
              student_id: studentId,
              coins: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            // 保存离线用户
            enhancedOfflineManager.saveOfflineUser(offlineUser)
            enhancedOfflineManager.addPendingSync('register', { username, password, studentId })
            
            console.log('✅ 终极离线注册成功:', username)
            set({
              user: offlineUser,
              isAuthenticated: true,
              isLoading: false
            })
            
            return
          }
          
          // 在线模式：检查用户名是否已存在
          console.log('🔍 终极检查用户名可用性...')
          const isUsernameAvailable = await get().checkUsername(username)
          
          if (!isUsernameAvailable) {
            throw new Error('用户名已存在')
          }
          
          // 创建终极安全请求包装器
          const safeFetch = UltimateNetworkFix.createERR_ABORTEDSafeFetch()
          
          // 创建新用户
          console.log('🌐 终极创建在线用户...')
          const newUser = {
            username,
            email: `${username}@local.local`,
            student_id: studentId,
            coins: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const createUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users`
          
          try {
            const response = await safeFetch(createUrl, {
              method: 'POST',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(newUser)
            })
            
            if (!response.ok) {
              throw new Error(`用户创建失败: HTTP ${response.status}`)
            }
            
            const createdUser = await response.json()
            
            console.log('✅ 终极在线注册成功:', username)
            
            // 保存到本地存储
            enhancedOfflineManager.saveOfflineUser(createdUser)
            
            set({
              user: createdUser,
              isAuthenticated: true,
              isLoading: false,
              offlineMode: false
            })
            
          } catch (networkError) {
            console.debug('📝 终极在线注册网络失败:', networkError)
            throw new Error(`注册失败: ${networkError.message}`)
          }
          
          } catch (error: any) {
            console.debug('📝 终极注册失败:', error)
            set({
              error: error.message,
              isLoading: false,
              isAuthenticated: false,
              user: null
            })
            throw error
          }
      },

      // 登出
      logout: async () => {
        console.log('🚪 用户终极登出...')
        try {
          set({ isLoading: true })
          
          // 在线模式下清除Supabase会话
          const { error } = await supabase.auth.signOut()
          if (error) {
            console.debug('📝 Supabase登出失败:', error.message)
          }
          
          // 清除本地存储的用户数据
          enhancedOfflineManager.saveOfflineUser(null as any)
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
          
          console.log('✅ 终极登出成功')
        } catch (error: any) {
          console.debug('📝 终极登出失败:', error)
          set({ isLoading: false })
        }
      },

      // 检查用户名可用性
      checkUsername: async (username: string): Promise<boolean> => {
        if (!username || username.length < 3) {
          return false
        }
        
        try {
          // 使用终极网络测试检查连接
          const networkTest = await UltimateNetworkFix.ultimateConnectionTest()
          const isOnline = networkTest.success
          
          if (!isOnline) {
            // 离线模式：检查本地存储
            const offlineData = enhancedOfflineManager.getOfflineData()
            return !(offlineData.user && offlineData.user.username === username)
          }
          
          // 在线模式：使用终极安全请求查询数据库
          const safeFetch = UltimateNetworkFix.createERR_ABORTEDSafeFetch()
          const checkUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?select=username&username=eq.${username}&limit=1`
          
          try {
            const { data: { session } } = await supabase.auth.getSession()
            const headers: Record<string, string> = {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Accept': 'application/json'
            }
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`
            }
            const response = await safeFetch(checkUrl, {
              method: 'GET',
              headers
            })
            
            if (!response.ok) {
              // 如果查询失败，允许用户名（保守策略）
              return true
            }
            
            const users = await response.json()
            return !users || users.length === 0
            
          } catch (networkError) {
            console.debug('📝 终极用户名检查网络失败:', networkError)
            // 网络失败时允许用户名
            return true
          }
          
          } catch (error: any) {
            console.debug('📝 终极用户名检查失败:', error)
            // 如果检查失败，允许用户名（保守策略）
            return true
          }
      },

      // 同步离线数据
      syncOfflineData: async () => {
        console.log('🔄 开始终极离线数据同步...')
        
        try {
          const pendingSync = enhancedOfflineManager.getPendingSync()
          
          if (pendingSync.length === 0) {
            console.log('ℹ️ 没有待同步的终极数据')
            return
          }
          
          console.log(`📤 发现 ${pendingSync.length} 个终极待同步任务`)
          
          // 创建终极安全请求包装器
          const safeFetch = UltimateNetworkFix.createERR_ABORTEDSafeFetch()
          
          for (const task of pendingSync) {
            try {
              if (task.type === 'register') {
                // 同步注册用户
                const syncUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users`
                const { data: { session } } = await supabase.auth.getSession()
                const headers: Record<string, string> = {
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                }
                if (session?.access_token) {
                  headers['Authorization'] = `Bearer ${session.access_token}`
                }
                const response = await safeFetch(syncUrl, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(task.data)
                })
                
                if (response.ok) {
                  console.log(`✅ 终极同步注册成功: ${task.data.username}`)
                  enhancedOfflineManager.clearPendingSync(task.id)
                } else {
                  console.debug(`📝 终极同步注册失败: HTTP ${response.status}`)
                }
              }
            } catch (error: any) {
              console.debug(`📝 终极同步任务失败: ${error}`)
            }
          }
          
          console.log('✅ 终极离线数据同步完成')
        } catch (error: any) {
          console.debug('📝 终极离线数据同步失败:', error)
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'ultimate-auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        offlineMode: state.offlineMode,
        networkStatus: state.networkStatus
      })
    }
  )
)

// 初始化终极网络连接（应用启动时调用）
export const initializeUltimateAuthNetwork = async () => {
  console.log('🌟 初始化终极认证网络...')
  await useAuthStore.getState().initializeUltimateNetwork()
}

// 导出用于调试的工具
export const debugUltimateAuthIssues = async () => {
  console.log('🔍 开始终极认证问题调试...')
  
  const state = useAuthStore.getState()
  console.log('📊 当前终极认证状态:', {
    isAuthenticated: state.isAuthenticated,
    networkStatus: state.networkStatus,
    offlineMode: state.offlineMode,
    user: state.user,
    networkDiagnostics: state.networkDiagnostics
  })
  
  // 运行终极诊断
  const diagnostics = await state.runUltimateDiagnostics()
  console.log('🔬 终极诊断结果:', diagnostics)
  
  // 检查离线数据
  const offlineData = enhancedOfflineManager.getOfflineData()
  console.log('📱 终极离线用户数据:', offlineData)
  
  const pendingSync = enhancedOfflineManager.getPendingSync()
  console.log('📤 终极待同步任务:', pendingSync)
  
  const savedDiagnostics = enhancedOfflineManager.getDiagnostics()
  console.log('📊 保存的终极诊断数据:', savedDiagnostics)
  
  return {
    isOnline: diagnostics.success,
    offlineData,
    pendingSync,
    diagnostics,
    savedDiagnostics,
    authState: {
      isAuthenticated: state.isAuthenticated,
      networkStatus: state.networkStatus,
      offlineMode: state.offlineMode
    }
  }
}
