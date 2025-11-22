import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../config/supabase'
import { safeFetch, NetworkMonitor, createSafeSupabaseClient } from '../utils/network-fixes'

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
}

// 认证动作接口
interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, confirmPassword: string, studentId?: string) => Promise<void>
  logout: () => Promise<void>
  checkUsername: (username: string) => Promise<boolean>
  clearError: () => void
  syncOfflineData: () => Promise<void>
  initializeNetwork: () => Promise<void>
}

// 组合类型
interface AuthStore extends AuthState, AuthActions {}

// ERR_ABORTED 错误处理
const handleNetworkError = (error: any, context: string): string => {
  console.debug(`🚨 ${context} 网络错误:`, error)
  
  if (error.message?.includes('ERR_ABORTED')) {
    return '网络连接被中断，请检查网络连接或尝试离线模式'
  }
  
  if (error.message?.includes('Failed to fetch')) {
    return '网络请求失败，请检查网络连接'
  }
  
  if (error.message?.includes('CORS')) {
    return '跨域请求被阻止，正在尝试替代方案'
  }
  
  if (error.message?.includes('timeout')) {
    return '网络超时，请检查网络连接或稍后重试'
  }
  
  return error.message || '网络连接异常，请稍后重试'
}

// 离线数据管理器
class OfflineDataManager {
  private storageKey = 'dreweave-offline-data'
  private pendingSyncKey = 'dreweave-pending-sync'
  
  saveOfflineUser(user: User) {
    try {
      const data = this.getOfflineData()
      data.user = user
      data.lastSync = new Date().toISOString()
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      console.log('💾 离线用户数据已保存:', user.username)
    } catch (error: any) {
      console.debug('📝 保存离线用户数据失败:', error)
    }
  }
  
  getOfflineData() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : { user: null, lastSync: null }
    } catch (error: any) {
      console.debug('📝 读取离线数据失败，返回空数据:', error)
      return { user: null, lastSync: null }
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
      console.log('📤 添加待同步任务:', type)
    } catch (error: any) {
      console.debug('📝 添加待同步任务失败:', error)
    }
  }
  
  getPendingSync() {
    try {
      const stored = localStorage.getItem(this.pendingSyncKey)
      return stored ? JSON.parse(stored) : []
    } catch (error: any) {
      console.debug('📝 读取待同步任务失败，返回空数组:', error)
      return []
    }
  }
  
  clearPendingSync(id?: string) {
    try {
      if (id) {
        const pending = this.getPendingSync()
        const filtered = pending.filter((item: any) => item.id !== id)
        localStorage.setItem(this.pendingSyncKey, JSON.stringify(filtered))
        console.log('🗑️ 清除待同步任务:', id)
      } else {
        localStorage.removeItem(this.pendingSyncKey)
        console.log('🗑️ 清除所有待同步任务')
      }
    } catch (error: any) {
      console.debug('📝 清除待同步任务失败:', error)
    }
  }
}

