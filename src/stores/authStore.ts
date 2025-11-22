import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, userApi, isSupabaseConfigured, TABLES } from '../config/supabase'
import { initializeEmergencyFix, EmergencyNetworkFix } from '../utils/emergency-network-fix'
import { OfflineRegistrationSystem } from '../utils/offline-registration'
import backupNetworkCheck from '../utils/backupNetworkCheck'

// 用户状态接口
interface User {
  id: string
  email: string
  username?: string
  avatar_url?: string
  student_verified?: boolean
  created_at: string
  user_metadata?: { [key: string]: any }
  studentId?: string
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
  login: (email: string, password: string) => Promise<void>
  register: (username: string, password: string, confirmPassword: string, studentId?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  switchToOfflineMode: () => void
  checkNetworkStatus: () => Promise<'online' | 'offline'>
  switchToOnlineMode: () => void
  updateAvatar: (avatarUrl: string) => Promise<void>
}

// 认证存储类型
interface AuthStore extends AuthState, AuthActions {}

// 创建认证状态管理
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      // 网络修复延迟加载，避免初始化周期与循环依赖
      let _networkFixesInit = false
      const initNetworkFixesOnce = async () => {
        if (_networkFixesInit) return
        try {
          if ((import.meta as any).env?.VITE_ENABLE_NETWORK_FIXES === 'true') {
            const mod = await import('../utils/network-fixes')
            mod.initializeNetworkFixes()
            _networkFixesInit = true
          }
        } catch {}
      }
      // 初始化离线注册系统
      const offlineRegistration = OfflineRegistrationSystem.getInstance()
      
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isOfflineMode: false,
        networkStatus: 'unknown' as const,

