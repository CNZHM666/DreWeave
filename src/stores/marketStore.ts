import { create } from 'zustand'
import { coinApi, rewardApi } from '../config/supabase'
import { toast } from 'sonner'
import { useAchievementStore } from './achievementStore'

// 虚拟币交易接口
interface CoinTransaction {
  id: string
  user_id: string
  amount: number
  type: 'earn' | 'spend'
  description: string
  created_at: string
}

// 奖励项目接口
interface Reward {
  id: string
  user_id: string
  title: string
  description: string
  cost: number
  is_redeemed: boolean
  redeemed_at: string | null
  created_at: string
}

// 任务接口
interface Task {
  id: string
  title: string
  description: string
  reward: number
  type: 'daily' | 'weekly' | 'special'
  is_completed: boolean
  completed_at: string | null
}

// 时间交易所状态接口
interface MarketState {
  coins: number
  transactions: CoinTransaction[]
  rewards: Reward[]
  availableTasks: Task[]
  isLoading: boolean
  error: string | null
  lastFreeClaimAt: number | null
  freeClaimCountToday: number
}

// 时间交易所操作接口
interface MarketActions {
  fetchUserData: (userId: string) => Promise<void>
  earnCoins: (userId: string, amount: number, description: string) => Promise<void>
  spendCoins: (userId: string, amount: number, description: string) => Promise<boolean>
  createReward: (userId: string, rewardData: { title: string; description: string; cost: number; category?: string }) => Promise<void>
  redeemReward: (userId: string, rewardId: string) => Promise<boolean>
  completeTask: (userId: string, taskId: string) => Promise<void>
  freeClaimCoins: (userId: string, amount: number) => Promise<boolean>
  canFreeClaim: (userId: string) => boolean
  clearError: () => void
}

// 时间交易所存储类型
interface MarketStore extends MarketState, MarketActions {}

// 预设任务
const defaultTasks: Task[] = [
  {
    id: 'checkin_daily',
    title: '每日签到',
    description: '完成每日签到任务',
    reward: 10,
    type: 'daily',
    is_completed: false,
    completed_at: null
  },
  {
    id: 'test_weekly',
    title: '完成测试',
    description: '完成一次心理健康测试',
    reward: 20,
    type: 'weekly',
    is_completed: false,
    completed_at: null
  },
  {
    id: 'calm_space',
    title: '使用冷静空间',
    description: '在冲动时使用冷静空间功能',
    reward: 15,
    type: 'special',
    is_completed: false,
    completed_at: null
  },
  {
    id: 'consecutive_7',
    title: '连续签到7天',
    description: '连续签到7天',
    reward: 50,
    type: 'special',
    is_completed: false,
    completed_at: null
  },
  {
    id: 'consecutive_30',
    title: '连续签到30天',
    description: '连续签到30天',
    reward: 200,
    type: 'special',
    is_completed: false,
    completed_at: null
  },
  {
    id: 'test_completion',
    title: '完成所有测试',
    description: '完成iAT和性压抑两项测试',
    reward: 30,
    type: 'special',
    is_completed: false,
    completed_at: null
  }
]

// 官方奖励模板
const officialRewards = [
  {
    title: '奶茶一杯',
    description: '奖励自己一杯喜欢的奶茶',
    cost: 50,
    is_official: true
  },
  {
    title: '追剧1小时',
    description: '安心地看一集喜欢的剧集',
    cost: 80,
    is_official: true
  },
  {
    title: '游戏时间30分钟',
    description: '适度游戏，放松身心',
    cost: 60,
    is_official: true
  },
  {
    title: '甜品奖励',
    description: '享受一份美味的甜品',
    cost: 70,
    is_official: true
  },
  {
    title: '购物基金',
    description: '存入100元到购物基金',
    cost: 100,
    is_official: true
  },
  {
    title: '运动时间',
    description: '出去散步或运动30分钟',
    cost: 40,
    is_official: true
  },
  {
    title: '阅读时间',
    description: '静心阅读30分钟',
    cost: 45,
    is_official: true
  },
  {
    title: '音乐享受',
    description: '听喜欢的音乐30分钟',
    cost: 35,
    is_official: true
  }
]

