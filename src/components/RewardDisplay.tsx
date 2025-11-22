import React, { useState, useEffect } from 'react'
import { useRewardStore } from '../stores/rewardStore-enhanced'
import { useAuthStore } from '../stores/authStore'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Gift, Coins, Clock, CheckCircle, Plus, History, Star } from 'lucide-react'
import { toast } from 'sonner'

interface RewardDisplayProps {
  onClose?: () => void
  showHistory?: boolean
}

const RewardDisplay: React.FC<RewardDisplayProps> = ({ onClose, showHistory = false }) => {
  const { user } = useAuthStore()
  const {
    availableRewards,
    redeemedRewards,
    expiredRewards,
    fetchRewards,
    redeemReward,
    loading
  } = useRewardStore()

  const [activeTab, setActiveTab] = useState<'available' | 'redeemed' | 'expired'>(
    showHistory ? 'redeemed' : 'available'
  )
  const [selectedReward, setSelectedReward] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      fetchRewards(user.id)
    }
  }, [user?.id])

  const handleRedeemReward = async (reward: any) => {
    if (!user?.id) {
      toast.error('请先登录')
      return
    }

    try {
      const success = await redeemReward(user.id, reward.id)
      if (success) {
        toast.success('🎉 奖励兑换成功！', {
          description: `获得 ${reward.coins} 织梦豆`,
          duration: 4000
        })
      }
    } catch (error: any) {
      toast.error('兑换失败，请稍后重试')
    }
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Star className="w-5 h-5 text-yellow-500" />
      case 'daily':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'special':
        return <Gift className="w-5 h-5 text-purple-500" />
      default:
        return <Gift className="w-5 h-5 text-green-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCurrentTabRewards = () => {
    switch (activeTab) {
      case 'available':
        return availableRewards
      case 'redeemed':
        return redeemedRewards
      case 'expired':
        return expiredRewards
      default:
        return availableRewards
    }
  }

  const currentRewards = getCurrentTabRewards()

  if (loading) {
    return (
      <div className="min-h-screen gradient-healing p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800">加载奖励中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-healing p-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="relative mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gift className="w-8 h-8 text-purple-500" />
              <h1 className="text-4xl font-bold text-blue-900">我的奖励</h1>
            </div>
            <p className="text-xl text-blue-800">查看和管理您的所有奖励</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 btn-secondary"
            >
              返回
            </button>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-light border-0">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-6 h-6 text-green-500" />
                <div className="text-3xl font-bold text-green-600">{availableRewards.length}</div>
              </div>
              <div className="text-blue-800">可兑换奖励</div>
            </div>
          </Card>
          
          <Card className="glass-light border-0">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6 text-blue-500" />
                <div className="text-3xl font-bold text-blue-600">{redeemedRewards.length}</div>
              </div>
              <div className="text-blue-800">已兑换奖励</div>
            </div>
          </Card>
          
          <Card className="glass-light border-0">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-6 h-6 text-yellow-500" />
                <div className="text-3xl font-bold text-yellow-600">
                  {availableRewards.reduce((sum, reward) => sum + reward.coins, 0)}
                </div>
              </div>
              <div className="text-blue-800">可获织梦豆</div>
            </div>
          </Card>
        </div>

        {/* 标签页 */}
        <div className="glass rounded-2xl p-2 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'available'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                  : 'text-blue-800 hover:bg-white hover:bg-opacity-20'
              }`}
            >
              <Gift className="w-4 h-4" />
              可兑换 ({availableRewards.length})
            </button>
            
            <button
              onClick={() => setActiveTab('redeemed')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'redeemed'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-blue-800 hover:bg-white hover:bg-opacity-20'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              已兑换 ({redeemedRewards.length})
            </button>
            
            <button
              onClick={() => setActiveTab('expired')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'expired'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                  : 'text-blue-800 hover:bg-white hover:bg-opacity-20'
              }`}
            >
              <Clock className="w-4 h-4" />
              已过期 ({expiredRewards.length})
            </button>
          </div>
        </div>

        {/* 奖励列表 */}
        {currentRewards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {activeTab === 'available' ? '🎁' : activeTab === 'redeemed' ? '✅' : '⏰'}
            </div>
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              {activeTab === 'available' ? '暂无可兑换奖励' : 
               activeTab === 'redeemed' ? '暂无已兑换奖励' : '暂无过期奖励'}
            </h3>
            <p className="text-blue-700 mb-4">
              {activeTab === 'available' ? '完成测试和签到可以获得奖励！' :
               activeTab === 'redeemed' ? '您兑换的奖励将显示在这里' : '过期的奖励将显示在这里'}
            </p>
            {activeTab === 'available' && (
              <Button onClick={() => window.location.href = '/test-center'} className="btn-healing">
                去获取奖励
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentRewards.map((reward) => (
              <Card key={reward.id} className="glass border-0 hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  {/* 奖励头部 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getRewardIcon(reward.type)}
                      <Badge className={`text-xs ${getPriorityColor(reward.priority || 'medium')}`}>
                        {reward.priority === 'high' ? '高优先级' : 
                         reward.priority === 'medium' ? '中优先级' : '低优先级'}
                      </Badge>
                    </div>
                    <Badge variant="default" className="text-xs">
                      {reward.type === 'custom' ? '自定义' :
                       reward.type === 'achievement' ? '成就' :
                       reward.type === 'daily' ? '每日' : '特殊'}
                    </Badge>
                  </div>

                  {/* 奖励内容 */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">{reward.title}</h3>
                    <p className="text-blue-700 text-sm mb-3">{reward.description}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-yellow-600">{reward.coins} 织梦豆</span>
                    </div>

                    {reward.expires_at && (
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <Clock className="w-3 h-3" />
                        有效期至: {new Date(reward.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* 奖励操作 */}
                  <div className="flex gap-2">
                    {activeTab === 'available' && (
                      <Button
                        onClick={() => handleRedeemReward(reward)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                        size="md"
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        兑换
                      </Button>
                    )}
                    
                    {activeTab === 'redeemed' && reward.redeemed_at && (
                      <div className="flex-1 text-center text-sm text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        已兑换于 {new Date(reward.redeemed_at).toLocaleDateString()}
                      </div>
                    )}
                    
                    {activeTab === 'expired' && (
                      <div className="flex-1 text-center text-sm text-red-600 font-medium">
                        <Clock className="w-4 h-4 inline mr-1" />
                        已过期
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RewardDisplay