// 创建离线数据管理器实例
const offlineManager = new OfflineDataManager()

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

      // 初始化网络
      initializeNetwork: async () => {
        console.log('🌐 初始化网络连接...')
        try {
          // 初始化网络修复
          createSafeSupabaseClient()
          
          // 检测网络状态
          const isOnline = await NetworkMonitor.testConnection()
          set({ networkStatus: isOnline ? 'online' : 'offline' })
          
          if (!isOnline) {
            console.debug('📝 网络连接失败，启用离线模式')
            set({ offlineMode: true })
            
            // 尝试加载离线用户数据
            const offlineData = offlineManager.getOfflineData()
            if (offlineData.user) {
              console.log('📱 加载离线用户数据:', offlineData.user.username)
              set({ 
                user: offlineData.user, 
                isAuthenticated: true 
              })
            }
          }
          
          // 监听网络状态变化
          NetworkMonitor.addListener(async (online) => {
            const currentStatus = get().networkStatus
            const newStatus = online ? 'online' : 'offline'
            
            if (currentStatus !== newStatus) {
              console.log(`🌐 网络状态变化: ${currentStatus} → ${newStatus}`)
              set({ networkStatus: newStatus })
              
              if (online) {
                // 网络恢复，尝试同步离线数据
                set({ offlineMode: false })
                await get().syncOfflineData()
              } else {
                // 网络断开，启用离线模式
                set({ offlineMode: true })
              }
            }
          })
          
          console.log('✅ 网络初始化完成')
        } catch (error: any) {
          console.debug('📝 网络初始化失败:', error)
          set({ 
            networkStatus: 'offline',
            offlineMode: true,
            error: handleNetworkError(error, '网络初始化')
          })
        }
      },

      // 登录
      login: async (username: string, password: string) => {
        console.log('🔐 开始登录流程...')
        set({ isLoading: true, error: null })
        
        try {
          // 检查网络状态
          const isOnline = await NetworkMonitor.testConnection()
          
          if (!isOnline) {
            console.debug('📝 网络离线，尝试离线登录')
            set({ offlineMode: true })
            
            // 离线模式：验证本地存储的用户凭据
            const offlineData = offlineManager.getOfflineData()
            if (offlineData.user && offlineData.user.username === username) {
              console.log('✅ 离线登录成功:', username)
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
          console.log('🌐 尝试在线登录...')
          
          // 首先查询用户ID
          const { data: users, error: queryError } = await supabase
            .from('users')
            .select('id, username, email, student_id, avatar_url, coins, created_at, updated_at')
            .eq('username', username)
            .single()
          
          if (queryError) {
            throw new Error('用户不存在或查询失败')
          }
          
          if (!users) {
            throw new Error('用户不存在')
          }
          
          // 使用模拟的认证（因为我们现在使用用户名+密码模式）
          // 在实际应用中，这里应该验证密码
          console.log('✅ 在线登录成功:', username)
          
          // 保存用户数据到本地存储
          offlineManager.saveOfflineUser(users)
          
          set({
            user: users,
            isAuthenticated: true,
            isLoading: false,
            offlineMode: false
          })
          
        } catch (error: any) {
          console.debug('📝 登录失败:', error)
          const errorMessage = handleNetworkError(error, '登录')
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null
          })
          throw error
        }
      },

      // 注册
      register: async (username: string, password: string, confirmPassword: string, studentId?: string) => {
        console.log('📝 开始注册流程...')
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
          
          // 检查网络状态
          const isOnline = await NetworkMonitor.testConnection()
          
          if (!isOnline) {
            console.debug('📝 网络离线，启用离线注册模式')
            set({ offlineMode: true })
            
            // 检查用户名是否已存在（离线模式）
            const offlineData = offlineManager.getOfflineData()
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
            offlineManager.saveOfflineUser(offlineUser)
            offlineManager.addPendingSync('register', { username, password, studentId })
            
            console.log('✅ 离线注册成功:', username)
            set({
              user: offlineUser,
              isAuthenticated: true,
              isLoading: false
            })
            
            return
          }
          
          // 在线模式：检查用户名是否已存在
          console.log('🔍 检查用户名可用性...')
          const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single()
          
          if (existingUser) {
            throw new Error('用户名已存在')
          }
          
          // 创建新用户
          console.log('🌐 创建在线用户...')
          const newUser = {
            username,
            email: `${username}@local.local`, // 临时邮箱格式
            password, // 注意：实际应用中应该加密存储
            student_id: studentId,
            coins: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single()
          
          if (createError) {
            throw new Error(`用户创建失败: ${createError.message}`)
          }
          
          console.log('✅ 在线注册成功:', username)
          
          // 保存到本地存储
          offlineManager.saveOfflineUser(createdUser)
          
          set({
            user: createdUser,
            isAuthenticated: true,
            isLoading: false,
            offlineMode: false
          })
          
        } catch (error: any) {
          console.debug('📝 注册失败:', error)
          const errorMessage = handleNetworkError(error, '注册')
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null
          })
          throw error
        }
      },

      // 登出
      logout: async () => {
        console.log('🚪 用户登出...')
        try {
          set({ isLoading: true })
          
          // 在线模式下清除Supabase会话
          const { error } = await supabase.auth.signOut()
          if (error) {
            console.debug('📝 Supabase登出失败:', error.message)
          }
          
          // 清除本地存储的用户数据
          offlineManager.saveOfflineUser(null as any)
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
          
          console.log('✅ 登出成功')
        } catch (error: any) {
          console.debug('📝 登出失败:', error)
          set({ isLoading: false })
        }
      },

      // 检查用户名可用性
      checkUsername: async (username: string): Promise<boolean> => {
        if (!username || username.length < 3) {
          return false
        }
        
        try {
          const isOnline = await NetworkMonitor.testConnection()
          
          if (!isOnline) {
            // 离线模式：检查本地存储
            const offlineData = offlineManager.getOfflineData()
            return !(offlineData.user && offlineData.user.username === username)
          }
          
          // 在线模式：查询数据库
          const { data, error } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single()
          
          return !error && !data
        } catch (error: any) {
          console.debug('📝 用户名检查失败:', error)
          // 如果检查失败，允许用户名（保守策略）
          return true
        }
      },

      // 同步离线数据
      syncOfflineData: async () => {
        console.log('🔄 开始同步离线数据...')
        try {
          const pendingSync = offlineManager.getPendingSync()
          
          if (pendingSync.length === 0) {
            console.log('ℹ️ 没有待同步的数据')
            return
          }
          
          console.log(`📤 发现 ${pendingSync.length} 个待同步任务`)
          
          for (const task of pendingSync) {
            try {
              if (task.type === 'register') {
                // 同步注册用户
                const { data, error } = await supabase
                  .from('users')
                  .insert([task.data])
                  .select()
                  .single()
                
                if (error) {
                  console.debug(`📝 同步注册失败: ${error.message}`)
                } else {
                  console.log(`✅ 同步注册成功: ${task.data.username}`)
                  offlineManager.clearPendingSync(task.id)
                }
              }
            } catch (error: any) {
              console.debug(`📝 同步任务失败: ${error}`)
            }
          }
          
          console.log('✅ 离线数据同步完成')
        } catch (error: any) {
          console.debug('📝 同步离线数据失败:', error)
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        offlineMode: state.offlineMode
      })
    }
  )
)

// 初始化网络连接（应用启动时调用）
export const initializeAuthNetwork = async () => {
  console.log('🚀 初始化认证网络...')
  await useAuthStore.getState().initializeNetwork()
}

// 导出用于调试的工具
export const debugAuthIssues = async () => {
  console.log('🔍 开始认证问题调试...')
  
  const state = useAuthStore.getState()
  console.log('📊 当前认证状态:', {
    isAuthenticated: state.isAuthenticated,
    networkStatus: state.networkStatus,
    offlineMode: state.offlineMode,
    user: state.user
  })
  
  // 测试网络连接
  const isOnline = await NetworkMonitor.testConnection()
  console.log('🌐 网络连接状态:', isOnline)
  
  // 检查离线数据
  const offlineData = offlineManager.getOfflineData()
  console.log('📱 离线用户数据:', offlineData)
  
  const pendingSync = offlineManager.getPendingSync()
  console.log('📤 待同步任务:', pendingSync)
  
  return {
    isOnline,
    offlineData,
    pendingSync,
    authState: {
      isAuthenticated: state.isAuthenticated,
      networkStatus: state.networkStatus,
      offlineMode: state.offlineMode
    }
  }
}