// 任务完成验证函数 - 严格验证任务是否真正完成
const validateTaskCompletion = (taskId: string, userId: string): boolean => {
  // 这里可以添加具体的任务完成验证逻辑
  // 例如：检查签到记录、测试完成情况等
  
  // 临时验证逻辑 - 在实际应用中应该查询真实数据
  switch (taskId) {
    case 'checkin_daily':
      // 检查今日签到（临时：本地存储标记）
      // 支持在线完成 'completed' 与离线保存 'completed_offline'
      const today = new Date().toDateString()
      const checkinStatus = localStorage.getItem(`checkin_${userId}_${today}`)
      return checkinStatus === 'completed' || checkinStatus === 'completed_offline'
      
    case 'test_weekly':
      // 检查是否完成测试 - 实际应该查询测试记录
      // 临时：检查本地存储的测试状态
      const testStatus = localStorage.getItem(`test_weekly_${userId}`)
      return testStatus === 'completed'
      
    case 'calm_space':
      // 检查是否使用冷静空间 - 实际应该查询使用记录
      // 临时：检查本地存储的使用状态
      const calmStatus = localStorage.getItem(`calm_space_${userId}`)
      return calmStatus === 'completed'
      
    case 'consecutive_7':
      // 检查连续7天签到 - 实际应该查询连续签到记录
      // 临时：检查本地存储的连续签到状态
      const consecutive7Status = localStorage.getItem(`consecutive_7_${userId}`)
      return consecutive7Status === 'completed'
      
    case 'consecutive_30':
      // 检查连续30天签到 - 实际应该查询连续签到记录
      // 临时：检查本地存储的连续签到状态
      const consecutive30Status = localStorage.getItem(`consecutive_30_${userId}`)
      return consecutive30Status === 'completed'
      
    case 'test_completion':
      // 检查是否完成所有测试 - 实际应该查询测试完成记录
      // 临时：检查本地存储的测试完成状态
      const testCompletionStatus = localStorage.getItem(`test_completion_${userId}`)
      return testCompletionStatus === 'completed'
      
    default:
      return false
  }
}

