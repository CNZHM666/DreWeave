import { create } from 'zustand'
import { calmingMessageApi } from '../config/supabase'
import { calmingMessages, breathingAnimations, musicRecommendations } from '../data/calmingData'
import { toast } from 'sonner'
import { useAchievementStore } from './achievementStore'
import { emergencyNetworkBypass } from '../utils/emergencyNetworkBypass'

// 治愈消息状态接口
interface CalmingMessage {
  id: number
  message: string
  breathing: string
  category: string
}

// 呼吸引导状态接口
interface BreathingPhase {
  name: string
  duration: number
  color: string
}

interface BreathingAnimation {
  id: number
  name: string
  description: string
  phases: BreathingPhase[]
}

// 音乐推荐接口
interface MusicRecommendation {
  id: number
  title: string
  description: string
  type: string
  duration: string
  mood: string
}

// 治愈空间状态接口
interface CalmingState {
  currentMessage: CalmingMessage | null
  isBreathing: boolean
  currentBreathingPhase: number
  breathingAnimation: BreathingAnimation | null
  isLoading: boolean
  error: string | null
}

// 治愈空间操作接口
interface CalmingActions {
  getRandomMessage: () => Promise<void>
  startBreathing: (animation: BreathingAnimation) => void
  stopBreathing: () => void
  nextBreathingPhase: () => void
  startBreathingCycle: () => void
  clearError: () => void
}

// 治愈空间存储类型
interface CalmingStore extends CalmingState, CalmingActions {}

// 创建治愈空间状态管理
export const useCalmingStore = create<CalmingStore>()((set, get) => ({
  currentMessage: null,
  isBreathing: false,
  currentBreathingPhase: 0,
  breathingAnimation: null,
  isLoading: false,
  error: null,

  // 获取随机治愈消息
  getRandomMessage: async () => {
    set({ isLoading: true, error: null })
    try {
      // 优先从数据库获取，如果没有则使用本地数据
      let message: CalmingMessage | null = null
      
      try {
        // 检查网络状态，避免在网络问题时报错
        const isOnline = navigator.onLine || emergencyNetworkBypass.isForceOnline()
        if (isOnline) {
          message = await calmingMessageApi.getRandomMessage()
        } else {
          throw new Error('网络不可用，使用本地数据')
        }
      } catch (error: any) {
        // 如果数据库获取失败，使用本地数据
        console.log('📝 使用本地治愈消息数据')
        const randomIndex = Math.floor(Math.random() * calmingMessages.length)
        message = calmingMessages[randomIndex]
      }
      
      set({
        currentMessage: message,
        isLoading: false
      })
      
      if (message) {
        toast.success('找到一条治愈消息 ✨', {
          description: message.message,
          duration: 5000
        })
      }
    } catch (error: any) {
      set({
        error: error.message || '获取治愈消息失败',
        isLoading: false
      })
      toast.error('获取治愈消息失败')
    }
  },

  // 开始呼吸引导
  startBreathing: (animation: BreathingAnimation) => {
    set({
      isBreathing: true,
      currentBreathingPhase: 0,
      breathingAnimation: animation,
      error: null
    })
    
    // 开始呼吸循环
    get().startBreathingCycle()
  },

  // 停止呼吸引导
  stopBreathing: () => {
    set({
      isBreathing: false,
      currentBreathingPhase: 0,
      breathingAnimation: null
    })
    
    // 更新成就进度（假设用户完成了一次呼吸练习）
    // 这里需要一个用户ID，我们会在组件中处理这个
  },

  // 下一呼吸阶段
  nextBreathingPhase: () => {
    const { breathingAnimation, currentBreathingPhase } = get()
    
    if (!breathingAnimation) return
    
    const nextPhase = (currentBreathingPhase + 1) % breathingAnimation.phases.length
    
    set({
      currentBreathingPhase: nextPhase
    })
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  },

  // 呼吸引导循环
  startBreathingCycle: () => {
    const { breathingAnimation, isBreathing } = get()
    
    if (!breathingAnimation || !isBreathing) return
    
    const currentPhase = breathingAnimation.phases[get().currentBreathingPhase]
    
    // 设置定时器切换到下一阶段
    setTimeout(() => {
      const { isBreathing: stillBreathing } = get()
      if (stillBreathing) {
        get().nextBreathingPhase()
        get().startBreathingCycle() // 递归调用继续循环
      }
    }, currentPhase.duration)
  }
}))



// 获取音乐推荐
export function getMusicRecommendations(mood?: string): MusicRecommendation[] {
  if (!mood) {
    return musicRecommendations
  }
  
  return musicRecommendations.filter(music => music.mood === mood)
}

// 获取呼吸引导动画
export function getBreathingAnimations(): BreathingAnimation[] {
  return breathingAnimations
}

// 获取治愈消息
export function getCalmingMessages(): CalmingMessage[] {
  return calmingMessages
}

export type { 
  CalmingMessage, 
  BreathingAnimation, 
  BreathingPhase, 
  MusicRecommendation,
  CalmingState, 
  CalmingActions 
}