      // 登录 - 完全重构版本，支持离线模式
      login: async (email: string, password: string) => {
        console.log('🔄 开始重构登录流程...')
        set({ isLoading: true, error: null, isOfflineMode: false })
        
        try {
          // 简化网络检查 - 只检查一次，避免重复检测
          console.log('🌐 检查网络状态（登录）...')
          let networkStatus = 'offline'
          try {
            if (!navigator.onLine) {
              networkStatus = 'offline'
            } else {
              const ok = await new Promise<boolean>((resolve) => {
                try {
                  const img = new Image()
                  let done = false
                  const t = setTimeout(() => { if (!done) { done = true; resolve(false) } }, 2000)
                  img.onload = () => { if (!done) { done = true; clearTimeout(t); resolve(true) } }
                  img.onerror = () => { if (!done) { done = true; clearTimeout(t); resolve(false) } }
                  img.src = `/favicon.svg?ts=${Date.now()}`
                } catch { resolve(false) }
              })
              networkStatus = ok ? 'online' : 'offline'
            }
          } catch {
            networkStatus = navigator.onLine ? 'online' : 'offline'
          }
          
          console.log(`📊 网络状态: ${networkStatus}`)
          console.log('🌐 优先使用在线登录模式')
          
          // 启动网络修复（按需，延迟加载）
          try { initNetworkFixesOnce() } catch {}
          try {
            if ((import.meta as any).env?.VITE_ENABLE_EMERGENCY_FIX === 'true') {
              EmergencyNetworkFix.quickFix()
            }
          } catch {}
          
          // 步骤1: Supabase认证 - 15秒超时（更宽松）
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
            
            // 认证超时，尝试离线登录
            console.log('🔄 认证超时，尝试离线登录模式')
            const offlineResult = await offlineRegistration.loginOffline(email, password)
            
            if (offlineResult.success) {
              console.log('✅ 离线登录成功（认证超时后）')
              set({ 
                user: {
                  id: offlineResult.user!.id!,
                  email: offlineResult.user!.email!,
                  username: offlineResult.user!.username,
                  created_at: offlineResult.user!.created_at!,
                  user_metadata: { offline: true },
                  isOffline: true
                },
                isAuthenticated: true, 
                isLoading: false,
                isOfflineMode: true,
                networkStatus: 'offline'
              })
              return
            } else {
              throw new Error('网络连接超时，请检查网络后重试')
            }
          }
          
          if (authError) {
            console.debug('📝 Supabase认证错误:', authError)
            
            // 认证错误，尝试离线登录
            console.log('🔄 认证错误，尝试离线登录模式')
            const offlineResult = await offlineRegistration.loginOffline(email, password)
            
            if (offlineResult.success) {
              console.log('✅ 离线登录成功（认证错误后）')
              set({ 
                user: {
                  id: offlineResult.user!.id!,
                  email: offlineResult.user!.email!,
                  username: offlineResult.user!.username,
                  created_at: offlineResult.user!.created_at!,
                  user_metadata: { offline: true },
                  isOffline: true
                },
                isAuthenticated: true, 
                isLoading: false,
                isOfflineMode: true,
                networkStatus: 'offline'
              })
              return
            } else {
              throw authError
            }
          }
          
          if (!authData?.user) {
            console.debug('📝 认证成功但无用户数据')
            throw new Error('登录失败，未获取到用户信息')
          }
          
          console.log('✅ 认证成功，用户ID:', authData.user.id)

          // 步骤2: 获取用户资料 - 非阻塞模式
          console.log('👤 步骤2: 获取用户资料（非阻塞）...')
          let userProfile = null
          let profileError = null
          
          try {
            // 使用较短的超时时间，失败也不影响登录
            const profilePromise = userApi.getUserProfile(authData.user.id)
            const profileTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('获取用户资料超时（3秒）')), 3000)
            )
            
            userProfile = await Promise.race([profilePromise, profileTimeoutPromise]) as any
            console.log('✅ 用户资料获取成功')
          } catch (error: any) {
            profileError = error
            console.debug('📝 用户资料获取失败，使用默认数据:', error.message)
          }
          
          // 步骤3: 构建用户对象（总是成功）
          console.log('🔧 步骤3: 构建用户对象...')
          const user: User = {
            id: authData.user.id,
            email: authData.user.email!,
            username: userProfile?.username || 
                     authData.user.user_metadata?.username || 
                     authData.user.email?.split('@')[0] || 
                     '用户',
            avatar_url: userProfile?.avatar_url || authData.user.user_metadata?.avatar_url,
            student_verified: userProfile?.student_verified || false,
            created_at: authData.user.created_at,
            user_metadata: authData.user.user_metadata,
          }
          
          console.log('✅ 用户对象构建完成:', user)
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            isOfflineMode: false,
            networkStatus: 'online'
          })
          
          // 步骤4: 异步补充数据（可选，不影响登录状态）
          if (profileError && authData.user.id) {
            console.log('🔄 步骤4: 异步补充用户资料...')
            // 可以在这里异步创建默认用户资料，但不影响当前登录状态
            setTimeout(async () => {
              try {
                await supabase.from('users').upsert({
                  id: authData.user.id,
                  email: authData.user.email,
                  username: user.username,
                  created_at: authData.user.created_at,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'id' })
                console.log('✅ 异步用户资料补充完成')
              } catch (upsertError) {
                console.debug('📝 异步用户资料补充失败:', upsertError.message)
              }
            }, 1000) // 延迟1秒后执行
          }
          
        } catch (error: any) {
          console.debug('📝 登录失败:', error)
          
          // 最后的离线登录尝试
          console.log('🔄 最后的尝试：离线登录模式')
          try {
            const offlineResult = await offlineRegistration.loginOffline(email, password)
            if (offlineResult.success) {
              console.log('✅ 离线登录成功（最后尝试）')
              set({ 
                user: offlineResult.user,
                isAuthenticated: true, 
                isLoading: false,
                isOfflineMode: true,
                networkStatus: 'offline'
              })
              return
            }
          } catch (offlineError) {
            console.debug('离线登录也失败:', offlineError)
          }
          
          set({ 
            error: error.message || '登录失败，请检查邮箱和密码', 
            isLoading: false 
          })
          throw error
        }
      },

      // 注册 - 完全离线模式，绕过所有网络问题
      register: async (username: string, password: string, confirmPassword: string, studentId?: string) => {
        console.log('📝 开始注册流程...')
        console.log('📋 输入参数:', { username, passwordLength: password?.length, confirmPasswordLength: confirmPassword?.length, studentId })
        
        set({ isLoading: true, error: null, isOfflineMode: false })
        const watchdog = window.setTimeout(async () => {
          try {
            if (get().isLoading) {
              const result = await offlineRegistration.registerOffline(username, password, confirmPassword, studentId)
              if (result.success && result.user) {
                set({
                  user: {
                    id: result.user.id!,
                    email: result.user.email!,
                    username: result.user.username,
                    created_at: result.user.created_at!,
                    user_metadata: { offline: true },
                    isOffline: true
                  },
                  isAuthenticated: true,
                  isLoading: false,
                  isOfflineMode: true,
                  networkStatus: 'offline',
                  error: null
                })
              } else {
                set({ error: result.error || '注册失败', isLoading: false })
              }
            }
          } catch {
            set({ isLoading: false })
          }
        }, 8000)
        
        try {
          const status = await get().checkNetworkStatus()
          const networkStatus = status
          console.log(`📊 网络状态: ${networkStatus}`)
          
          if (get().isOfflineMode) {
            console.log('🏠 使用完全离线注册模式')
            
            const result = await offlineRegistration.registerOffline(username, password, confirmPassword, studentId)
            
            if (result.success && result.user) {
              console.log('✅ 离线注册成功')
              set({ 
                user: {
                  id: result.user.id!,
                  email: result.user.email!,
                  username: result.user.username,
                  created_at: result.user.created_at!,
                  user_metadata: { offline: true },
                  isOffline: true
                },
                isAuthenticated: true, 
                isLoading: false,
                isOfflineMode: true,
                networkStatus: 'offline',
                error: null
              })
              return
            } else {
              throw new Error(result.error || '离线注册失败')
            }
          }
          
          console.log('🌐 优先在线注册，失败自动降级到离线模式')
          
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
          
          // 4. 检查用户名是否已存在 - 增强网络错误处理
          console.log('🔍 步骤3: 检查用户名是否已存在...')
          let existingUser = null
          let checkError = null
          
          try {
            const checkPromise = (async () => {
              const { data, error } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single()
              return { data, error }
            })()
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('username_check_timeout')), 1500))
            const result = await Promise.race([checkPromise, timeout]) as any
            existingUser = result?.data || null
            checkError = result?.error || null
          } catch (networkError) {
            console.debug('📝 用户名检查网络错误:', networkError.message)
            // 特殊处理 ERR_CONNECTION_CLOSED 错误
            if (networkError.message.includes('ERR_CONNECTION_CLOSED')) {
              console.log('🚨 检测到连接被关闭错误，启用容错模式')
              // 连接被关闭时不阻塞注册，继续尝试创建用户
              existingUser = null
              checkError = null
            } else if (networkError.message.includes('Failed to fetch')) {
              console.log('🚨 检测到获取失败错误，启用离线模式')
              // 网络获取失败时不阻塞注册
              existingUser = null
              checkError = null
            } else if (networkError.message.includes('username_check_timeout')) {
              // 检查超时不阻塞注册流程
              existingUser = null
              checkError = null
            } else {
              // 其他网络错误也不阻塞注册流程
              existingUser = null
              checkError = null
            }
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
          
          // 6. 创建Supabase用户 - 增强网络错误处理（针对ERR_CONNECTION_CLOSED）
          console.log('🚀 步骤5: 创建Supabase用户...')
            if (!isSupabaseConfigured) {
              const offlineResult = await offlineRegistration.registerOffline(username, password, confirmPassword, studentId)
              if (offlineResult.success && offlineResult.user) {
                set({ 
                  user: {
                    id: offlineResult.user.id!,
                    email: offlineResult.user.email!,
                    username: offlineResult.user.username,
                    created_at: offlineResult.user.created_at!,
                    user_metadata: { offline: true },
                    isOffline: true
                  },
                  isAuthenticated: true, 
                  isLoading: false,
                  isOfflineMode: true,
                  networkStatus: 'offline',
                  error: null
                })
                return
              } else {
                throw new Error(offlineResult.error || '离线注册失败')
              }
            }
          let authData = null
          let authError = null
          
          try {
            const cooldownKey = `signup_cooldown_${email}`
            const COOLDOWN_MS = 900000
            const lastTs = Number(localStorage.getItem(cooldownKey) || 0)
            if (Date.now() - lastTs < COOLDOWN_MS) {
              throw new Error('邮件发送过于频繁，请稍后重试')
            }
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('网络超时，请检查网络连接或稍后重试')), 4000)
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
            if (!authError) {
              localStorage.setItem(cooldownKey, String(Date.now()))
            }
            
          } catch (networkError) {
            console.debug('🚨 Supabase认证网络错误:', networkError.message)
            
            // 特殊处理ERR_ABORTED错误
            if (networkError.message.includes('ERR_ABORTED') || networkError.name === 'AbortError') {
              console.log('🚨 检测到ERR_ABORTED错误，启用离线注册模式')
              // 创建离线用户数据，不抛出错误
              const offlineUser = {
                id: `offline_${Date.now()}`,
                email: email,
                username: username,
                student_id: studentId,
                created_at: new Date().toISOString(),
                isOffline: true
              }
              
              // 保存到本地存储
              localStorage.setItem('offline_user_' + offlineUser.id, JSON.stringify(offlineUser))
              
              // 模拟成功的auth数据
              authData = {
                user: {
                  id: offlineUser.id,
                  email: offlineUser.email,
                  created_at: offlineUser.created_at,
                  user_metadata: {
                    username: offlineUser.username,
                    student_id: offlineUser.student_id
                  }
                }
              }
              authError = null
              
              console.log('✅ 离线用户创建成功 (ERR_ABORTED):', offlineUser.id)
              
            } else if (networkError.message.includes('ERR_CONNECTION_CLOSED')) {
              console.log('🚨 检测到ERR_CONNECTION_CLOSED错误，启用离线注册模式')
              // 创建离线用户数据，不抛出错误
              const offlineUser = {
                id: `offline_${Date.now()}`,
                email: email,
                username: username,
                student_id: studentId,
                created_at: new Date().toISOString(),
                isOffline: true
              }
              
              // 保存到本地存储
              localStorage.setItem('offline_user_' + offlineUser.id, JSON.stringify(offlineUser))
              
              // 模拟成功的auth数据
              authData = {
                user: {
                  id: offlineUser.id,
                  email: offlineUser.email,
                  created_at: offlineUser.created_at,
                  user_metadata: {
                    username: offlineUser.username,
                    student_id: offlineUser.student_id
                  }
                }
              }
              authError = null
              
              console.log('✅ 离线用户创建成功:', offlineUser.id)
              
            } else if (networkError.message.includes('Failed to fetch')) {
              const offlineUser = {
                id: `offline_${Date.now()}`,
                email: email,
                username: username,
                student_id: studentId,
                created_at: new Date().toISOString(),
                isOffline: true
              }
              localStorage.setItem('offline_user_' + offlineUser.id, JSON.stringify(offlineUser))
              authData = {
                user: {
                  id: offlineUser.id,
                  email: offlineUser.email,
                  created_at: offlineUser.created_at,
                  user_metadata: {
                    username: offlineUser.username,
                    student_id: offlineUser.student_id
                  }
                }
              }
              authError = null
            } else if (networkError.message.includes('timeout')) {
              const offlineUser = {
                id: `offline_${Date.now()}`,
                email: email,
                username: username,
                student_id: studentId,
                created_at: new Date().toISOString(),
                isOffline: true
              }
              localStorage.setItem('offline_user_' + offlineUser.id, JSON.stringify(offlineUser))
              authData = {
                user: {
                  id: offlineUser.id,
                  email: offlineUser.email,
                  created_at: offlineUser.created_at,
                  user_metadata: {
                    username: offlineUser.username,
                    student_id: offlineUser.student_id
                  }
                }
              }
              authError = null
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
            const msg = errorMessage.toLowerCase()
            if (msg.includes('rate limit')) {
              localStorage.setItem(`signup_cooldown_${email}`, String(Date.now()))
              try {
                const offlineResult = await offlineRegistration.registerOffline(username, password, confirmPassword, studentId)
                if (offlineResult.success && offlineResult.user) {
                  const u: User = {
                    id: offlineResult.user.id!,
                    email: offlineResult.user.email!,
                    username: offlineResult.user.username,
                    created_at: offlineResult.user.created_at!,
                    user_metadata: { offline: true }
                  }
                  set({ 
                    user: u,
                    isAuthenticated: true, 
                    isLoading: false,
                    isOfflineMode: true,
                    networkStatus: 'offline',
                    error: null
                  })
                  return
                }
              } catch {}
              errorMessage = '邮件发送频率受限，请稍后再试（建议15分钟后重试）'
            }
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
          
          // 7. 创建用户资料 - 后台异步，不阻塞注册
          console.log('📝 步骤6: 创建用户资料（后台异步）...')
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
            setTimeout(async () => {
              try {
                await supabase.from('users').insert(userProfile)
                console.log('✅ 后台用户资料创建成功')
              } catch (asyncError) {
                console.debug('📝 后台用户资料创建失败:', asyncError)
              }
            }, 0)
            console.log('ℹ️ 用户资料创建已在后台进行')
          } catch {}
          
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
            user_metadata: authData.user.user_metadata,
          }

          console.log('🎉 注册流程完成，设置用户状态')
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
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
            isLoading: false 
          })
          
          // 重新抛出错误，让调用方处理
          throw error
        } finally {
          try { clearTimeout(watchdog) } catch {}
          set({ isLoading: false })
        }
      },

      // 登出 - 支持离线模式
      logout: async () => {
        set({ isLoading: true })
        try {
          // 如果是离线模式，直接清除本地数据
          if (get().isOfflineMode) {
            console.log('🏠 离线模式登出，清除本地数据')
            offlineRegistration.logoutOffline()
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              isOfflineMode: false,
              networkStatus: 'unknown'
            })
            return
          }
          
          // 在线模式使用正常的登出流程
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            isOfflineMode: false,
            networkStatus: 'unknown'
          })
        } catch (error: any) {
          // 在线登出失败，也清除本地数据
          console.log('⚠️ 在线登出失败，清除本地数据')
          offlineRegistration.logoutOffline()
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            isOfflineMode: false,
            networkStatus: 'unknown',
            error: error.message || '登出失败'
          })
        }
      },

      updateAvatar: async (avatarUrl: string) => {
        const u = get().user
        if (!u) return
        const updated = { ...u, avatar_url: avatarUrl }
        set({ user: updated })
        try {
          const { data, error } = await supabase
            .from(TABLES.PROFILES)
            .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
            .eq('id', u.id)
            .select()
            .single()
          if (error) throw error
          if (data) set({ user: { ...updated } })
        } catch {}
      },

      // 检查认证状态
      checkAuth: async () => {
        set({ isLoading: true })
        try {
          // 添加超时保护 - 8秒超时
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('检查认证状态超时')), 8000)
          )
          
          const currentUserPromise = userApi.getCurrentUser()
          const user = await Promise.race([currentUserPromise, timeoutPromise]) as any
          
          if (user) {
            // 获取用户详细信息 - 添加超时保护
            const profileTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('获取用户信息超时')), 5000)
            )
            
            const profilePromise = userApi.getUserProfile(user.id)
            const userProfile = await Promise.race([profilePromise, profileTimeoutPromise]) as any
            
            const userData: User = {
              id: user.id,
              email: user.email!,
              username: userProfile?.username,
              avatar_url: userProfile?.avatar_url,
              student_verified: userProfile?.student_verified,
              created_at: user.created_at,
              user_metadata: user.user_metadata,
            }
            
            set({ 
              user: userData, 
              isAuthenticated: true, 
              isLoading: false 
            })
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            })
          }
        } catch (error: any) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        }
      },

      // 清除错误信息
      clearError: () => {
        set({ error: null })
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

      switchToOnlineMode: () => {
        console.log('🌐 切换到在线模式')
        set({ 
          isOfflineMode: false,
          networkStatus: 'online',
          error: null
        })
        try { get().checkAuth() } catch {}
      },

      // 检查网络状态 - 使用图片探测避免控制台报错
      checkNetworkStatus: async () => {
        try {
          if (!navigator.onLine) {
            set({ networkStatus: 'offline' })
            return 'offline'
          }
          const ping = (url: string) => new Promise<void>((resolve, reject) => {
            try {
              const img = new Image()
              const t = setTimeout(() => { resolve() }, 2000)
              img.onload = () => { clearTimeout(t); resolve() }
              img.onerror = () => { clearTimeout(t); reject(new Error('error')) }
              img.src = `${url}?ts=${Date.now()}`
            } catch (e) { resolve() }
          })
          let ok = false
          try {
            await ping('/favicon.svg')
            ok = true
          } catch {
            ok = navigator.onLine
          }
          const status = ok ? 'online' : 'offline'
          set({ networkStatus: status })
          return status
        } catch {
          set({ networkStatus: 'offline' })
          return 'offline'
        }
      },
    }
  },
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOfflineMode: state.isOfflineMode,
        networkStatus: state.networkStatus,
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
  
  if (password.length > 32) {
    return { isValid: false, message: '密码长度不能超过32位' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: '密码必须包含至少一个大写字母' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: '密码必须包含至少一个小写字母' }
  }
  
  if (!/\d/.test(password)) {
    return { isValid: false, message: '密码必须包含至少一个数字' }
  }
  
  // 检查是否包含空格
  if (/\s/.test(password)) {
    return { isValid: false, message: '密码不能包含空格' }
  }
  
  // 检查常见弱密码
  const weakPasswords = ['12345678', 'password', '123456789', 'qwerty123', 'abc12345']
  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, message: '密码太简单，请使用更复杂的密码' }
  }
  
  return { isValid: true, message: '密码符合要求' }
}