// 创建时间交易所状态管理
export const useMarketStore = create<MarketStore>()((set, get) => ({
  coins: 0,
  transactions: [],
  rewards: [],
  availableTasks: defaultTasks,
  isLoading: false,
  error: null,
  lastFreeClaimAt: null,
  freeClaimCountToday: 0,

  // 获取用户数据
  fetchUserData: async (userId: string) => {
    try {
      const state: any = get()
      const now = Date.now()
      if (state.isLoading) return
      if (state._lastFetchAt && now - state._lastFetchAt < 1500) return
      state._lastFetchAt = now
    } catch {}
    set({ isLoading: true, error: null })
    try {
      let coins = get().coins
      let rewards: Reward[] = []
      let rawTx: any[] | null = null

      try {
        const serverCoins = await coinApi.getUserCoins(userId)
        if (typeof serverCoins === 'number') coins = Math.max(coins, serverCoins)
      } catch {}

      try {
        rewards = await rewardApi.getUserRewards(userId) as any
      } catch {
        try {
          const local = localStorage.getItem(`dreweave_user_rewards_${userId}`)
          rewards = local ? JSON.parse(local) : []
        } catch {
          rewards = []
        }
      }

      try {
        rawTx = await coinApi.getUserTransactions(userId) as any
      } catch {
        rawTx = null
      }

      const transactions: CoinTransaction[] = rawTx
        ? (rawTx || []).map((t: any) => ({
            id: t.id,
            user_id: t.user_id,
            amount: t.amount,
            type: (Number(t.amount) || 0) >= 0 ? 'earn' : 'spend',
            description: t.description,
            created_at: t.created_at,
          }))
        : get().transactions

      set({
        coins,
        rewards: rewards || [],
        transactions: transactions || [],
        isLoading: false
      })
    } catch (error: any) {
      set({
        error: error.message || '获取用户数据失败',
        isLoading: false
      })
      toast.error('获取数据失败')
    }
  },

  // 赚取虚拟币
  earnCoins: async (userId: string, amount: number, description: string) => {
    set({ isLoading: true, error: null })
    const newTransaction: CoinTransaction = {
      id: Date.now().toString(),
      user_id: userId,
      amount,
      type: 'earn',
      description,
      created_at: new Date().toISOString()
    }
    const newCoins = get().coins + amount
    set({
      coins: newCoins,
      transactions: [newTransaction, ...get().transactions],
      isLoading: false
    })
    try {
      await coinApi.addCoinTransaction(userId, amount, 'earn', description)
    } catch {
      try {
        const key = `dreweave_pending_coin_tx_${userId}`
        const q = localStorage.getItem(key)
        const list = q ? JSON.parse(q) : []
        list.push({ ...newTransaction })
        localStorage.setItem(key, JSON.stringify(list))
      } catch {}
    }
    toast.success(`获得 ${amount} 织梦豆！`, { description })
    try { await useAchievementStore.getState().updateProgress(userId, 'coins', amount) } catch {}
  },

  // 花费虚拟币
  spendCoins: async (userId: string, amount: number, description: string) => {
    const { coins } = get()
    if (coins < amount) {
      set({ error: '织梦豆余额不足' })
      toast.error('织梦豆余额不足')
      return false
    }
    set({ isLoading: true, error: null })
    const newCoins = coins - amount
    const newTransaction: CoinTransaction = {
      id: Date.now().toString(),
      user_id: userId,
      amount: -amount,
      type: 'spend',
      description,
      created_at: new Date().toISOString()
    }
    set({
      coins: newCoins,
      transactions: [newTransaction, ...get().transactions],
      isLoading: false
    })
    try {
      await coinApi.addCoinTransaction(userId, -amount, 'spend', description)
    } catch {
      try {
        const key = `dreweave_pending_coin_tx_${userId}`
        const q = localStorage.getItem(key)
        const list = q ? JSON.parse(q) : []
        list.push({ ...newTransaction })
        localStorage.setItem(key, JSON.stringify(list))
      } catch {}
    }
    toast.success(`花费 ${amount} 织梦豆`, { description })
    return true
  },

  // 创建奖励
  createReward: async (userId: string, rewardData: any) => {
    set({ isLoading: true, error: null })
    try {
      // 确保奖励数据完整
      const completeRewardData = {
        title: rewardData.title,
        description: rewardData.description,
        cost: rewardData.cost || 10,
        category: rewardData.category || 'self_care',
        is_redeemed: false,
        redeemed_at: null,
        created_at: new Date().toISOString()
      }
      
      try {
        await rewardApi.createReward(userId, completeRewardData)
      } catch {}

      const localReward: Reward = {
        id: `${Date.now()}`,
        user_id: userId,
        title: completeRewardData.title,
        description: completeRewardData.description,
        cost: completeRewardData.cost,
        is_redeemed: false,
        redeemed_at: null,
        created_at: completeRewardData.created_at
      }

      const mergedRewards = [localReward, ...get().rewards]
      set({
        rewards: mergedRewards,
        isLoading: false
      })

      try {
        localStorage.setItem(`dreweave_user_rewards_${userId}`, JSON.stringify(mergedRewards))
      } catch {}
      
      toast.success('奖励创建成功！')
    } catch (error: any) {
      set({
        error: error.message || '创建奖励失败',
        isLoading: false
      })
      toast.error('创建失败')
    }
  },

  // 兑换奖励
  redeemReward: async (userId: string, rewardId: string) => {
    let reward = get().rewards.find(r => r.id === rewardId)
    if (!reward) {
      try {
        const local = localStorage.getItem(`dreweave_user_rewards_${userId}`)
        const list: Reward[] = local ? JSON.parse(local) : []
        reward = list.find(r => r.id === rewardId) as any
      } catch {}
      if (!reward) {
        toast.error('奖励不存在')
        return false
      }
    }
    
    if (reward.is_redeemed) {
      toast.error('奖励已兑换')
      return false
    }
    
    // 检查余额
    if (get().coins < reward.cost) {
      toast.error('织梦豆余额不足')
      return false
    }
    
    set({ isLoading: true, error: null })
    
    try {
      // 扣除虚拟币
      const spendSuccess = await get().spendCoins(userId, reward.cost, `兑换奖励：${reward.title}`)
      
      if (!spendSuccess) {
        return false
      }
      
      try {
        await rewardApi.redeemReward(userId, rewardId)
      } catch {}

      const updated = get().rewards.map(r => r.id === rewardId ? { ...r, is_redeemed: true, redeemed_at: new Date().toISOString() } : r)
      set({
        rewards: updated,
        isLoading: false
      })

      try {
        localStorage.setItem(`dreweave_user_rewards_${userId}`, JSON.stringify(updated))
      } catch {}
      
      toast.success(`成功兑换：${reward.title}！`, {
        description: '享受你的奖励吧！',
        duration: 5000
      })
      
      return true
    } catch (error: any) {
      set({
        error: error.message || '兑换奖励失败',
        isLoading: false
      })
      toast.error('兑换失败')
      return false
    }
  },

  // 完成任务
  completeTask: async (userId: string, taskId: string) => {
    const task = get().availableTasks.find(t => t.id === taskId)
    if (!task) {
      toast.error('任务不存在')
      return
    }
    
    if (task.is_completed) {
      toast.error('任务已完成')
      return
    }
    
    const canComplete = validateTaskCompletion(taskId, userId)
    
    set({ isLoading: true, error: null })
    
    try {
      if (!canComplete) {
        set({ isLoading: false })
        toast.error('任务未完成条件，无法领取奖励')
        return
      }

      await get().earnCoins(userId, task.reward, `完成任务：${task.title}`)

      const updatedTasks = get().availableTasks.map(t =>
        t.id === taskId
          ? { ...t, is_completed: true, completed_at: new Date().toISOString() }
          : t
      )

      set({ availableTasks: updatedTasks, isLoading: false })
      
      toast.success(`任务完成！获得 ${task.reward} 织梦豆`, {
        description: task.title
      })
      
      try { await get().fetchUserData(userId) } catch {}
      
    } catch (error: any) {
      set({
        error: error.message || '完成任务失败',
        isLoading: false
      })
      toast.error('操作失败')
    }
  },

  freeClaimCoins: async (userId: string, amount: number) => {
    const MAX = 3
    const COOLDOWN = 60_000
    const now = Date.now()
    const today = new Date().toISOString().split('T')[0]
    let count = get().freeClaimCountToday
    let lastAt = get().lastFreeClaimAt || 0
    try {
      const raw = localStorage.getItem(`dreweave_free_claim_${userId}_${today}`)
      if (raw) {
        const obj = JSON.parse(raw)
        count = obj.count || 0
        lastAt = obj.lastAt || 0
      }
    } catch {}

    if (count >= MAX) {
      toast.error('今日领取次数已用完')
      return false
    }
    if (now - lastAt < COOLDOWN) {
      toast.error('领取过于频繁，请稍后再试')
      return false
    }

    await get().earnCoins(userId, amount, '自由领取')
    const newCount = count + 1
    set({ freeClaimCountToday: newCount, lastFreeClaimAt: now })
    try {
      localStorage.setItem(`dreweave_free_claim_${userId}_${today}`, JSON.stringify({ count: newCount, lastAt: now }))
    } catch {}
    return true
  },

  canFreeClaim: (userId: string) => {
    const MAX = 3
    const COOLDOWN = 60_000
    const now = Date.now()
    const today = new Date().toISOString().split('T')[0]
    let count = get().freeClaimCountToday
    let lastAt = get().lastFreeClaimAt || 0
    try {
      const raw = localStorage.getItem(`dreweave_free_claim_${userId}_${today}`)
      if (raw) {
        const obj = JSON.parse(raw)
        count = obj.count || 0
        lastAt = obj.lastAt || 0
      }
    } catch {}
    if (count >= MAX) return false
    if (now - (lastAt || 0) < COOLDOWN) return false
    return true
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  }
}))

// 获取官方奖励模板
export function getOfficialRewards() {
  return officialRewards
}

export type { 
  CoinTransaction, 
  Reward, 
  Task, 
  MarketState, 
  MarketActions 
}
