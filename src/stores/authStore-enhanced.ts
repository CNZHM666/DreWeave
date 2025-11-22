import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, userApi } from '../config/supabase'
import { initializeNetworkFixes, safeFetch, NetworkMonitor } from '../utils/network-fixes'

// 用户状态接口
interface User {
  id: string
  email: string
  username?: string
  avatar_url?: string
  student_verified?: boolean
  created_at: string
}

// 认证状态接口
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  networkStatus: 'online' | 'offline' | 'unstable'
  offlineMode: boolean
}

// 认证操作接口
interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (username: string, password: string, confirmPassword: string, studentId?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  enableOfflineMode: () => void
  disableOfflineMode: () => void
  syncOfflineData: () => Promise<void>
}

// 认证存储类型
interface AuthStore extends AuthState, AuthActions {}

// 离线数据管理
class OfflineDataManager {
  private storageKey = 'dreweave-offline-data'
  
  saveOfflineUser(user: User) {
    const data = this.getOfflineData()
    data.user = user
    data.lastSync = new Date().toISOString()
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }
  
  getOfflineUser(): User | null {
    const data = this.getOfflineData()
    return data.user || null
  }
  
  saveOfflineRegistration(username: string, password: string, studentId?: string) {
    const data = this.getOfflineData()
    data.pendingRegistrations = data.pendingRegistrations || []
    data.pendingRegistrations.push({
      username,
      password,
      studentId,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }
  
  getPendingRegistrations() {
    const data = this.getOfflineData()
    return data.pendingRegistrations || []
  }
  
  clearPendingRegistrations() {
    const data = this.getOfflineData()
    data.pendingRegistrations = []
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }
  
  private getOfflineData() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }
}

const offlineManager = new OfflineDataManager()

// 创建认证状态管理
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      // 初始化网络修复
      const networkFixes = initializeNetworkFixes()
      
      // 网络状态监控
      let networkCheckInterval: NodeJS.Timeout | null = null
      
      // 启动网络状态监控
      const startNetworkMonitoring = () => {
        if (networkCheckInterval) {
          clearInterval(networkCheckInterval)
        }
        
        networkCheckInterval = setInterval(async () => {
          const isOnline = await NetworkMonitor.testConnection(3000)
          const currentStatus = get().networkStatus
          
          if (isOnline && currentStatus === 'offline') {
            set({ networkStatus: 'online' })
            addLog('🌐 网络已恢复，尝试同步离线数据...', 'success')
            get().syncOfflineData()
          } else if (!isOnline && currentStatus === 'online') {
            set({ networkStatus: 'offline' })
            addLog('⚠️ 网络已断开，切换到离线模式', 'warning')
          }
        }, 10000) // 每10秒检查一次
      }
      
      // 初始化时启动监控
      startNetworkMonitoring()
      
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        networkStatus: 'online',
        offlineMode: false,

        // 登录 - 增强版本
        login: async (email: string, password: string) => {
          console.log('🔄 开始增强登录流程...')
          set({ isLoading: true, error: null })
          
          try {
            // 0. 网络预检查
            console.log('🌐 步骤0: 网络连接预检查...')
            const isOnline = await NetworkMonitor.testConnection(3000)
            
            if (!isOnline) {
              console.log('⚠️ 网络离线，尝试离线登录...')
              const offlineUser = offlineManager.getOfflineUser()
              if (offlineUser) {
                console.log('✅ 离线用户验证成功')
                set({ 
                  user: offlineUser, 
                  isAuthenticated: true, 
                  isLoading: false,
                  networkStatus: 'offline',
                  offlineMode: true
                })
                return
              } else {
                throw new Error('网络离线且无可用的离线用户数据')
              }
            }
            
            // 1. Supabase认证 - 15秒超时
            console.log('📡 步骤1: Supabase认证...')
            let authData: any = null
            let authError: any = null
            
            try {
              const authPromise = supabase.auth.signInWithPassword({ email, password })
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('认证超时（15秒）')), 15000)
              )
              
