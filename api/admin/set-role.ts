import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }
  const secret = process.env.ADMIN_API_SECRET || ''
  const recv = String(req.headers['x-admin-secret'] || '')
  if (!secret || recv !== secret) {
    res.status(401).json({ ok: false, error: 'unauthorized' })
    return
  }
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({ ok: false, error: 'server_env_missing' })
    return
  }
  const client = createClient(supabaseUrl, serviceKey)
  const { id, username } = (req.body || {}) as { id?: string; username?: string }
  if (!id) {
    res.status(400).json({ ok: false, error: 'missing_user_id' })
    return
  }
  try {
    const upd = await client.auth.api.updateUserById(id, {
      user_metadata: { roles: ['admin'], username: username || 'admin' },
    } as any)
    const error = (upd as any)?.error
    const user = (upd as any)?.user || (upd as any)?.data?.user
    if (error) {
      res.status(400).json({ ok: false, error: String(error.message || 'update_failed') })
      return
    }
    res.status(200).json({ ok: true, user: { id: user?.id, email: user?.email, user_metadata: user?.user_metadata } })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || 'unknown_error') })
  }
}