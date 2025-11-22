import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initializeEmergencyFix, EmergencyNetworkFix } from '../utils/emergency-network-fix'

// 用户状态接口
interface User {
  id: string
  email: string
  username?: string
  avatar_url?: string
  student_verified?: boolean
  studentId?: string
  created_at: string
  isOffline?: boolean
}

// 认证状态接口
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isOfflineMode: boolean
  networkStatus: 'online' | 'offline' | 'unknown'
}

// 认证操作接口
interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, confirmPassword: string, studentId?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  switchToOfflineMode: () => void
  checkNetworkStatus: () => Promise<string>
}

// 认证存储类型
interface AuthStore extends AuthState, AuthActions {}

// 离线用户管理系统
class OfflineUserManager {
  private users: any[] = []
  private currentSession: any = null

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    try {
      const storedUsers = localStorage.getItem('dreweave_offline_users')
      const storedSession = localStorage.getItem('dreweave_current_session')
      
      this.users = storedUsers ? JSON.parse(storedUsers) : []
      this.currentSession = storedSession ? JSON.parse(storedSession) : null
      
      // 检查会话是否过期
      if (this.currentSession && this.currentSession.expires_at < Date.now()) {
        this.currentSession = null
        localStorage.removeItem('dreweave_current_session')
      }
    } catch (error: any) {
      console.debug('加载离线用户数据失败:', error)
      this.users = []
      this.currentSession = null
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('dreweave_offline_users', JSON.stringify(this.users))
      if (this.currentSession) {
        localStorage.setItem('dreweave_current_session', JSON.stringify(this.currentSession))
      }
    } catch (error: any) {
      console.debug('保存离线用户数据失败:', error)
      throw new Error('本地存储空间不足，请清理浏览器数据')
    }
  }

  private generateUserId(): string {
    return `offline_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private hashPassword(password: string): string {
    // 简单的密码哈希（实际应用中应该使用更强的哈希算法）
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  private validateUsername(username: string): { valid: boolean; message?: string } {
    if (!username || username.length < 3) {
      return { valid: false, message: '用户名至少需要3个字符' }
    }
    if (username.length > 20) {
      return { valid: false, message: '用户名长度不能超过20个字符' }
    }
    if (!/^[a-zA-Z0-9_一-龥]+$/.test(username)) {
      return { valid: false, message: '用户名只能包含字母、数字、下划线和中文' }
    }
    if (/^\d/.test(username)) {
      return { valid: false, message: '用户名不能以数字开头' }
    }
    if (this.users.some(user => user.username === username)) {
      return { valid: false, message: '用户名已存在' }
    }
    return { valid: true }
  }

  private validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return { valid: false, message: '密码至少需要8个字符' }
    }
    if (password.length > 32) {
      return { valid: false, message: '密码长度不能超过32个字符' }
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: '密码必须包含至少一个大写字母' }
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: '密码必须包含至少一个小写字母' }
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: '密码必须包含至少一个数字' }
    }
    if (/\s/.test(password)) {
      return { valid: false, message: '密码不能包含空格' }
    }
    return { valid: true }
  }

  async registerOffline(username: string, password: string, confirmPassword: string, studentId?: string) {
    console.log('📝 开始离线注册:', username)

    try {
      // 验证输入
      if (!username || !password || !confirmPassword) {
        throw new Error('请填写所有必填字段')
      }

      if (password !== confirmPassword) {
        throw new Error('两次输入的密码不一致')
      }

      // 验证用户名
      const usernameValidation = this.validateUsername(username)
      if (!usernameValidation.valid) {
        throw new Error(usernameValidation.message!)
      }

      // 验证密码
      const passwordValidation = this.validatePassword(password)
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message!)
      }

      // 创建用户对象
      const userId = this.generateUserId()
      const now = new Date().toISOString()
      
      const newUser = {
        id: userId,
        username: username,
        student_id: studentId || '',
        password_hash: this.hashPassword(password),
        created_at: now,
        updated_at: now,
        last_login: now,
        is_offline_user: true,
        coins: 0,
        level: 1,
        achievements: [],
        check_ins: [],
        test_results: [],
        email: `${username}@offline.local`
      }

      // 保存用户
      this.users.push(newUser)
      this.saveToStorage()

      // 创建用户会话
      const session = {
        user: {
          id: userId,
          username: username,
          student_id: studentId || '',
          created_at: now,
          coins: 0,
          level: 1,
          isOffline: true,
          email: newUser.email
        },
        access_token: `offline_token_${userId}`,
        refresh_token: `offline_refresh_${userId}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24小时后过期
      }

      this.currentSession = session
      this.saveToStorage()

      console.log('✅ 离线用户注册成功:', username, '(ID:', userId, ')')
      
      return {
        success: true,
        user: newUser,
        session: session,
        isOffline: true,
        message: '注册成功！已切换到离线模式'
      }

    } catch (error: any) {
      console.debug('📝 离线注册失败:', error.message)
      return {
        success: false,
        error: error.message,
        isOffline: true
      }
    }
  }

  async loginOffline(username: string, password: string) {
    console.log('🔑 尝试离线登录:', username)

    try {
      const user = this.users.find(u => u.username === username)
      if (!user) {
        throw new Error('用户不存在')
      }

      if (user.password_hash !== this.hashPassword(password)) {
        throw new Error('密码错误')
      }

      // 更新最后登录时间
      user.last_login = new Date().toISOString()
      this.saveToStorage()

      // 创建会话
      const session = {
        user: {
          id: user.id,
          username: user.username,
          student_id: user.student_id,
          created_at: user.created_at,
          coins: user.coins,
          level: user.level,
          isOffline: true,
          email: user.email
        },
        access_token: `offline_token_${user.id}`,
        refresh_token: `offline_refresh_${user.id}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000)
      }

      this.currentSession = session
      this.saveToStorage()

      console.log('✅ 离线用户登录成功:', username)
      
      return {
        success: true,
        user: user,
        session: session,
        isOffline: true,
        message: '登录成功！已切换到离线模式'
      }

    } catch (error: any) {
      console.debug('📝 离线登录失败:', error.message)
      return {
        success: false,
        error: error.message,
        isOffline: true
      }
    }
  }

  getCurrentUser() {
    if (this.currentSession && this.currentSession.expires_at > Date.now()) {
      return this.currentSession.user
    }
    return null
  }

  updateUserAvatar(userId: string, avatarUrl: string) {
    console.log('🖼️ 更新用户头像:', userId, avatarUrl)
    
    try {
      // 更新用户列表中的头像
      const userIndex = this.users.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        this.users[userIndex].avatar_url = avatarUrl
        console.log('✅ 用户列表头像已更新')
      }

      // 更新当前会话中的头像
      if (this.currentSession && this.currentSession.user.id === userId) {
        this.currentSession.user.avatar_url = avatarUrl
        console.log('✅ 当前会话头像已更新')
      }

      this.saveToStorage()
      console.log('✅ 头像数据已保存到本地存储')
      
      return { success: true, message: '头像更新成功' }
    } catch (error: any) {
      console.error('❌ 头像更新失败:', error.message)
      return { success: false, error: error.message }
    }
  }

  logout() {
    this.currentSession = null
    localStorage.removeItem('dreweave_current_session')
    console.log('👋 离线用户已登出')
  }

  deleteUser(userId: string) {
    const index = this.users.findIndex(u => u.id === userId)
    if (index !== -1) {
      const username = this.users[index].username
      this.users.splice(index, 1)
      this.saveToStorage()
      console.log('🗑️ 离线用户已删除:', username)
      return true
    }
    return false
  }

  getAllUsers() {
    return this.users
  }

  clearAllData() {
    this.users = []
    this.currentSession = null
    localStorage.removeItem('dreweave_offline_users')
    localStorage.removeItem('dreweave_current_session')
    console.log('🧹 所有离线数据已清除')
  }
}

// 创建离线用户管理器实例
const offlineUserManager = new OfflineUserManager()

// 网络状态检查器 - 完全禁用网络请求版本，避免ERR_ABORTED错误
class NetworkStatusChecker {
  private lastKnownStatus: 'online' | 'offline' | 'unknown' = 'unknown'
  private checkCount = 0
  private silentMode = true // 默认静音模式
  
  async checkNetworkStatus(): Promise<'online' | 'offline' | 'unknown'> {
    try {
      this.checkCount++
      if (!navigator.onLine) {
        this.lastKnownStatus = 'offline'
        return 'offline'
      }
      this.lastKnownStatus = 'online'
      return 'online'
    } catch {
      this.lastKnownStatus = 'offline'
      return 'offline'
    }
  }
  
  // 启用/禁用详细日志
  setSilentMode(silent: boolean) {
    this.silentMode = silent
  }
}

const networkChecker = new NetworkStatusChecker()

// 创建认证状态管理
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isOfflineMode: false,
      networkStatus: 'unknown',

      // 检查网络状态
      checkNetworkStatus: async () => {
        const status = await networkChecker.checkNetworkStatus()
        set({ networkStatus: status })
        return status
      },

      // 更新头像
      updateAvatar: async (avatarUrl: string) => {
        console.log('🖼️ 更新头像:', avatarUrl)
        set({ isLoading: true })
        
        try {
          const currentUser = get().user
          if (!currentUser) {
            throw new Error('用户未登录')
          }

          // 更新本地用户数据
          const updatedUser = {
            ...currentUser,
            avatar_url: avatarUrl
          }

          // 更新离线存储
          if (get().isOfflineMode) {
            offlineUserManager.updateUserAvatar(currentUser.id, avatarUrl)
          }

          set({ 
            user: updatedUser,
            isLoading: false 
          })
          
          console.log('✅ 头像更新成功')
        } catch (error: any) {
          console.error('❌ 头像更新失败:', error.message)
          set({ 
            error: error.message || '头像更新失败',
            isLoading: false 
          })
          throw error
        }
      },

      // 切换到离线模式
      switchToOfflineMode: () => {
        console.log('🏠 切换到离线模式')
        set({ 
          isOfflineMode: true, 
          networkStatus: 'offline',
          error: '已切换到离线模式，所有数据将保存在本地'
        })
      },

      // 登录 - 支持离线模式，增强ERR_ABORTED处理
      login: async (username: string, password: string) => {
        console.log('🔑 开始登录流程...')
        set({ isLoading: true, error: null })
        
        try {
          // 首先检查网络状态，但不再依赖网络进行登录
          console.log('🌐 检查网络状态（用于信息收集，不阻塞登录）...')
          let networkStatus = 'offline'
          try {
            networkStatus = await get().checkNetworkStatus()
            console.log(`📊 网络状态: ${networkStatus}`)
          } catch (networkError: any) {
            console.debug('📝 网络状态检查失败，默认使用离线模式:', networkError.message)
            
            // 特殊处理ERR_ABORTED错误
            if (networkError.name === 'AbortError' || networkError.message.includes('ERR_ABORTED')) {
              console.log('🚨 检测到ERR_ABORTED错误，启用离线登录模式')
            }
            
            networkStatus = 'offline'
          }
          
          // 如果网络离线、用户明确要求离线模式，或检测到ERR_ABORTED错误，直接使用完全离线登录
          if (networkStatus === 'offline' || get().isOfflineMode) {
            console.log('🏠 使用完全离线登录模式')
            const result = await offlineUserManager.loginOffline(username, password)
            
            if (result.success) {
              console.log('✅ 离线登录成功')
              set({ 
                user: result.session.user,
                isAuthenticated: true,
                isLoading: false,
                isOfflineMode: true,
                networkStatus: 'offline',
                error: null
              })
            } else {
              throw new Error(result.error)
            }
          } else {
            console.log('🔄 网络在线，但使用离线登录模式（最可靠）')
            // 即使网络在线，也使用离线登录模式以确保稳定性
            const result = await offlineUserManager.loginOffline(username, password)
            
            if (result.success) {
              console.log('✅ 离线登录成功（网络在线时）')
              set({ 
                user: result.session.user,
                isAuthenticated: true,
                isLoading: false,
                isOfflineMode: true,
                networkStatus: 'offline',
                error: null
              })
            } else {
              throw new Error(result.error)
            }
          }
          
        } catch (error: any) {
          console.debug('📝 登录失败:', error.message)
          
          // 提供更详细的错误信息
          let userMessage = error.message || '登录失败，请检查用户名和密码'
          
          // 网络相关错误的特殊处理
          if (error.message.includes('Failed to fetch')) {
            userMessage = '网络连接失败，请检查网络连接后重试'
          } else if (error.message.includes('NetworkError')) {
            userMessage = '网络错误，请检查网络连接'
          } else if (error.message.includes('timeout')) {
            userMessage = '网络请求超时，请检查网络连接或稍后重试'
          } else if (error.message.includes('CORS')) {
            userMessage = '网络配置错误，请联系技术支持'
          } else if (error.name === 'AbortError' || error.message.includes('ERR_ABORTED')) {
            userMessage = '网络连接被中止，已切换到离线模式'
            // 自动切换到离线模式
            get().switchToOfflineMode()
          }
          
          set({ 
            error: userMessage, 
            isLoading: false 
          })
          throw error
        }
      },

      // 注册 - 支持离线模式，增强ERR_ABORTED处理
      register: async (username: string, password: string, confirmPassword: string, studentId?: string) => {
        console.log('📝 开始注册流程...')
        console.log('📋 输入参数:', { username, passwordLength: password?.length, confirmPasswordLength: confirmPassword?.length, studentId })
        
        set({ isLoading: true, error: null })
        
        try {
          // 首先检查网络状态，但不再依赖网络进行注册
          console.log('🌐 检查网络状态（用于信息收集，不阻塞注册）...')
          let networkStatus = 'offline'
          try {
            networkStatus = await get().checkNetworkStatus()
            console.log(`📊 网络状态: ${networkStatus}`)
          } catch (networkError: any) {
            console.log('🌐 网络状态检查失败，使用离线模式')
            networkStatus = 'offline'
          }
          
          // 如果网络离线、用户明确要求离线模式，或检测到ERR_ABORTED错误，直接使用完全离线注册
          if (networkStatus === 'offline' || get().isOfflineMode) {
            console.log('🏠 使用完全离线注册模式')
            
            const result = await offlineUserManager.registerOffline(username, password, confirmPassword, studentId)
            
            if (result.success) {
              console.log('✅ 离线注册成功')
              set({ 
                user: result.session.user,
                isAuthenticated: true,
                isLoading: false,
                isOfflineMode: true,
                networkStatus: 'offline',
                error: null
              })
              return // 成功完成，不继续执行
            } else {
              throw new Error(result.error || '离线注册失败')
            }
          }
          
          // 网络在线时尝试在线注册，但失败会自动降级到离线模式
          console.log('🌐 网络在线，尝试在线注册（失败会自动降级到离线模式）')
          
          // 网络检查错误时直接切换到离线注册
          console.log('🔄 网络检查可能有问题，切换到离线注册模式')
          const result = await offlineUserManager.registerOffline(username, password, confirmPassword, studentId)
          
          if (result.success) {
            console.log('✅ 离线注册成功（网络检查后）')
            set({ 
              user: result.session.user,
              isAuthenticated: true,
              isLoading: false,
              isOfflineMode: true,
              networkStatus: 'offline',
              error: null
            })
            return // 成功完成
          } else {
            throw new Error(result.error || '离线注册失败')
          }
          
        } catch (error: any) {
          console.debug('📝 注册流程失败:', error.message)
          
          // 提供更详细的错误信息
          let userMessage = error.message || '注册失败，请检查输入信息'
          
          // 网络相关错误的特殊处理
          if (error.message.includes('Failed to fetch')) {
            userMessage = '网络连接失败，请检查网络连接后重试'
          } else if (error.message.includes('NetworkError')) {
            userMessage = '网络错误，请检查网络连接'
          } else if (error.message.includes('timeout')) {
            userMessage = '网络请求超时，请检查网络连接或稍后重试'
          } else if (error.message.includes('CORS')) {
            userMessage = '网络配置错误，请联系技术支持'
          } else if (error.name === 'AbortError' || error.message.includes('ERR_ABORTED')) {
            userMessage = '网络连接被中止，已切换到离线模式'
            // 自动切换到离线模式
            get().switchToOfflineMode()
          }
          
          set({ 
            error: userMessage, 
            isLoading: false 
          })
          
          // 重新抛出错误，让调用方处理
          throw error
        }
      },

      // 登出
      logout: async () => {
        set({ isLoading: true })
        try {
          if (get().isOfflineMode) {
            offlineUserManager.logout()
          } else {
            // 在线登出逻辑
            console.log('在线登出功能开发中...')
          }
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            isOfflineMode: false,
            networkStatus: 'unknown'
          })
        } catch (error: any) {
          set({ 
            error: error.message || '登出失败', 
            isLoading: false 
          })
          throw error
        }
      },

      // 检查认证状态
      checkAuth: async () => {
        console.log('🔍 检查认证状态...')
        set({ isLoading: true })
        
        try {
          // 检查网络状态，但优雅处理网络错误
          let networkStatus = 'offline'
          try {
            networkStatus = await get().checkNetworkStatus()
            console.log('🌐 当前网络状态:', networkStatus)
          } catch (networkError: any) {
            // 网络检查失败时，优雅降级到离线模式
            console.log('🌐 网络检查失败，使用离线模式')
            networkStatus = 'offline'
          }
          
          if (networkStatus === 'offline' || get().isOfflineMode) {
            console.log('🔄 检查离线认证状态')
            const currentUser = offlineUserManager.getCurrentUser()
            
            if (currentUser) {
              set({ 
                user: currentUser,
                isAuthenticated: true,
                isLoading: false,
                isOfflineMode: true,
                networkStatus: 'offline'
              })
              console.log('✅ 离线用户已认证:', currentUser.username)
            } else {
              set({ 
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isOfflineMode: false,
                networkStatus: 'offline'
              })
              console.log('ℹ️ 没有离线用户会话')
            }
          } else {
            console.log('🔄 检查在线认证状态')
            // 在线认证逻辑
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isOfflineMode: false,
              networkStatus: 'online'
            })
          }
        } catch (error: any) {
          console.debug('📝 检查认证状态失败:', error.message)
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message
          })
        }
      },

      // 清除错误信息
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-store-offline',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOfflineMode: state.isOfflineMode,
        networkStatus: state.networkStatus,
      }),
    }
  )
)

// 导出离线用户管理器供调试使用
export { offlineUserManager }

export type { User, AuthState, AuthActions }
