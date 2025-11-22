import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, userApi } from '../config/supabase'

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
}

// 认证操作接口
interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string, studentId?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

// 认证存储类型
interface AuthStore extends AuthState, AuthActions {}

// 创建认证状态管理
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 登录 - 优化版本
      login: async (email: string, password: string) => {
        console.log('🔄 开始优化登录流程...')
        set({ isLoading: true, error: null })
        try {
          // 步骤1: Supabase认证 - 10秒超时
          console.log('📡 步骤1: Supabase认证...')
          const authTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => {
              console.debug('📝 认证超时：10秒超时')
              reject(new Error('网络超时，请检查网络连接或稍后重试'))
            }, 10000)
          )
          
          const authPromise = supabase.auth.signInWithPassword({
            email,
            password,
          })
          
          const { data, error } = await Promise.race([authPromise, authTimeoutPromise]) as any
          console.log('✅ 认证响应:', data ? '成功' : '失败', error ? error.message : '无错误')

          if (error) {
            console.debug('📝 认证错误:', error)
            throw error
          }

          if (!data.user) {
            console.debug('📝 无用户数据')
            throw new Error('登录失败，未获取到用户信息')
          }

          // 步骤2: 获取用户资料 - 3秒超时（更短）
          console.log('👤 步骤2: 获取用户资料...')
          let userProfile = null
          try {
            const profileTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => {
                console.debug('📝 获取用户资料超时：3秒超时')
                reject(new Error('获取用户信息超时'))
              }, 3000)
            )
            
            const profilePromise = userApi.getUserProfile(data.user.id)
            userProfile = await Promise.race([profilePromise, profileTimeoutPromise]) as any
            console.log('✅ 用户资料获取成功:', userProfile ? '有数据' : '无数据')
          } catch (profileError) {
            console.debug('📝 用户资料获取失败，使用默认数据:', profileError.message)
            userProfile = null // 使用默认数据
          }

          // 步骤3: 构建用户对象
          console.log('🔧 步骤3: 构建用户对象...')
          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            username: userProfile?.username || data.user.user_metadata?.username || '用户',
            avatar_url: userProfile?.avatar_url || data.user.user_metadata?.avatar_url,
            student_verified: userProfile?.student_verified || false,
            created_at: data.user.created_at,
          }
          
          console.log('✅ 登录成功，用户数据:', user)
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          })
          
        } catch (error: any) {
          console.debug('📝 登录失败:', error)
          set({ 
            error: error.message || '登录失败，请检查邮箱和密码', 
            isLoading: false 
          })
          throw error
        }
      },

      // 注册 - 优化版本
      register: async (email: string, password: string, username: string, studentId?: string) => {
        console.log('📝 开始注册流程...')
        set({ isLoading: true, error: null })
        try {
          // 1. 创建Supabase用户 - 10秒超时
          console.log('📡 步骤1: 创建Supabase用户...')
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('网络超时，请检查网络连接或稍后重试')), 10000)
          )
          
          const authPromise = supabase.auth.signUp({
            email,
            password,
          })
          
          const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any
          console.log('✅ 用户创建响应:', data ? '成功' : '失败', error ? error.message : '无错误')

          if (error) throw error

          if (data.user) {
            // 2. 创建用户资料 - 5秒超时
            console.log('📋 步骤2: 创建用户资料...')
            const userProfile = {
              id: data.user.id,
              email: data.user.email,
              username,
              student_id: studentId,
              student_verified: false,
              created_at: data.user.created_at,
              updated_at: data.user.created_at,
            }

            try {
              const insertTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('创建用户资料超时')), 5000)
              )
              
              const insertPromise = supabase
                .from('users')
                .insert(userProfile)
              
              const { error: profileError } = await Promise.race([insertPromise, insertTimeoutPromise]) as any
              
              if (profileError) {
                console.debug('📝 用户资料创建失败:', profileError.message)
                // 继续注册流程，不阻塞
              } else {
                console.log('✅ 用户资料创建成功')
              }
            } catch (profileTimeoutError) {
              console.debug('📝 用户资料创建超时，继续注册流程')
            }

            // 3. 异步验证学生身份（不阻塞注册流程）
            if (studentId) {
              console.log('🎓 步骤3: 异步验证学生身份...')
              validateStudentId(studentId, username).then(async (isValidStudent) => {
                if (isValidStudent) {
                  try {
                    await supabase
                      .from('users')
                      .update({ student_verified: true })
                      .eq('id', data.user.id)
                    console.log('✅ 学生身份验证成功')
                  } catch (verifyError) {
                    console.debug('📝 学生身份验证更新失败:', verifyError)
                  }
                }
              }).catch(error => {
                console.debug('📝 学生身份验证失败:', error)
              })
            }

            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              username,
              student_verified: false,
              created_at: data.user.created_at,
            }

            console.log('✅ 注册成功')
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            })
          }
        } catch (error: any) {
          console.debug('📝 注册失败:', error)
          set({ 
            error: error.message || '注册失败，请检查输入信息', 
            isLoading: false 
          })
          throw error
        }
      },

      // 登出
      logout: async () => {
        console.log('🚪 开始登出流程...')
        set({ isLoading: true })
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          
          console.log('✅ 登出成功')
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        } catch (error: any) {
          console.debug('📝 登出失败:', error)
          set({ 
            error: error.message || '登出失败', 
            isLoading: false 
          })
          throw error
        }
      },

      // 检查认证状态 - 优化版本
      checkAuth: async () => {
        console.log('🔍 检查认证状态...')
        set({ isLoading: true })
        try {
          // 添加超时保护 - 8秒超时
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('检查认证状态超时')), 8000)
          )
          
          const currentUserPromise = userApi.getCurrentUser()
          const user = await Promise.race([currentUserPromise, timeoutPromise]) as any
          
          if (user) {
            console.log('👤 当前用户已登录:', user.email)
            // 获取用户详细信息 - 3秒超时
            let userProfile = null
            try {
              const profileTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('获取用户信息超时')), 3000)
              )
              
              const profilePromise = userApi.getUserProfile(user.id)
              userProfile = await Promise.race([profilePromise, profileTimeoutPromise]) as any
            } catch (profileError) {
              console.debug('📝 获取用户信息失败，使用默认数据')
              userProfile = null
            }
            
            const userData: User = {
              id: user.id,
              email: user.email!,
              username: userProfile?.username || user.user_metadata?.username,
              avatar_url: userProfile?.avatar_url || user.user_metadata?.avatar_url,
              student_verified: userProfile?.student_verified || false,
              created_at: user.created_at,
            }
            
            console.log('✅ 认证状态检查完成，用户已登录')
            set({ 
              user: userData, 
              isAuthenticated: true, 
              isLoading: false 
            })
          } else {
            console.log('ℹ️ 当前用户未登录')
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            })
          }
        } catch (error: any) {
          console.debug('📝 认证状态检查失败:', error.message)
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        }
      },

      // 清除错误信息
      clearError: () => {
        console.log('🧹 清除错误信息')
        set({ error: null })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

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
