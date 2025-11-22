import React from 'react'
import { toast } from 'sonner'
import { supabase } from '../../config/supabase'

const AdminRegister: React.FC = () => {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
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

  const onSubmit = async () => {
    if (!username || !password || !confirm) { toast.error('请完整填写表单'); return }
    const uErr = validateUsername(username); if (uErr) { toast.error(uErr); return }
    const pErr = validatePassword(password); if (pErr) { toast.error(pErr); return }
    if (password !== confirm) { toast.error('两次密码不一致'); return }
    setLoading(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const forceClient = params.get('mode') === 'client'
      if (forceClient) {
        const email = mkEmail(username)
        const r1 = await supabase.auth.signUp({ email, password, options: { data: { roles: ['admin'], username } } })
        if (r1.error) throw new Error(r1.error.message)
        const r2 = await supabase.auth.signInWithPassword({ email, password })
        if (r2.error) throw new Error(r2.error.message)
        try { window.location.href = '/admin' } catch {}
        return
      }
      const resp = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const raw = await resp.text()
      let data: any = null
      try { data = JSON.parse(raw) } catch {}
      if (!resp.ok || !data || !data.ok) {
        const email = mkEmail(username)
        const r1 = await supabase.auth.signUp({ email, password, options: { data: { roles: ['admin'], username } } })
        if (r1.error) throw new Error(r1.error.message)
        const r2 = await supabase.auth.signInWithPassword({ email, password })
        if (r2.error) throw new Error(r2.error.message)
        try { window.location.href = '/admin' } catch {}
        return
      }
      const { access_token, refresh_token } = data
      const s = await supabase.auth.setSession({ access_token, refresh_token })
      if (s.error) throw new Error(s.error.message)
      try {
        const gu = await supabase.auth.getUser()
        if (!gu.data?.user) {
          const email = mkEmail(username)
          const r2 = await supabase.auth.signInWithPassword({ email, password })
          if (r2.error) throw new Error(r2.error.message)
        }
      } catch {}
      try { window.location.href = '/admin' } catch {}
    } catch (e: any) {
      toast.error('注册或登录失败：' + (e?.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-healing">
      <div className="glass-light p-6 rounded-3xl bg-white/60 w-full max-w-md relative">
        <a href="/login" className="absolute right-4 top-4 text-sm btn-healing px-3 py-1">返回普通登录</a>
        <div className="text-xl font-bold mb-4">管理员注册</div>
        <div className="space-y-3">
          <input className="glass-light px-3 py-2 rounded-xl w-full" placeholder="管理员用户名" value={username} onChange={e=>setUsername(e.target.value)} />
          <input className="glass-light px-3 py-2 rounded-xl w-full" type="password" placeholder="密码" value={password} onChange={e=>setPassword(e.target.value)} />
          <input className="glass-light px-3 py-2 rounded-xl w-full" type="password" placeholder="确认密码" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          <button disabled={loading} className="btn-healing w-full" onClick={onSubmit}>{loading?'处理中...':'注册并进入控制台'}</button>
          <div className="text-center text-sm mt-2"><a className="underline" href="/admin/login">已有账号？前往管理员登录</a></div>
        </div>
      </div>
    </div>
  )
}

export default AdminRegister