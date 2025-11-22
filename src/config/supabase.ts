import { createClient } from '@supabase/supabase-js'
import { safeRandomUUID } from '../lib/utils'

// 获取Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 检查环境变量是否正确配置
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
  console.debug('📝 Supabase配置错误：VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 未设置')
  console.debug('请检查环境变量配置')
}

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== ''
// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  PROFILES: 'users',
  CHECKIN_EVENTS: 'checkin_events',
  QR_SESSIONS: 'qr_sessions',
  DEVICE_FPS: 'device_fingerprints',
  TEST_RESULTS: 'test_results',
  COINS: 'coins',
  REWARDS: 'rewards',
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'user_achievements',
  CALMING_MESSAGES: 'calming_messages',
} as const

// 错误处理函数
export const handleSupabaseError = (error: any) => {
  console.debug('Supabase Error:', error)
  throw new Error(error.message || '数据库操作失败')
}

// 用户相关操作
export const userApi = {
  // 获取当前用户
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) return null
    return user || null
  },

  // 获取用户资料
  getUserProfile: async (userId: string) => {
    try {
      console.log(`🔍 查询用户资料，用户ID: ${userId}`)
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', userId)
        .single()

      console.log(`📊 查询结果:`, { data, error })

      if (error) {
        // 表不存在或无记录时，返回 null 以便前端降级处理
        // 42P01: undefined_table, PGRST116: Results contain 0 rows
        if ((error as any).code === '42P01' || (error as any).code === 'PGRST116') {
          console.log(`⚠️ 用户资料不存在，返回null`)
          return null
        }
        console.debug(`📝 查询用户资料失败:`, error)
        throw error
      }
      console.log(`✅ 用户资料查询成功`)
      return data
    } catch (err: any) {
      // 任何查询失败均优雅降级为无资料
      console.debug(`📝 获取用户资料异常:`, err)
      return null
    }
  },

  // 更新用户资料
  updateUserProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw handleSupabaseError(error)
    return data
  },
}

// 签到相关操作
export const checkInApi = {
  // 新：分页查询事件
  getEvents: async (userId: string, limit = 20, cursor?: string) => {
    const t0 = performance.now ? performance.now() : Date.now()
    try {
      let q = supabase
        .from(TABLES.CHECKIN_EVENTS)
        .select('*')
        .eq('user_id', userId)
        .order('ts_server', { ascending: false })
        .limit(limit)
      if (cursor) q = q.lt('ts_server', cursor)
      const { data, error } = await q
      const t1 = performance.now ? performance.now() : Date.now()
      try { console.log('[checkInApi.getEvents]', { userId, ok: !error, count: (data||[]).length, duration_ms: Math.round(t1 - t0) }) } catch {}
      if (error) throw error
      return data || []
    } catch (err: any) {
      const code = err?.code || ''
      const msg = String(err?.message || '').toLowerCase()
      // 表不存在或未迁移时，优雅返回空数组
      if (code === '42P01' || code === 'PGRST102' || msg.includes('schema cache') || msg.includes('could not find the table')) {
        console.debug('[checkInApi.getEvents:fallback_empty]', { code, message: err?.message })
        return []
      }
      throw handleSupabaseError(err)
    }
  },
  // 新：统一提交
  submitEvent: async (payload: { user_id: string; method: 'qr'|'gps'|'manual'; ts_client: string; tz_offset_minutes: number; geo?: { lat: number; lng: number; accuracy?: number }; device_fp: string; qr_session_id?: string }) => {
    const t0 = performance.now ? performance.now() : Date.now()
    try {
      const { data, error } = await supabase
        .from(TABLES.CHECKIN_EVENTS)
        .insert({
          user_id: payload.user_id,
          method: payload.method,
          ts_client: payload.ts_client,
          tz_offset_minutes: payload.tz_offset_minutes,
          geo_lat: payload.geo?.lat,
          geo_lng: payload.geo?.lng,
          geo_accuracy_m: payload.geo?.accuracy,
          device_fp: payload.device_fp,
          qr_session_id: payload.qr_session_id,
          ts_server: new Date().toISOString(),
          status: 'pending',
        })
        .select()
        .single()
      const t1 = performance.now ? performance.now() : Date.now()
      try { console.log('[checkInApi.submitEvent]', { ok: !error, duration_ms: Math.round(t1 - t0), data, error }) } catch {}
      if (error) throw error
      return data
    } catch (err: any) {
      const code = err?.code || ''
      const msg = String(err?.message || '').toLowerCase()
      // 让调用方进入离线后备逻辑
      if (code === '42P01' || code === 'PGRST102' || msg.includes('schema cache') || msg.includes('could not find the table')) {
        console.debug('[checkInApi.submitEvent:offline_fallback]', { code, message: err?.message })
        throw err
      }
      throw handleSupabaseError(err)
    }
  },
  // 新：QR 会话
  createQrSession: async (issuerId: string, expiresAt: string, payload: any) => {
    const { data, error } = await supabase
      .from(TABLES.QR_SESSIONS)
      .insert({ id: safeRandomUUID(), issuer_id: issuerId, expires_at: expiresAt, payload, revoked: false })
      .select()
      .single()
    if (error) throw handleSupabaseError(error)
    return data
  },
  // 新：统计
  getStats: async (userId: string) => {
    const { data, error } = await supabase
      .from(TABLES.CHECKIN_EVENTS)
      .select('method, status, ts_server, risk_score')
      .eq('user_id', userId)
      .order('ts_server', { ascending: false })
      .limit(500)
    if (error) throw handleSupabaseError(error)
    return data || []
  }
}