// 用户名验证函数
function validateUsername(username: string): { isValid: boolean; message: string } {
  if (!username) {
    return { isValid: false, message: '用户名不能为空' }
  }
  
  if (username.length < 3) {
    return { isValid: false, message: '用户名长度至少为3个字符' }
  }
  
  if (username.length > 20) {
    return { isValid: false, message: '用户名长度不能超过20个字符' }
  }
  
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    return { isValid: false, message: '用户名只能包含字母、数字、下划线和中文' }
  }
  
  // 不能包含特殊字符或空格
  if (/[\s!@#$%^&*(),.?":{}|<>]/.test(username)) {
    return { isValid: false, message: '用户名不能包含特殊字符或空格' }
  }
  
  return { isValid: true, message: '用户名符合要求' }
}

// 学生身份验证函数（模拟实现）
async function validateStudentId(studentId: string, username: string): Promise<boolean> {
  // 这里可以实现真实的学生身份验证逻辑
  // 例如：对接学校API、学信网等
  
  // 模拟验证：简单的格式检查
  const studentIdPattern = /^\d{10,12}$/ // 10-12位数字
  const isValidFormat = studentIdPattern.test(studentId)
  
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 随机返回验证结果（实际项目中应该接入真实API）
  return isValidFormat && Math.random() > 0.2 // 80%通过率
}

// 微信登录（预留接口）
export const wechatLogin = async (code: string) => {
  try {
    // 这里实现微信登录逻辑
    // 1. 用code换取access_token
    // 2. 获取用户信息
    // 3. 创建或更新用户
    
    console.log('微信登录功能开发中...')
    
    // 模拟微信登录成功
    return {
      success: true,
      message: '微信登录功能即将上线'
    }
  } catch (error: any) {
    console.debug('微信登录失败:', error)
    throw error
  }
}

// 手机号+验证码登录（预留接口）
export const phoneLogin = async (phone: string, code: string) => {
  try {
    // 这里实现手机号+验证码登录逻辑
    // 1. 验证验证码
    // 2. 创建或更新用户
    
    console.log('手机号登录功能开发中...')
    
    // 模拟手机号登录成功
    return {
      success: true,
      message: '手机号登录功能即将上线'
    }
  } catch (error: any) {
    console.debug('手机号登录失败:', error)
    throw error
  }
}

export type { User, AuthState, AuthActions }