              const result = await Promise.race([authPromise, timeoutPromise]) as any
              authData = result.data
              authError = result.error
            } catch (timeoutError) {
              console.debug('📝 认证阶段超时:', timeoutError.message)
              throw new Error('网络连接超时，请检查网络后重试')
            }
            
            if (authError) {
              console.debug('📝 Supabase认证错误:', authError)
              throw authError
            }
            
            if (!authData?.user) {
              console.debug('📝 认证成功但无用户数据')
              throw new Error('登录失败，未获取到用户信息')
            }
            
            console.log('✅ 认证成功，用户ID:', authData.user.id)

            // 2. 获取用户资料 - 非阻塞模式
            console.log('👤 步骤2: 获取用户资料（非阻塞）...')
            let userProfile = null
            let profileError = null
            
            try {
              const profilePromise = userApi.getUserProfile(authData.user.id)
              const profileTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('获取用户资料超时（3秒）')), 3000)
              )
              
              userProfile = await Promise.race([profilePromise, profileTimeoutPromise]) as any
              console.log('✅ 用户资料获取成功')
            } catch (error: any) {
              console.debug('📝 获取用户资料失败:', error.message)
              profileError = error
            }
            
            // 3. 构建用户对象
            const user: User = {
              id: authData.user.id,
              email: authData.user.email || email,
              username: userProfile?.username || authData.user.user_metadata?.username,
              avatar_url: userProfile?.avatar_url,
              student_verified: userProfile?.student_verified || false,
              created_at: authData.user.created_at,
            }
            
            // 4. 保存到离线存储
            offlineManager.saveOfflineUser(user)
            
            console.log('🎉 登录流程完成')
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              networkStatus: 'online',
              offlineMode: false
            })
            
          } catch (error: any) {
            console.debug('📝 登录流程失败:', error.message)
            
            // 网络相关错误的特殊处理
            let userMessage = error.message || '登录失败，请检查输入信息'
            
            if (error.message.includes('Failed to fetch')) {
              userMessage = '网络连接失败，请检查网络连接后重试'
            } else if (error.message.includes('NetworkError')) {
              userMessage = '网络错误，请检查网络连接'
            } else if (error.message.includes('timeout')) {
              userMessage = '网络请求超时，请检查网络连接或稍后重试'
            } else if (error.message.includes('offline')) {
              userMessage = '当前处于离线模式，部分功能可能受限'
            }
            
            set({ 
              error: userMessage, 
              isLoading: false,
              networkStatus: error.message.includes('offline') ? 'offline' : 'unstable'
            })
            
            throw error
          }
        },

        // 注册 - 增强版本
        register: async (username: string, password: string, confirmPassword: string, studentId?: string) => {
          console.log('📝 开始增强注册流程...')
          console.log('📋 输入参数:', { username, passwordLength: password?.length, confirmPasswordLength: confirmPassword?.length, studentId })
          
          set({ isLoading: true, error: null })
          
          try {
            // 0. 网络连接预检查
            console.log('🌐 步骤0: 网络连接预检查...')
            const isOnline = await NetworkMonitor.testConnection(3000)
            
            if (!isOnline) {
              console.log('⚠️ 网络离线，启用离线注册模式...')
              
              // 离线模式下的注册处理
              const offlineUser: User = {
                id: `offline-${Date.now()}`,
                email: `${username}@offline.local`,
                username: username,
                student_verified: false,
                created_at: new Date().toISOString(),
              }
              
              // 保存离线注册数据
              offlineManager.saveOfflineUser(offlineUser)
              offlineManager.saveOfflineRegistration(username, password, studentId)
              
              set({ 
                user: offlineUser, 
                isAuthenticated: true, 
                isLoading: false,
                networkStatus: 'offline',
                offlineMode: true
              })
              
              addLog('✅ 离线注册成功，数据已保存到本地', 'success')
              return
            }
            
            // 1. 密码验证
            console.log('🔑 步骤1: 密码验证...')
            if (password !== confirmPassword) {
              console.log('❌ 密码验证失败: 两次输入的密码不一致')
              throw new Error('两次输入的密码不一致')
            }
            
            // 2. 密码复杂度验证
            const passwordValidation = validatePassword(password)
            if (!passwordValidation.isValid) {
              console.log('❌ 密码复杂度验证失败:', passwordValidation.message)
              throw new Error(passwordValidation.message)
            }
            
            // 3. 用户名验证
            console.log('👤 步骤2: 用户名验证...')
            const usernameValidation = validateUsername(username)
            if (!usernameValidation.isValid) {
              console.log('❌ 用户名验证失败:', usernameValidation.message)
              throw new Error(usernameValidation.message)
            }
            
            // 4. 检查用户名是否已存在
            console.log('🔍 步骤3: 检查用户名是否已存在...')
            let existingUser = null
            let checkError = null
            
            try {
              const { data, error } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single()
              
              existingUser = data
              checkError = error
            } catch (networkError) {
              console.debug('📝 用户名检查网络错误:', networkError.message)
              // 网络错误不阻塞注册流程，继续尝试
            }
            
            if (checkError && checkError.code !== 'PGRST116') {
              console.log('❌ 检查用户名时出错:', checkError)
              throw new Error('检查用户名时出错，请重试')
            }
            
            if (existingUser) {
              console.log('❌ 用户名已存在:', existingUser)
              throw new Error('用户名已存在，请选择其他用户名')
            }
            
            console.log('✅ 用户名可用')
            
            const normalizeUsernameForEmail = (s: string) => {
              const filtered = s
                .toLowerCase()
                .replace(/[\u4e00-\u9fa5]/g, '')
                .replace(/[^a-z0-9._-]/g, '_')
                .replace(/^_+|_+$/g, '')
                .slice(0, 30)
              return filtered || `user_${Date.now()}`
            }
            const emailLocal = normalizeUsernameForEmail(username)
            const email = `${emailLocal}@dreweave.com`
            console.log('📧 步骤4: 创建邮箱地址:', email)
            
            // 6. 创建Supabase用户 - 增强网络错误处理
            console.log('🚀 步骤5: 创建Supabase用户...')
            let authData = null
            let authError = null
            
            try {
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('网络超时，请检查网络连接或稍后重试')), 15000)
              )
              
              const authPromise = supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    username,
                    student_id: studentId,
                    email_confirmed: true // 标记邮箱已确认，跳过验证
                  }
                }
              })
              
              const result = await Promise.race([authPromise, timeoutPromise]) as any
              authData = result.data
              authError = result.error
              
            } catch (networkError) {
              console.debug('🚨 Supabase认证网络错误:', networkError.message)
              if (networkError.message.includes('Failed to fetch')) {
                throw new Error('网络连接失败，无法连接到认证服务。请检查网络连接或稍后重试。')
              } else if (networkError.message.includes('timeout')) {
                throw new Error('网络请求超时，请检查网络连接或稍后重试。')
              } else {
                throw new Error(`网络错误: ${networkError.message}`)
              }
            }
            
            console.log('📊 Supabase注册结果:', { 
              hasData: !!authData, 
              hasError: !!authError, 
              errorMessage: authError?.message 
            })

            if (authError) {
              console.log('❌ Supabase注册失败:', authError)
              // 提供更友好的错误信息
              let errorMessage = authError.message || '注册失败'
              if (errorMessage.includes('network')) {
                errorMessage = '网络连接失败，请检查网络后重试'
              } else if (errorMessage.includes('timeout')) {
                errorMessage = '请求超时，请检查网络连接'
              } else if (errorMessage.includes('User already registered')) {
                errorMessage = '用户已存在，请直接登录或选择其他用户名'
              }
              throw new Error(errorMessage)
            }

            if (!authData?.user) {
              console.log('❌ 没有获取到用户数据')
              throw new Error('注册成功但未获取到用户信息')
            }
            
            console.log('✅ Supabase用户创建成功:', authData.user.id)
            
            // 7. 创建用户资料 - 添加容错处理
            console.log('📝 步骤6: 创建用户资料...')
            const userProfile = {
              id: authData.user.id,
              email: email,
              username: username,
              student_id: studentId,
              student_verified: false,
              email_confirmed_at: new Date().toISOString(),
              created_at: authData.user.created_at,
              updated_at: authData.user.created_at,
            }

            try {
              const insertTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('创建用户资料超时')), 8000)
              )
              
              const insertPromise = supabase
                .from('users')
                .insert(userProfile)
              
              const { error: profileError } = await Promise.race([insertPromise, insertTimeoutPromise]) as any

              if (profileError) {
                console.debug('📝 用户资料创建失败:', profileError)
                // 用户资料创建失败不阻塞注册流程，可以后续补充
                console.log('🔄 将在后台异步创建用户资料')
                
                // 后台异步创建用户资料
                setTimeout(async () => {
                  try {
                    await supabase.from('users').insert(userProfile)
                    console.log('✅ 后台用户资料创建成功')
                  } catch (asyncError) {
                    console.debug('📝 后台用户资料创建失败:', asyncError)
                  }
                }, 2000)
              } else {
                console.log('✅ 用户资料创建成功')
              }
            } catch (profileNetworkError) {
              console.debug('📝 用户资料创建网络错误:', profileNetworkError.message)
              // 网络错误不阻塞注册流程
            }
            
            // 8. 异步验证学生身份（可选）
            if (studentId) {
              console.log('🎓 步骤7: 异步验证学生身份...')
              validateStudentId(studentId, username).then(async (isValidStudent) => {
                if (isValidStudent) {
                  try {
                    await supabase
                      .from('users')
                      .update({ student_verified: true })
                      .eq('id', authData.user.id)
                    console.log('✅ 学生身份验证更新成功')
                  } catch (verifyError) {
                    console.debug('学生身份验证更新失败:', verifyError)
                  }
                }
              }).catch(error => {
                console.debug('学生身份验证失败:', error)
              })
            }

            const user: User = {
              id: authData.user.id,
              email: email,
              username: username,
              student_verified: false,
              created_at: authData.user.created_at,
            }

            console.log('🎉 注册流程完成，设置用户状态')
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              networkStatus: 'online',
              offlineMode: false
            })
            
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
            }
            
            set({ 
              error: userMessage, 
              isLoading: false,
              networkStatus: 'unstable'
            })
            
            // 重新抛出错误，让调用方处理
            throw error
          }
        },

        // 登出
        logout: async () => {
          console.log('🚪 开始登出流程...')
          set({ isLoading: true, error: null })
          
          try {
            // 清除离线数据
            localStorage.removeItem('offline-mode-data')
            
            if (get().offlineMode) {
              // 离线模式下的登出
              set({ 
                user: null, 
                isAuthenticated: false, 
                isLoading: false,
                offlineMode: false
              })
              return
            }
            
            const { error } = await supabase.auth.signOut()
            if (error) {
              console.debug('📝 Supabase登出错误:', error)
              throw error
            }
            
            console.log('✅ 登出成功')
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              offlineMode: false
            })
            
          } catch (error: any) {
            console.debug('📝 登出失败:', error.message)
            set({ 
              error: '登出失败，请重试', 
              isLoading: false 
            })
            throw error
          }
        },

        // 检查认证状态
        checkAuth: async () => {
          console.log('🔍 检查认证状态...')
          
          try {
            const { data: { session }, error } = await supabase.auth.getSession()
            
            if (error) {
              console.debug('📝 获取会话错误:', error)
              set({ isAuthenticated: false, user: null })
              return
            }
            
            if (session?.user) {
              console.log('✅ 用户已登录:', session.user.id)
              
              // 获取用户资料
              let userProfile = null
              try {
                userProfile = await userApi.getUserProfile(session.user.id)
              } catch (profileError) {
                console.debug('📝 获取用户资料失败:', profileError.message)
              }
              
              const user: User = {
                id: session.user.id,
                email: session.user.email || '',
                username: userProfile?.username || session.user.user_metadata?.username,
                avatar_url: userProfile?.avatar_url,
                student_verified: userProfile?.student_verified || false,
                created_at: session.user.created_at,
              }
              
              set({ isAuthenticated: true, user })
            } else {
              console.log('ℹ️ 用户未登录')
              set({ isAuthenticated: false, user: null })
            }
            
          } catch (error: any) {
            console.debug('📝 检查认证状态失败:', error.message)
            set({ isAuthenticated: false, user: null })
          }
        },

        // 清除错误信息
        clearError: () => {
          set({ error: null })
        },

        // 启用离线模式
        enableOfflineMode: () => {
          console.log('📴 启用离线模式...')
          const offlineUser = offlineManager.getOfflineUser()
          
          if (offlineUser) {
            set({
              user: offlineUser,
              isAuthenticated: true,
              networkStatus: 'offline',
              offlineMode: true
            })
            addLog('✅ 离线模式已启用', 'success')
          } else {
            set({
              networkStatus: 'offline',
              offlineMode: true
            })
            addLog('⚠️ 离线模式已启用，但无本地用户数据', 'warning')
          }
        },

        // 禁用离线模式
        disableOfflineMode: () => {
          console.log('🌐 禁用离线模式...')
          set({
            networkStatus: 'online',
            offlineMode: false
          })
          addLog('✅ 离线模式已禁用', 'success')
        },

        // 同步离线数据
        syncOfflineData: async () => {
          console.log('🔄 开始同步离线数据...')
          
          try {
            const pendingRegistrations = offlineManager.getPendingRegistrations()
            
            if (pendingRegistrations.length === 0) {
              console.log('ℹ️ 无待同步的离线数据')
              return
            }
            
            console.log(`📊 发现 ${pendingRegistrations.length} 个待同步的注册数据`)
            
            for (const registration of pendingRegistrations) {
              try {
                // 重新尝试在线注册
                await get().register(
                  registration.username,
                  registration.password,
                  registration.password,
                  registration.studentId
                )
                console.log(`✅ 离线注册数据同步成功: ${registration.username}`)
              } catch (error: any) {
                console.debug(`📝 离线注册数据同步失败: ${registration.username}`, error.message)
              }
            }
            
            // 清空已同步的数据
            offlineManager.clearPendingRegistrations()
            console.log('✅ 离线数据同步完成')
            
          } catch (error: any) {
            console.debug('📝 离线数据同步失败:', error.message)
          }
        }
      }
    },
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        networkStatus: state.networkStatus,
        offlineMode: state.offlineMode
      }),
    }
  )
)

