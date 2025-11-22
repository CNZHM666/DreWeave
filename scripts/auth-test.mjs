import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  const content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split(/\r?\n/)
  const env = {}
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

async function main() {
  const env = loadEnv()
  const url = env.VITE_SUPABASE_URL
  const anon = env.VITE_SUPABASE_ANON_KEY

  if (!url || !anon) {
    console.error('Missing Supabase env vars')
    process.exit(1)
  }

  const supabase = createClient(url, anon)
  const timestamp = Date.now()
  const email = `dreweave.test+${timestamp}@example.com`
  const password = 'Test1234!'
  const username = `tester_${timestamp}`

  console.log('--- DREWEAVE Auth Test ---')
  console.log('SignUp -> Login -> Session -> Logout')
  console.log('Using email:', email)

  // Sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })
  if (signUpError) {
    console.error('SignUp error:', signUpError.message)
    process.exit(1)
  } else {
    console.log('SignUp user id:', signUpData.user?.id, 'session?', !!signUpData.session)
  }

  // Try insert user profile (mimic app)
  if (signUpData.user) {
    const profile = {
      id: signUpData.user.id,
      email,
      username,
      student_verified: false,
    }
    const { error: profileErr } = await supabase.from('users').insert(profile)
    if (profileErr) {
      console.warn('Insert profile failed (expected if RLS/email confirm):', profileErr.code, profileErr.message)
    } else {
      console.log('Insert profile succeeded')
    }
  }

  // Login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (loginError) {
    console.error('Login error:', loginError.message)
  } else {
    console.log('Login ok, session?', !!loginData.session)
  }

  // Session check
  const { data: userRes } = await supabase.auth.getUser()
  console.log('Current user id:', userRes.user?.id || null)

  // Protected table access
  if (userRes.user) {
    const { data: rewards, error: rewardsErr } = await supabase.from('rewards').select('*').limit(1)
    console.log('Protected table access:', rewardsErr ? `error ${rewardsErr.code}` : 'ok')
  }

  // Logout
  const { error: logoutErr } = await supabase.auth.signOut()
  console.log('Logout:', logoutErr ? logoutErr.message : 'ok')

  console.log('--- Test Completed ---')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

