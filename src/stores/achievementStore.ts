import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../config/supabase'
import { TABLES } from '../config/supabase'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'daily' | 'weekly' | 'monthly' | 'special' | 'milestone'
  requirement: number
  requirement_type: 'days' | 'tests' | 'coins' | 'calm_sessions' | 'streak'
  reward_coins: number
  is_hidden: boolean
  created_at: string
}

interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  progress: number
  is_completed: boolean
  completed_at: string | null
  achievement: Achievement
}

interface AchievementStats {
  total_achievements: number
  completed_achievements: number
  total_coins_earned: number
  next_achievement: Achievement | null
}

interface AchievementStore {
  achievements: Achievement[]
  userAchievements: UserAchievement[]
  stats: AchievementStats
  loading: boolean
  error: string | null
  
  // Actions
  fetchAchievements: () => Promise<void>
  fetchUserAchievements: (userId: string) => Promise<void>
  updateProgress: (userId: string, requirementType: string, value: number) => Promise<void>
  checkAchievements: (userId: string) => Promise<void>
  getAchievementsByCategory: (category: string) => Achievement[]
  getRecentAchievements: (limit: number) => UserAchievement[]
  grantAchievementReward: (userId: string, achievement: Achievement) => Promise<void>
}

// 官方成就定义
const OFFICIAL_ACHIEVEMENTS: Omit<Achievement, 'id' | 'created_at'>[] = [
  // 每日成就
  {
    title: '初次打卡',
    description: '完成第一次每日打卡',
    icon: '🌱',
    category: 'daily',
    requirement: 1,
    requirement_type: 'days',
    reward_coins: 10,
    is_hidden: false
  },
  {
    title: '坚持一周',
    description: '连续打卡7天',
    icon: '🌿',
    category: 'daily',
    requirement: 7,
    requirement_type: 'streak',
    reward_coins: 50,
    is_hidden: false
  },
  {
    title: '月度坚持',
    description: '连续打卡30天',
    icon: '🌳',
    category: 'daily',
    requirement: 30,
    requirement_type: 'streak',
    reward_coins: 200,
    is_hidden: false
  },
  
  // 测试成就
  {
    title: '自我探索者',
    description: '完成第一次心理测试',
    icon: '🔍',
    category: 'special',
    requirement: 1,
    requirement_type: 'tests',
    reward_coins: 20,
    is_hidden: false
  },
  {
    title: '心理专家',
    description: '完成10次心理测试',
    icon: '🧠',
    category: 'special',
    requirement: 10,
    requirement_type: 'tests',
    reward_coins: 100,
    is_hidden: false
  },
  
  // 冷静空间成就
  {
    title: '冷静时刻',
    description: '第一次使用冷静空间',
    icon: '❄️',
    category: 'special',
    requirement: 1,
    requirement_type: 'calm_sessions',
    reward_coins: 15,
    is_hidden: false
  },
  {
    title: '情绪管理大师',
    description: '使用冷静空间50次',
    icon: '🧘',
    category: 'milestone',
    requirement: 50,
    requirement_type: 'calm_sessions',
    reward_coins: 150,
    is_hidden: false
  },
  
  // 织梦豆成就
  {
    title: '初获织梦豆',
    description: '获得第一枚织梦豆',
    icon: '🪙',
    category: 'special',
    requirement: 1,
    requirement_type: 'coins',
    reward_coins: 5,
    is_hidden: false
  },
  {
    title: '织梦小富翁',
    description: '累计获得500织梦豆',
    icon: '💰',
    category: 'milestone',
    requirement: 500,
    requirement_type: 'coins',
    reward_coins: 100,
    is_hidden: false
  },
  {
    title: '织梦大亨',
    description: '累计获得1000织梦豆',
    icon: '💎',
    category: 'milestone',
    requirement: 1000,
    requirement_type: 'coins',
    reward_coins: 300,
    is_hidden: false
  },
  
  // 隐藏成就
  {
    title: '神秘探索者',
    description: '发现隐藏成就的秘密',
    icon: '🔮',
    category: 'special',
    requirement: 1,
    requirement_type: 'days',
    reward_coins: 50,
    is_hidden: true
  }
]

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      achievements: [],
      userAchievements: [],
      stats: {
        total_achievements: 0,
        completed_achievements: 0,
        total_coins_earned: 0,
        next_achievement: null
      },
      loading: false,
      error: null,

      fetchAchievements: async () => {
        const hadCache = get().achievements.length > 0
        if (!hadCache) set({ loading: true, error: null })
        try {
          const { data, error } = await supabase
            .from(TABLES.ACHIEVEMENTS)
            .select('*')
            .order('category', { ascending: true })
            .order('requirement', { ascending: true })

          if (error) throw error

          set({ achievements: data || [], loading: false })
        } catch (error: any) {
          console.debug('Error fetching achievements:', error)
          // 若无缓存，使用本地官方成就作为回退，保证页面即时可用
          if (!hadCache) {
            const fallback = OFFICIAL_ACHIEVEMENTS.map((a, idx) => ({
              id: `offline_${idx}`,
              created_at: new Date().toISOString(),
              ...a
            })) as Achievement[]
            set({ achievements: fallback, error: '获取成就列表失败', loading: false })
          } else {
            set({ error: '获取成就列表失败', loading: false })
          }
        }
      },

      fetchUserAchievements: async (userId: string) => {
        try {
          const state: any = get()
          const now = Date.now()
          if (state.loading) return
          if (state._lastUserFetchAt && now - state._lastUserFetchAt < 1200) return
          state._lastUserFetchAt = now
        } catch (error: any) {}
        const hadCache = get().userAchievements.length > 0
        if (!hadCache) set({ loading: true, error: null })
        try {
          const { data, error } = await supabase
            .from(TABLES.USER_ACHIEVEMENTS)
            .select(`
              *,
              achievement:achievements(*)
            `)
            .eq('user_id', userId)

          if (error) throw error

          const userAchievements = data || []
          const completedAchievements = userAchievements.filter(ua => ua.is_completed).length
          const totalCoinsEarned = userAchievements
            .filter(ua => ua.is_completed)
            .reduce((sum, ua) => sum + ua.achievement.reward_coins, 0)

          // 找到下一个可完成的成就
          const nextAchievement = get().achievements.find(achievement => {
            const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
            return !userAchievement || !userAchievement.is_completed
          })

          set({ 
            userAchievements, 
            stats: {
              total_achievements: get().achievements.length,
              completed_achievements: completedAchievements,
              total_coins_earned: totalCoinsEarned,
              next_achievement: nextAchievement || null
            },
            loading: false 
          })
        } catch (error: any) {
          console.debug('Error fetching user achievements:', error)
          set({ error: '获取用户成就失败', loading: false })
        }
      },

      updateProgress: async (userId: string, requirementType: string, value: number) => {
        const { userAchievements, achievements } = get()
        
        // 找到相关的成就
        const relevantAchievements = achievements.filter(
          achievement => achievement.requirement_type === requirementType
        )

        for (const achievement of relevantAchievements) {
          const userAchievement = userAchievements.find(
            ua => ua.achievement_id === achievement.id
          )

          if (!userAchievement || !userAchievement.is_completed) {
            const currentProgress = userAchievement?.progress || 0
            const newProgress = Math.min(currentProgress + value, achievement.requirement)

            try {
              if (userAchievement) {
                // 更新现有进度
                const { error } = await supabase
                  .from(TABLES.USER_ACHIEVEMENTS)
                  .update({ 
                    progress: newProgress,
                    is_completed: newProgress >= achievement.requirement,
                    completed_at: newProgress >= achievement.requirement ? new Date().toISOString() : null
                  })
                  .eq('id', userAchievement.id)

                if (error) throw error
              } else {
                // 创建新的用户成就记录
                const { error } = await supabase
                  .from(TABLES.USER_ACHIEVEMENTS)
                  .insert({
                    user_id: userId,
                    achievement_id: achievement.id,
                    progress: newProgress,
                    is_completed: newProgress >= achievement.requirement,
                    completed_at: newProgress >= achievement.requirement ? new Date().toISOString() : null
                  })

                if (error) throw error
              }

              // 如果成就完成了，发放奖励
              if (newProgress >= achievement.requirement && !userAchievement?.is_completed) {
                await get().grantAchievementReward(userId, achievement)
              }
            } catch (error: any) {
              console.debug(`Error updating progress for achievement ${achievement.id}:`, error)
            }
          }
        }

        // 重新获取用户成就数据
        await get().fetchUserAchievements(userId)
      },

      grantAchievementReward: async (userId: string, achievement: Achievement) => {
        try {
          // 发放织梦豆奖励
          const { error: coinError } = await supabase
            .from(TABLES.COINS)
            .insert({
              user_id: userId,
              amount: achievement.reward_coins,
              type: 'earn',
              description: `完成成就: ${achievement.title}`,
              created_at: new Date().toISOString()
            })

          if (coinError) throw coinError

          // 这里可以添加通知逻辑
          console.log(`Achievement completed: ${achievement.title} - Reward: ${achievement.reward_coins} coins`)
        } catch (error: any) {
          console.debug('Error granting achievement reward:', error)
        }
      },

      checkAchievements: async (userId: string) => {
        await get().fetchUserAchievements(userId)
      },

      getAchievementsByCategory: (category: string) => {
        return get().achievements.filter(achievement => achievement.category === category)
      },

      getRecentAchievements: (limit: number) => {
        return get().userAchievements
          .filter(ua => ua.is_completed)
          .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
          .slice(0, limit)
      }
    }),
    {
      name: 'achievement-store',
      partialize: (state) => ({
        achievements: state.achievements,
        userAchievements: state.userAchievements,
        stats: state.stats
      })
    }
  )
)