// 密码验证函数
function validatePassword(password: string): { isValid: boolean; message: string } {
  // 密码要求：
  // 1. 长度至少8位
  // 2. 包含至少一个大写字母
  // 3. 包含至少一个小写字母
  // 4. 包含至少一个数字
  // 5. 可以包含特殊字符，但不强制要求
  
  if (!password) {
    return { isValid: false, message: '密码不能为空' }
  }
  
  if (password.length < 8) {
    return { isValid: false, message: '密码长度至少为8位' }
  }
  
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  if (!hasUpperCase) {
    return { isValid: false, message: '密码必须包含至少一个大写字母' }
  }
  
  if (!hasLowerCase) {
    return { isValid: false, message: '密码必须包含至少一个小写字母' }
  }
  
  if (!hasNumber) {
    return { isValid: false, message: '密码必须包含至少一个数字' }
  }
  
  return { isValid: true, message: '密码符合要求' }
}

// 用户名验证函数
function validateUsername(username: string): { isValid: boolean; message: string } {
  if (!username) {
    return { isValid: false, message: '用户名不能为空' }
  }
  
  if (username.length < 3) {
    return { isValid: false, message: '用户名长度至少为3位' }
  }
  
  if (username.length > 20) {
    return { isValid: false, message: '用户名长度不能超过20位' }
  }
  
  const validPattern = /^[a-zA-Z0-9_-]+$/
  if (!validPattern.test(username)) {
    return { isValid: false, message: '用户名只能包含字母、数字、下划线和连字符' }
  }
  
  return { isValid: true, message: '用户名符合要求' }
}

// 学生身份验证函数（模拟）
async function validateStudentId(studentId: string, username: string): Promise<boolean> {
  // 这里可以实现真实的学生身份验证逻辑
  // 例如：调用学校API、验证学号格式等
  
  console.log(`🎓 验证学生身份: ${studentId} (${username})`)
  
  // 简单的格式验证
  const validPatterns = [
    /^S\d{9}$/,      // S123456789
    /^\d{10}$/,      // 1234567890
    /^[A-Z]\d{8}$/,  // A12345678
  ]
  
  const isValidFormat = validPatterns.some(pattern => pattern.test(studentId))
  
  if (isValidFormat) {
    console.log('✅ 学生身份格式验证通过')
    return true
  } else {
    console.log('⚠️ 学生身份格式验证失败')
    return false
  }
}

// 辅助日志函数
function addLog(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const colors = {
    info: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  }
  const color = colors[type] || colors.info
  console.log(`%c[${new Date().toLocaleTimeString('zh-CN')}] ${message}`, `color: ${color}`)
}
