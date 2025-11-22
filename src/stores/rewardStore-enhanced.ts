import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { rewardApi, coinApi } from '../config/supabase'
import { toast } from 'sonner'

interface Reward {
  id: string
  user_id: string
  title: string
  description: string
  coins: number
  type: 'custom' | 'achievement' | 'daily' | 'special'
  is_redeemed: boolean
  redeemed_at: string | null
  created_at: string
  expires_at?: string
  priority: 'low' | 'medium' | 'high'
  category?: string
}

interface RewardStore {
  rewards: Reward[]
  availableRewards: Reward[]
  redeemedRewards: Reward[]
  expiredRewards: Reward[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchRewards: (userId: string) => Promise<void>
  createCustomReward: (userId: string, rewardData: Partial<Reward>) => Promise<Reward | null>
  redeemReward: (userId: string, rewardId: string) => Promise<boolean>
  checkExpiredRewards: () => void
  getRewardById: (rewardId: string) => Reward | undefined
  getRewardsByType: (type: Reward['type']) => Reward[]
  getRewardsByCategory: (category: string) => Reward[]
  refreshRewards: (userId: string) => Promise<void>
  
  // 奖励通知相关
  showRewardNotification: (reward: Reward) => void
  clearRewardNotification: (rewardId: string) => void
  getLocalRewards: (userId: string) => Reward[]
  saveLocalReward: (reward: Reward) => void
  updateLocalReward: (reward: Reward) => void
}

// 创建奖励存储 - 增强版本
export const useRewardStore = create<RewardStore>()(
  persist(
    (set, get) => ({
      rewards: [],
      availableRewards: [],
      redeemedRewards: [],
      expiredRewards: [],
      loading: false,
      error: null,

      // 获取用户奖励
      fetchRewards: async (userId: string) => {
        set({ loading: true, error: null })
        
        try {
          console.log('🎁 开始获取用户奖励...')
          
          // 从数据库获取奖励
          const dbRewards = await rewardApi.getUserRewards(userId)
          console.log('📊 数据库奖励:', dbRewards)
          
          // 获取本地存储的奖励（离线模式）
          const localRewards = get().getLocalRewards(userId)
          console.log('📊 本地奖励:', localRewards)
          
          // 合并奖励
          const allRewards = [...dbRewards, ...localRewards]
          
          // 分类奖励
          const now = new Date()
          const available = allRewards.filter(r => !r.is_redeemed && (!r.expires_at || new Date(r.expires_at) > now))
          const redeemed = allRewards.filter(r => r.is_redeemed)
          const expired = allRewards.filter(r => !r.is_redeemed && r.expires_at && new Date(r.expires_at) <= now)
          
          console.log('📊 奖励分类:', {
            total: allRewards.length,
            available: available.length,
            redeemed: redeemed.length,
            expired: expired.length
          })
          
          set({
            rewards: allRewards,
            availableRewards: available,
            redeemedRewards: redeemed,
            expiredRewards: expired,
            loading: false
          })
          
          // 检查新奖励并显示通知
          available.forEach(reward => {
            if (isNewReward(reward)) {
              get().showRewardNotification(reward)
            }
          })
          
        } catch (error: any) {
          console.error('❌ 获取奖励失败:', error)
          set({ 
            error: '获取奖励失败',
            loading: false 
          })
          
          // 使用本地数据作为回退
          const localRewards = get().getLocalRewards(userId)
          set({
            rewards: localRewards,
            availableRewards: localRewards.filter(r => !r.is_redeemed),
            redeemedRewards: localRewards.filter(r => r.is_redeemed),
            expiredRewards: [],
            loading: false
          })
        }
      },

      // 创建自定义奖励
      createCustomReward: async (userId: string, rewardData: Partial<Reward>) => {
        set({ loading: true, error: null })
        
        try {
          console.log('🎁 创建自定义奖励...', rewardData)
          
          // 验证奖励数据
          if (!rewardData.title || !rewardData.description || !rewardData.coins) {
            throw new Error('奖励信息不完整')
          }
          
          // 创建奖励对象
          const newReward: Omit<Reward, 'id' | 'created_at'> = {
            user_id: userId,
            title: rewardData.title,
            description: rewardData.description,
            coins: rewardData.coins,
            type: rewardData.type || 'custom',
            is_redeemed: false,
            redeemed_at: null,
            priority: rewardData.priority || 'medium',
            category: rewardData.category || 'general',
            expires_at: rewardData.expires_at || undefined
          }
          
          let createdReward: Reward
          
          try {
            // 尝试保存到数据库
            createdReward = await rewardApi.createReward(userId, newReward)
            console.log('✅ 数据库奖励创建成功:', createdReward)
          } catch (dbError) {
            console.warn('⚠️ 数据库保存失败，使用本地存储:', dbError)
            // 数据库失败时使用本地存储
            createdReward = {
              ...newReward,
              id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString()
            }
            
            // 保存到本地存储
            get().saveLocalReward(createdReward)
          }
          
          // 更新状态
          const { rewards, availableRewards } = get()
          const updatedRewards = [...rewards, createdReward]
          const updatedAvailable = [...availableRewards, createdReward]
          
          set({
            rewards: updatedRewards,
            availableRewards: updatedAvailable,
            loading: false
          })
          
          // 显示创建成功通知
          toast.success('奖励创建成功！', {
            description: `${createdReward.title} - ${createdReward.coins} 织梦豆`,
            duration: 4000
          })
          
          // 显示奖励通知
          get().showRewardNotification(createdReward)
          
          return createdReward
          
        } catch (error: any) {
          console.error('❌ 创建奖励失败:', error)
          set({ 
            error: error instanceof Error ? error.message : '创建奖励失败',
            loading: false 
          })
          
          toast.error('创建奖励失败', {
            description: error instanceof Error ? error.message : '请稍后重试'
          })
          
          return null
        }
      },

      // 兑换奖励
      redeemReward: async (userId: string, rewardId: string) => {
        set({ loading: true, error: null })
        
        try {
          const reward = get().rewards.find(r => r.id === rewardId)
          if (!reward) {
            throw new Error('奖励不存在')
          }
          
          if (reward.is_redeemed) {
            throw new Error('奖励已兑换')
          }
          
          if (reward.expires_at && new Date(reward.expires_at) <= new Date()) {
            throw new Error('奖励已过期')
          }
          
          console.log('💰 兑换奖励:', reward)
          
          let updatedReward: Reward
          
          try {
            // 尝试在数据库中兑换
            updatedReward = await rewardApi.redeemReward(userId, rewardId)
            console.log('✅ 数据库兑换成功:', updatedReward)
          } catch (dbError) {
            console.warn('⚠️ 数据库兑换失败，更新本地状态:', dbError)
            // 数据库失败时更新本地状态
            updatedReward = {
              ...reward,
              is_redeemed: true,
              redeemed_at: new Date().toISOString()
            }
            
            // 更新本地存储
            get().updateLocalReward(updatedReward)
          }
          
          // 给用户添加织梦豆
          try {
            await coinApi.addCoinTransaction(userId, reward.coins, 'earn', `兑换奖励: ${reward.title}`)
            console.log('✅ 织梦豆添加成功:', reward.coins)
          } catch (coinError) {
            console.error('❌ 织梦豆添加失败:', coinError)
            // 不影响奖励兑换，继续执行
          }
          
          // 更新状态
          const { rewards } = get()
          const updatedRewards = rewards.map(r => r.id === rewardId ? updatedReward : r)
          
          set({
            rewards: updatedRewards,
            availableRewards: updatedRewards.filter(r => !r.is_redeemed && (!r.expires_at || new Date(r.expires_at) > new Date())),
            redeemedRewards: updatedRewards.filter(r => r.is_redeemed),
            loading: false
          })
          
          // 显示兑换成功通知
          toast.success('奖励兑换成功！', {
            description: `获得 ${reward.coins} 织梦豆`,
            duration: 4000
          })
          
          return true
          
        } catch (error: any) {
          console.error('❌ 兑换奖励失败:', error)
          set({ 
            error: error instanceof Error ? error.message : '兑换奖励失败',
            loading: false 
          })
          
          toast.error('兑换奖励失败', {
            description: error instanceof Error ? error.message : '请稍后重试'
          })
          
          return false
        }
      },

      // 检查过期奖励
      checkExpiredRewards: () => {
        const { rewards } = get()
        const now = new Date()
        
        const expired = rewards.filter(r => 
          !r.is_redeemed && r.expires_at && new Date(r.expires_at) <= now
        )
        
        if (expired.length > 0) {
          set({
            expiredRewards: expired
          })
          
          // 显示过期通知
          expired.forEach(reward => {
            toast.warning('奖励已过期', {
              description: `${reward.title} 已过期，无法兑换`,
              duration: 5000
            })
          })
        }
      },

      // 获取奖励详情
      getRewardById: (rewardId: string) => {
        return get().rewards.find(r => r.id === rewardId)
      },

      // 按类型获取奖励
      getRewardsByType: (type: Reward['type']) => {
        return get().rewards.filter(r => r.type === type)
      },

      // 按分类获取奖励
      getRewardsByCategory: (category: string) => {
        return get().rewards.filter(r => r.category === category)
      },

      // 刷新奖励
      refreshRewards: async (userId: string) => {
        await get().fetchRewards(userId)
        get().checkExpiredRewards()
      },

      // 显示奖励通知
      showRewardNotification: (reward: Reward) => {
        // 使用更醒目的通知
        toast.success('🎁 获得新奖励！', {
          description: `${reward.title} - ${reward.coins} 织梦豆`,
          duration: 5000,
          position: 'top-center'
        })
      },

      // 清除奖励通知
      clearRewardNotification: (rewardId: string) => {
        // 这里可以实现清除特定奖励通知的逻辑
        console.log('清除奖励通知:', rewardId)
      },

      // 本地存储辅助方法
      getLocalRewards: (userId: string): Reward[] => {
        try {
          const key = `rewards_${userId}`
          const stored = localStorage.getItem(key)
          return stored ? JSON.parse(stored) : []
        } catch (error: any) {
          console.debug('读取本地奖励失败:', error)
          return []
        }
      },

      saveLocalReward: (reward: Reward) => {
        try {
          const key = `rewards_${reward.user_id}`
          const existing = get().getLocalRewards(reward.user_id)
          const updated = [...existing, reward]
          localStorage.setItem(key, JSON.stringify(updated))
        } catch (error: any) {
          console.debug('保存本地奖励失败:', error)
        }
      },

      updateLocalReward: (updatedReward: Reward) => {
        try {
          const key = `rewards_${updatedReward.user_id}`
          const existing = get().getLocalRewards(updatedReward.user_id)
          const updated = existing.map(r => r.id === updatedReward.id ? updatedReward : r)
          localStorage.setItem(key, JSON.stringify(updated))
        } catch (error: any) {
          console.debug('更新本地奖励失败:', error)
        }
      }
    }),
    {
      name: 'reward-store',
      partialize: (state) => ({
        // 不持久化加载状态和错误
        rewards: state.rewards,
        availableRewards: state.availableRewards,
        redeemedRewards: state.redeemedRewards,
        expiredRewards: state.expiredRewards
      })
    }
  )
)

// 辅助函数：判断是否为新的奖励
function isNewReward(reward: Reward): boolean {
  const now = new Date()
  const createdAt = new Date(reward.created_at)
  const timeDiff = now.getTime() - createdAt.getTime()
  
  // 如果在5分钟内创建的奖励，认为是新的
  return timeDiff < 5 * 60 * 1000
}