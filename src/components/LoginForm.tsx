import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { OfflineModeToggle } from './OfflineModeToggle'
import { Eye, EyeOff, User, Lock, GraduationCap, CheckCircle, XCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface LoginFormProps {
  onSuccess?: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    studentId: '',
  })
  
  const { login, register, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  // 密码强度检查
  const getPasswordStrength = (password: string) => {
    let strength = 0
    let feedback = []
    
    if (password.length >= 8) {
      strength += 1
    } else {
      feedback.push('至少8位字符')
    }
    
    if (/[A-Z]/.test(password)) {
      strength += 1
    } else {
      feedback.push('大写字母')
    }
    
    if (/[a-z]/.test(password)) {
      strength += 1
    } else {
      feedback.push('小写字母')
    }
    
    if (/\d/.test(password)) {
      strength += 1
    } else {
      feedback.push('数字')
    }
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1
    } else {
      feedback.push('特殊字符')
    }
    
    return { strength, feedback }
  }

  const passwordStrength = !isLogin ? getPasswordStrength(formData.password) : null
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

  // 密码要求检查
  const getPasswordRequirements = (password: string) => {
    return [
      { name: '至少8位字符', met: password.length >= 8 },
      { name: '包含大写字母', met: /[A-Z]/.test(password) },
      { name: '包含小写字母', met: /[a-z]/.test(password) },
      { name: '包含数字', met: /\d/.test(password) },
      { name: '不包含空格', met: !/\s/.test(password) },
    ]
  }

  const passwordRequirements = !isLogin ? getPasswordRequirements(formData.password) : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        toast.success('登录成功！欢迎来到织梦空间 🌱')
        // 登录成功立即导航
        onSuccess?.()
      } else {
        // 注册模式：使用用户名+密码，不再需要邮箱
        await register(formData.username, formData.password, formData.confirmPassword, formData.studentId)
        toast.success('注册成功！正在进入织梦空间... ✨')
        
        // 设置导航状态，显示加载界面
        setIsNavigating(true)
        
        // 更快速的导航过渡
        setTimeout(() => {
          setIsNavigating(false)
          onSuccess?.()
        }, 500)
      }
    } catch (error: any) {
      toast.error(error.message || '操作失败，请重试')
      setIsNavigating(false)
    }
  }

  React.useEffect(() => {
    if (isNavigating) {
      const id = setTimeout(() => {
        try { onSuccess?.() } catch {}
      }, 5000)
      return () => clearTimeout(id)
    }
  }, [isNavigating, onSuccess])

  React.useEffect(() => {
    if (isAuthenticated) {
      setIsNavigating(false)
      try { onSuccess?.() } catch {}
    }
  }, [isAuthenticated, onSuccess])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-healing p-4">
      <div className="glass-light rounded-3xl p-8 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-healing-title mb-2">
            {isLogin ? '欢迎回家' : '加入织梦'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? '继续你的治愈之旅' : '开始你的自律新生活'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="username"
                placeholder="请输入用户名（3-20位，支持中文）"
                value={formData.username}
                onChange={handleInputChange}
                className="input-healing w-full pl-10 pr-4"
                required={!isLogin}
                minLength={3}
                maxLength={20}
              />
            </div>
          )}
          
          {isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={handleInputChange}
                className="input-healing w-full pl-10 pr-4"
                required={isLogin}
              />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder={isLogin ? "请输入密码" : "请输入密码（至少8位，包含大小写字母和数字）"}
              value={formData.password}
              onChange={handleInputChange}
              className="input-healing w-full pl-10 pr-12"
              required
              minLength={isLogin ? 6 : 8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {!isLogin && formData.password && (
            <div className="password-requirements rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">密码要求</span>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < (passwordStrength?.strength || 0)
                          ? i < 2
                            ? 'bg-red-400'
                            : i < 4
                            ? 'bg-yellow-400'
                            : 'bg-green-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className={`password-requirement-item flex items-center text-xs ${
                    req.met ? 'met' : 'not-met'
                  }`}>
                    {req.met ? (
                      <CheckCircle className="w-3 h-3 mr-2" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-2" />
                    )}
                    {req.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`input-healing w-full pl-10 pr-12 ${
                  formData.confirmPassword && !passwordsMatch ? 'border-red-300' : ''
                }`}
                required={!isLogin}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {formData.confirmPassword && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  {passwordsMatch ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
          )}

          {!isLogin && (
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="studentId"
                placeholder="请输入学号（可选，用于学生认证）"
                value={formData.studentId}
                onChange={handleInputChange}
                className="input-healing w-full pl-10 pr-4"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 离线模式切换 */}
          <OfflineModeToggle />

          <button
            type="submit"
            disabled={isLoading || isNavigating}
            className="btn-healing w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isNavigating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isNavigating ? '正在进入织梦空间...' : (isLogin ? '登录中...' : '注册中...')}
              </div>
            ) : (
              isLogin ? '登录' : '注册'
            )}
          </button>
        </form>

        {/* 其他登录方式 */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white bg-opacity-50 text-gray-500">其他登录方式</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="glass-light px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-opacity-40 transition-all duration-300"
              onClick={() => toast.info('微信登录功能开发中...')}
            >
              微信登录
            </button>
            <button
              type="button"
              className="glass-light px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-opacity-40 transition-all duration-300"
              onClick={() => toast.info('手机号登录功能开发中...')}
            >
              手机号登录
            </button>
          </div>

          <div className="mt-4">
            <a
              href="/admin/login"
              className="btn-healing w-full inline-block text-center"
            >
              管理员登录
            </a>
          </div>
        </div>

        {/* 导航过渡界面 */}
        {isNavigating && (
          <div className="fixed inset-0 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center z-50">
            <div className="text-center text-blue-900">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold mb-2">🌱 欢迎来到织梦空间</h2>
              <p className="text-lg opacity-90">正在为您准备专属的治愈之旅...</p>
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              还没有账号？
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-primary-600 hover:text-primary-700 font-medium ml-1"
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号？
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-primary-600 hover:text-primary-700 font-medium ml-1"
              >
                立即登录
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginForm