import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method_not_allowed' }); return }

  const devOpen = String(process.env.ADMIN_DEV_OPEN || '').toLowerCase() === 'true'
  const secret = process.env.ADMIN_API_SECRET || ''
  const recv = String(req.headers['x-admin-secret'] || '')
  if (!devOpen) {
    if (!secret || recv !== secret) { res.status(401).json({ ok: false, error: 'unauthorized' }); return }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !serviceKey || !anonKey) { res.status(500).json({ ok: false, error: 'server_env_missing' }); return }

  const { username, password } = (req.body || {}) as { username?: string; password?: string }
  const u = String(username || '').trim().toLowerCase()
  const p = String(password || '')
  if (!u || !p) { res.status(400).json({ ok: false, error: 'missing_params' }); return }
  if (u.length < 3) { res.status(400).json({ ok: false, error: 'username_too_short' }); return }
  if (!/^[a-z0-9_.-]+$/.test(u)) { res.status(400).json({ ok: false, error: 'username_invalid' }); return }
  if (p.length < 8 || !/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/[0-9]/.test(p) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) {
    res.status(400).json({ ok: false, error: 'password_weak' }); return
  }
  const email = `${u}@admin.local`

  const client = createClient(supabaseUrl, serviceKey)
  try {
    // create or update user (Supabase JS v1 admin API)
    const createRes = await client.auth.api.createUser({
      email,
      password: p,
      email_confirm: true,
      user_metadata: { roles: ['admin'], username: u },
    } as any)
    const userId = (createRes as any)?.user?.id
    if (!userId && (createRes as any)?.error) {
      // try update if exists
      const lookup = await client.auth.api.listUsers()
      const users = (lookup as any)?.data || (lookup as any)?.users || []
      const existed = users.find((x: any) => String(x.email).toLowerCase() === email)
      if (!existed) { res.status(400).json({ ok: false, error: String(((createRes as any)?.error?.message) || 'create_failed') }); return }
      const upd = await client.auth.api.updateUserById(existed.id, {
        user_metadata: { roles: ['admin'], username: u },
      } as any)
      if ((upd as any)?.error) { res.status(400).json({ ok: false, error: String(((upd as any)?.error?.message) || 'update_failed') }); return }
    }

    // get session tokens by signing in server-side
    const endUserClient = createClient(supabaseUrl, anonKey)
    const signin = await endUserClient.auth.signIn({ email, password: p })
    const error = (signin as any)?.error
    const session = (signin as any)?.session
    const user = (signin as any)?.user
    if (error || !session) {
      res.status(400).json({ ok: false, error: String(error?.message || 'signin_failed') }); return
    }
    res.status(200).json({ ok: true, user, access_token: session.access_token, refresh_token: session.refresh_token })
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: String(e instanceof Error ? e.message : 'unknown_error') })
  }
}