// 测试相关操作
export const testApi = {
  // 保存测试结果
  saveTestResult: async (userId: string, testType: string, score: number, answers: any) => {
    // 获取测试信息
    const { testTypes, scoringCriteria } = await import('../data/testQuestions')
    const testConfig = testTypes[testType.toUpperCase() as keyof typeof testTypes]
    const criteria = testType === 'iat' ? scoringCriteria.iAT : scoringCriteria.sexualRepression
    
    // 计算最大分数和百分比
    const maxScore = testConfig.questions.length * 5 // 每题最高5分
    const percentage = Math.round((score / maxScore) * 100)
    
    // 确定结果类别
    let resultCategory = ''
    let resultDescription = ''
    let recommendations: string[] = []
    
    for (const [key, criterion] of Object.entries(criteria)) {
      const criterionConfig = criterion as any
      if (score >= criterionConfig.min && score <= criterionConfig.max) {
        resultCategory = key
        resultDescription = criterionConfig.description
        recommendations = [criterionConfig.advice]
        break
      }
    }
    
    const { data, error } = await supabase
      .from(TABLES.TEST_RESULTS)
      .insert({
        user_id: userId,
        test_type: testType,
        test_name: testConfig.name,
        score: score,
        max_score: maxScore,
        percentage: percentage,
        result_category: resultCategory,
        result_description: resultDescription,
        recommendations: recommendations,
        completed_at: new Date().toISOString(),
        answers: answers,
      })
      .select()
      .single()
    
    if (error) throw handleSupabaseError(error)
    return data
  },

  // 获取用户测试历史
  getUserTestHistory: async (userId: string) => {
    const { data, error } = await supabase
      .from(TABLES.TEST_RESULTS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw handleSupabaseError(error)
    return data
  },
}

// 虚拟币相关操作
export const coinApi = {
  // 获取用户虚拟币余额
  getUserCoins: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.COINS)
        .select('amount')
        .eq('user_id', userId)

      if (error && (error as any).code !== 'PGRST116') throw error
      const amounts = (data || []).map((r: any) => Number(r.amount) || 0)
      return amounts.reduce((sum, v) => sum + v, 0)
    } catch (err) {
      return 0
    }
  },

  // 添加虚拟币交易记录
  addCoinTransaction: async (userId: string, amount: number, type: string, description: string) => {
    const { data, error } = await supabase
      .from(TABLES.COINS)
      .insert({
        user_id: userId,
        amount: amount,
        type: type,
        description: description,
      })
      .select()
      .single()
    
    if (error) throw handleSupabaseError(error)
    return data
  },

  // 获取用户交易记录
  getUserTransactions: async (userId: string) => {
    const c = _txCache.get(userId)
    if (c && Date.now() - c.ts < _TTL) return c.data
    const { data, error } = await supabase
      .from(TABLES.COINS)
      .select('id, user_id, amount, type, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw handleSupabaseError(error)
    const res = data || []
    _txCache.set(userId, { ts: Date.now(), data: res })
    return res
  },
}

// 奖励相关操作
export const rewardApi = {
  // 获取用户奖励列表
  getUserRewards: async (userId: string) => {
    const c = _rewardsCache.get(userId)
    if (c && Date.now() - c.ts < _TTL) return c.data
    const { data, error } = await supabase
      .from(TABLES.REWARDS)
      .select('id, user_id, title, description, cost, is_redeemed, redeemed_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw handleSupabaseError(error)
    const res = data || []
    _rewardsCache.set(userId, { ts: Date.now(), data: res })
    return res
  },

  // 创建奖励
  createReward: async (userId: string, rewardData: any) => {
    const { data, error } = await supabase
      .from(TABLES.REWARDS)
      .insert({
        user_id: userId,
        ...rewardData,
      })
      .select()
      .single()
    
    if (error) throw handleSupabaseError(error)
    return data
  },

  // 兑换奖励
  redeemReward: async (userId: string, rewardId: string) => {
    const { data, error } = await supabase
      .from(TABLES.REWARDS)
      .update({ is_redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('id', rewardId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw handleSupabaseError(error)
    return data
  },
}

// 成就相关操作
export const achievementApi = {
  // 获取所有成就
  getAllAchievements: async () => {
    const { data, error } = await supabase
      .from(TABLES.ACHIEVEMENTS)
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) throw handleSupabaseError(error)
    return data
  },

  // 获取用户成就
  getUserAchievements: async (userId: string) => {
    const { data, error } = await supabase
      .from(TABLES.USER_ACHIEVEMENTS)
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
    
    if (error) throw handleSupabaseError(error)
    return data
  },

  // 解锁成就
  unlockAchievement: async (userId: string, achievementId: string) => {
    const { data, error } = await supabase
      .from(TABLES.USER_ACHIEVEMENTS)
      .insert({
        user_id: userId,
        achievement_id: achievementId,
      })
      .select()
      .single()
    
    if (error) throw handleSupabaseError(error)
    return data
  },
}

// 治愈消息相关操作
export const calmingMessageApi = {
  // 获取随机治愈消息
  getRandomMessage: async () => {
    const { data, error } = await supabase
      .from(TABLES.CALMING_MESSAGES)
      .select('*')
      .order('random()')
      .limit(1)
      .single()
    
    if (error) throw handleSupabaseError(error)
    return data
  },

  // 获取所有治愈消息
  getAllMessages: async () => {
    const { data, error } = await supabase
      .from(TABLES.CALMING_MESSAGES)
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) throw handleSupabaseError(error)
    return data
  },
}

export default supabase
const _txCache = new Map<string, { ts: number, data: any[] }>()
const _rewardsCache = new Map<string, { ts: number, data: any[] }>()
const _TTL = 30000
