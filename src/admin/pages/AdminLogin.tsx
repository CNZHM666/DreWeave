import React from 'react'
import { toast } from 'sonner'
import { supabase } from '../../config/supabase'

const AdminLogin: React.FC = () => {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const mkEmail = (u: string) => `${String(u||'').trim().toLowerCase()}@admin.local`

  const validateUsername = (u: string) => {
    const v = (u || '').trim()
    if (v.length < 3) return '用户名长度至少 3 位'
    if (!/^[a-zA-Z0-9_.-]+$/.test(v)) return '用户名仅支持字母、数字、下划线、点、短横'
    return ''
  }

  const validatePassword = (p: string) => {
    if (p.length < 8) return '密码长度至少 8 位'
    if (!/[A-Z]/.test(p)) return '密码需包含大写字母'
    if (!/[a-z]/.test(p)) return '密码需包含小写字母'
    if (!/[0-9]/.test(p)) return '密码需包含数字'
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) return '密码需包含特殊字符'
    return ''
  }

  const handleLogin = async () => {
    if (!username || !password) { toast.error('请输入用户名和密码'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: mkEmail(username), password })
    setLoading(false)
    if (error) { toast.error('登录失败：' + error.message + '，请确认用户名与管理员邮箱一致'); return }
    try { window.location.href = '/admin' } catch {}
  }

  // 管理员登录页不支持注册

  return (
    <div className="min-h-screen flex items-center justify-center gradient-healing">
      <div className="glass-light p-6 rounded-3xl bg-white/60 w-full max-w-md relative">
        <a href="/login" className="absolute right-4 top-4 text-sm btn-healing px-3 py-1">返回普通登录</a>
        <div className="text-xl font-bold mb-4">管理员登录</div>
        <div className="space-y-3">
          <input className="glass-light px-3 py-2 rounded-xl w-full" placeholder="管理员用户名" value={username} onChange={e=>setUsername(e.target.value)} />
          <input className="glass-light px-3 py-2 rounded-xl w-full" type="password" placeholder="密码" value={password} onChange={e=>setPassword(e.target.value)} />
          <button disabled={loading} className="btn-healing w-full" onClick={handleLogin}>{loading?'处理中...':'登录'}</button>
          <div className="text-center text-sm mt-2"><a className="underline" href="/admin/register">没有账号？前往管理员注册</a></div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin