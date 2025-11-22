import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useAchievementStore } from '../stores/achievementStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Progress } from '../components/ui/Progress'
import { Trophy, Star, Lock, Gift, Clock, Target, Award, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import BackToHome from '../components/BackToHome'

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

export default function Achievements() {
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'progress'>('all')
  const { user } = useAuthStore()
  const { 
    achievements, 
    userAchievements, 
    stats, 
    loading, 
    fetchAchievements, 
    fetchUserAchievements 
  } = useAchievementStore()

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await Promise.allSettled([
          fetchAchievements(),
          fetchUserAchievements(user.id)
        ])
      }
    }
    loadData()
  }, [user, fetchAchievements, fetchUserAchievements])

  const getCategoryColor = (category: string) => {
    const colors = {
      daily: 'bg-green-100 text-green-800',
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-purple-100 text-purple-800',
      special: 'bg-yellow-100 text-yellow-800',
      milestone: 'bg-red-100 text-red-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      daily: '🌱',
      weekly: '📅',
      monthly: '🌙',
      special: '⭐',
      milestone: '🏆'
    }
    return icons[category as keyof typeof icons] || '🎯'
  }

  const getRequirementTypeText = (type: string) => {
    const texts = {
      days: '天数',
      tests: '测试',
      coins: '织梦豆',
      calm_sessions: '冷静次数',
      streak: '连续天数'
    }
    return texts[type as keyof typeof texts] || '进度'
  }

  const filteredAchievements = () => {
    switch (activeTab) {
      case 'completed':
        return userAchievements.filter(ua => ua.is_completed)
      case 'progress':
        return userAchievements.filter(ua => !ua.is_completed && ua.progress > 0)
      default:
        return userAchievements
    }
  }

  const getProgressPercentage = (userAchievement: UserAchievement) => {
    return Math.min((userAchievement.progress / userAchievement.achievement.requirement) * 100, 100)
  }

  const getCompletionRate = () => {
    if (stats.total_achievements === 0) return 0
    return Math.round((stats.completed_achievements / stats.total_achievements) * 100)
  }

  if (loading && achievements.length === 0 && userAchievements.length === 0) {
    return (
      <div className="min-h-screen gradient-healing flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载成就中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-healing p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="relative mb-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-yellow-500" />
                成就系统
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">记录你的每一个成长里程碑</p>
            </div>
            {/* 移动端：固定右下角悬浮按钮 */}
            <div className="fixed bottom-20 right-4 z-50 sm:hidden">
              <BackToHome showText={false} className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300" />
            </div>
            {/* 桌面端：右上角绝对定位 */}
            <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2">
              <BackToHome />
            </div>
            <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 text-left">
              <div className="text-2xl font-bold text-gray-800">{getCompletionRate()}%</div>
              <div className="text-sm text-gray-600">完成率</div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/20 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-lavender-500" />
              <div className="text-2xl font-bold text-gray-800">{stats.completed_achievements}</div>
              <div className="text-sm text-gray-600">已完成</div>
            </Card>
            
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/20 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-mint-500" />
              <div className="text-2xl font-bold text-gray-800">{stats.total_achievements}</div>
              <div className="text-sm text-gray-600">总成就数</div>
            </Card>
            
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/20 text-center">
              <Gift className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold text-gray-800">{stats.total_coins_earned}</div>
              <div className="text-sm text-gray-600">获得织梦豆</div>
            </Card>
            
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/20 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-sky-500" />
              <div className="text-2xl font-bold text-gray-800">
                {stats.next_achievement ? '进行中' : '全部完成'}
              </div>
              <div className="text-sm text-gray-600">当前状态</div>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-lavender-400 to-lavender-500 text-white shadow-lg'
                  : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white/90'
              }`}
            >
              全部成就
            </button>
            
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-mint-400 to-mint-500 text-white shadow-lg'
                  : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white/90'
              }`}
            >
              已完成
            </button>
            
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'progress'
                  ? 'bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-lg'
                  : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white/90'
              }`}
            >
              进行中
            </button>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements().map((userAchievement) => {
            const { achievement, progress, is_completed, completed_at } = userAchievement
            const progressPercentage = getProgressPercentage(userAchievement)
            
            return (
              <Card 
                key={achievement.id} 
                className={`p-6 bg-white/80 backdrop-blur-sm border-white/20 transition-all duration-300 hover:shadow-lg ${
                  is_completed ? 'ring-2 ring-yellow-300' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(achievement.category)}>
                      {getCategoryIcon(achievement.category)} {achievement.category}
                    </Badge>
                    {achievement.is_hidden && (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {achievement.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                {!is_completed && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>进度</span>
                      <span>{progress}/{achievement.requirement} {getRequirementTypeText(achievement.requirement_type)}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}

                {/* Reward */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">奖励</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{achievement.reward_coins}</span>
                    </div>
                    <span className="text-sm text-gray-600">织梦豆</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  {is_completed ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">✓</span>
                      </div>
                      <span className="text-sm font-medium">已完成</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">进行中</span>
                    </div>
                  )}
                  
                  {completed_at && (
                    <span className="text-xs text-gray-500">
                      {new Date(completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredAchievements().length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {activeTab === 'completed' ? '暂无已完成成就' : activeTab === 'progress' ? '暂无进行中成就' : '暂无成就'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'completed' ? '继续努力，解锁更多成就！' : '开始你的治愈之旅，解锁第一个成就吧！'}
            </p>
          </div>
        )}

        {/* Next Achievement Hint */}
        {stats.next_achievement && (
          <div className="mt-8">
            <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">{stats.next_achievement.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    下一个目标：{stats.next_achievement.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {stats.next_achievement.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      需要 {stats.next_achievement.requirement} {getRequirementTypeText(stats.next_achievement.requirement_type)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-600">
                    +{stats.next_achievement.reward_coins}
                  </div>
                  <div className="text-xs text-gray-500">织梦豆</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
