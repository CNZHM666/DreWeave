import { supabase, TABLES } from '../../config/supabase'

export async function fetchUsers(query: string, page = 1, size = 20) {
  const from = (page - 1) * size
  let q = supabase.from(TABLES.USERS).select('id, email, username, created_at').range(from, from + size - 1).order('created_at', { ascending: false })
  if (query) q = q.ilike('email', `%${query}%`)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function fetchMeasurements(userId: string | undefined, start?: string, end?: string, page = 1, size = 50) {
  const from = (page - 1) * size
  let q = supabase.from(TABLES.TEST_RESULTS).select('*').range(from, from + size - 1).order('completed_at', { ascending: false })
  if (userId) q = q.eq('user_id', userId)
  if (start) q = q.gte('completed_at', start)
  if (end) q = q.lte('completed_at', end)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function fetchCheckins(userId: string | undefined, start?: string, end?: string, page = 1, size = 50) {
  const from = (page - 1) * size
  let q = supabase.from(TABLES.CHECKIN_EVENTS).select('*').range(from, from + size - 1).order('ts_server', { ascending: false })
  if (userId) q = q.eq('user_id', userId)
  if (start) q = q.gte('ts_server', start)
  if (end) q = q.lte('ts_server', end)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function fetchAssessments(userId?: string, start?: string, end?: string, page = 1, size = 50) {
  const from = (page - 1) * size
  let q = supabase.from('assessments').select('*').range(from, from + size - 1).order('created_at', { ascending: false })
  if (userId) q = q.eq('user_id', userId)
  if (start) q = q.gte('created_at', start)
  if (end) q = q.lte('created_at', end)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function flagCheckin(id: string, flagged: boolean, reason?: string) {
  const { data, error } = await supabase.from(TABLES.CHECKIN_EVENTS).update({ flagged, flag_reason: reason }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export function exportCsv(filename: string, rows: any[]) {
  const headers = Object.keys(rows[0] || {})
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}