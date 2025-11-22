import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import VirtualList from '../components/VirtualList'
import { useMarketStore } from '../stores/marketStore'
import { useAuthStore } from '../stores/authStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Coins, Gift, Plus, Check, Clock, Star } from 'lucide-react'
import { toast } from 'sonner'
import BackToHome from '../components/BackToHome'

interface Task {
  id: string
  title: string
  description: string
  reward: number
  type: 'daily' | 'weekly' | 'special'
  is_completed: boolean
}

interface Reward {
  id: string
  title: string
  description: string
  cost: number
  category: 'entertainment' | 'food' | 'shopping' | 'self_care'
  creator: 'official' | 'user'
}

export default function Market() {
  const [activeTab, setActiveTab] = useState<'earn' | 'redeem'>('earn')
  const [showCreateReward, setShowCreateReward] = useState(false)
  const [newReward, setNewReward] = useState({ title: '', description: '', cost: 10, category: 'entertainment' as const })
  
  const { user } = useAuthStore()
  const { 
    coins: balance, 
    transactions, 
    rewards: userRewards, 
    availableTasks,
    isLoading: loading,
    fetchUserData: fetchMarketData,
    earnCoins,
    spendCoins,
    createReward,
    redeemReward,
    completeTask,
    freeClaimCoins,
    canFreeClaim
  } = useMarketStore()

  // 使用存储中的任务，避免ID不一致造成校验失效

  const dailyTasks = React.useMemo(() => availableTasks.filter(t => t.type === 'daily'), [availableTasks])
  const specialTasks = React.useMemo(() => availableTasks.filter(t => t.type !== 'daily'), [availableTasks])

  

  const officialRewards: Reward[] = [
    {
      id: 'official_1',
      title: '音乐时光',
      description: '享受30分钟的音乐放松时间',
      cost: 20,
      category: 'entertainment',
      creator: 'official'
    },
    {
      id: 'official_2',
      title: '甜品奖励',
      description: '品尝一份喜欢的甜品',
      cost: 30,
      category: 'food',
      creator: 'official'
    },
    {
      id: 'official_3',
      title: '购物时光',
      description: '购买一件心仪的小物品',
      cost: 100,
      category: 'shopping',
      creator: 'official'
    },
    {
      id: 'official_4',
      title: '自我关怀',
      description: '享受一次按摩或SPA',
      cost: 80,
      category: 'self_care',
      creator: 'official'
    }
  ]

  useEffect(() => {
    if (user) {
      fetchMarketData(user.id)
    }
  }, [user, fetchMarketData])

  useEffect(() => {
    if (!user) return
    const i = setInterval(() => {
      fetchMarketData(user.id)
    }, 5000)
    return () => clearInterval(i)
  }, [user, fetchMarketData])

  const [customTasks, setCustomTasks] = useState<Array<{ id: string; title: string; description: string; reward: number; is_completed: boolean; created_at: string }>>([])
  const [newCustomTask, setNewCustomTask] = useState({ title: '', description: '', reward: 5 })
  const [expandedCustomIds, setExpandedCustomIds] = useState<Record<string, boolean>>({})
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [selectedCustomTask, setSelectedCustomTask] = useState<any>(null)

  useEffect(() => {
    if (!user?.id) return
    try {
      const raw = localStorage.getItem(`dreweave_custom_tasks_${user.id}`)
      const list = raw ? JSON.parse(raw) : []
      setCustomTasks(Array.isArray(list) ? list : [])
    } catch {
      setCustomTasks([])
    }
  }, [user?.id])

  const persistCustomTasks = (list: any[]) => {
    if (!user?.id) return
    try {
      localStorage.setItem(`dreweave_custom_tasks_${user.id}`, JSON.stringify(list))
    } catch {}
  }

  const addCustomTask = () => {
    if (!user?.id) return
    if (!newCustomTask.title || !newCustomTask.description || !newCustomTask.reward || newCustomTask.reward <= 0) {
      toast.error('请填写完整的任务信息')
      return
    }
    const task = {
      id: `${Date.now()}`,
      title: newCustomTask.title.slice(0, 64),
      description: newCustomTask.description.slice(0, 200),
      reward: newCustomTask.reward,
      is_completed: false,
      created_at: new Date().toISOString()
    }
    const list = [task, ...customTasks]
    setCustomTasks(list)
    persistCustomTasks(list)
    setNewCustomTask({ title: '', description: '', reward: 5 })
    toast.success('自定义任务已创建')
  }

  const completeCustomTask = async (ct: any) => {
    if (!user?.id) return
    if (ct.completed) return
    await earnCoins(user.id, ct.reward, `自定义任务：${ct.title}`)
    const list = customTasks.map(t => t.id === ct.id ? { ...t, is_completed: true } : t)
    setCustomTasks(list)
    persistCustomTasks(list)
    await fetchMarketData(user.id)
    toast.success(`获得 ${ct.reward} 织梦豆`) 
  }

  // 检查任务完成状态（以本地任务为准）
  const checkTaskCompletion = (task: Task): boolean => {
    const mt = availableTasks.find(t => t.id === task.id)
    return mt ? mt.is_completed : task.is_completed
  }

  const handleTaskComplete = async (task: Task) => {
    if (!user) return
    
    // 检查任务是否已经完成 - 使用最新的状态检查
    const isCompleted = checkTaskCompletion(task)
    if (isCompleted) {
      toast.info('该任务已经完成过了')
      return
    }
    
    try {
      await completeTask(user.id, task.id)
      await fetchMarketData(user.id)
    } catch (error: any) {
      toast.error('任务完成失败，请重试')
    }
  }

  const getTaskRoute = (task: any) => {
    const id = task?.id
    if (id === 'checkin_daily' || id === 'consecutive_7' || id === 'consecutive_30') return '/checkin'
    if (id === 'test_weekly' || id === 'test_completion') return '/test'
    if (id === 'calm_space') return '/calm'
    return '/profile'
  }

  const openTaskDetail = (task: any) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const openCustomDetail = (ct: any) => {
    setSelectedCustomTask(ct)
    setShowCustomModal(true)
  }

  const handleRedeemReward = async (rewardId: string) => {
    if (!user) return
    
    const officialRewards = [
      {
        id: 'movie',
        title: '电影时光',
        description: '观看一部喜欢的电影',
        cost: 50,
        category: 'entertainment' as const,
        creator: 'official' as const
      },
      {
        id: 'coffee',
        title: '咖啡时光',
        description: '享受一杯精品咖啡',
        cost: 30,
        category: 'food' as const,
        creator: 'official' as const
      },
      {
        id: 'shopping',
        title: '购物基金',
        description: '存入100元到购物基金',
        cost: 100,
        category: 'shopping' as const,
        creator: 'official' as const
      },
      {
        id: 'exercise',
        title: '运动时间',
        description: '出去散步或运动30分钟',
        cost: 40,
        category: 'self_care' as const,
        creator: 'official' as const
      }
    ]
    
    // 修复用户奖励显示问题 - 正确处理用户创建的奖励
    const processedUserRewards = userRewards.map(r => ({
      ...r,
      category: 'self_care' as const,
      creator: 'user' as const,
      // 确保ID和必要字段存在
      id: r.id || `user_${r.created_at}_${Math.random().toString(36).substr(2, 9)}`,
      title: r.title || '自定义奖励',
      description: r.description || '用户创建的奖励',
      cost: r.cost || 10
    }))
    
    const allRewards = [...officialRewards, ...processedUserRewards]
    
    const reward = allRewards.find(r => r.id === rewardId)
    if (!reward) return
    
    if (balance < reward.cost) {
      toast.error('织梦豆余额不足')
      return
    }

    try {
      await redeemReward(user.id, rewardId)
      toast.success(`成功兑换 ${reward.title}！`)
    } catch (error: any) {
      toast.error('兑换失败，请重试')
    }
  }

  const handleCreateReward = async () => {
    if (!user) return
    
    if (!newReward.title || !newReward.description) {
      toast.error('请填写完整的奖励信息')
      return
    }

    try {
      // 确保包含所有必要字段
      await createReward(user.id, {
        title: newReward.title,
        description: newReward.description,
        cost: newReward.cost,
        category: newReward.category
      })
      
      // 清空表单
      setNewReward({ title: '', description: '', cost: 10, category: 'entertainment' })
      setShowCreateReward(false)
      toast.success('奖励创建成功！')
      
      // 立即刷新奖励列表
      await fetchMarketData(user.id)
      
  } catch (error: any) {
    toast.error('创建失败，请重试')
  }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      entertainment: 'bg-purple-100 text-purple-800',
      food: 'bg-orange-100 text-orange-800',
      shopping: 'bg-blue-100 text-blue-800',
      self_care: 'bg-green-100 text-green-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      entertainment: '🎵',
      food: '🍰',
      shopping: '🛍️',
      self_care: '💆'
    }
    return icons[category as keyof typeof icons] || '🎁'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-lavender-50 to-sky-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="relative mb-4">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">时间交易所</h1>
              <p className="text-gray-600 text-sm sm:text-base">通过完成任务获得织梦豆，兑换心仪的奖励</p>
            </div>
            {/* 移动端：固定右下角悬浮按钮 */}
            <div className="fixed bottom-20 right-4 z-50 sm:hidden">
              <BackToHome showText={false} className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300" />
            </div>
            {/* 桌面端：左上角绝对定位 */}
            <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2">
              <BackToHome />
            </div>
            {/* 织梦豆余额 - 移动端优化 */}
            <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-4 sm:mt-0">
              <div className="flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-2 sm:px-4 sm:py-2 border border-white/20">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                <span className="text-base sm:text-lg font-semibold text-gray-800">{balance}</span>
                <span className="text-sm text-gray-600">织梦豆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('earn')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'earn'
                ? 'bg-gradient-to-r from-mint-400 to-mint-500 text-white shadow-lg'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white/90'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Coins className="w-5 h-5" />
              <span>赚虚拟币</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('redeem')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'redeem'
                ? 'bg-gradient-to-r from-lavender-400 to-lavender-500 text-white shadow-lg'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white/90'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Gift className="w-5 h-5" />
              <span>兑奖励</span>
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'earn' && (
          <div className="space-y-6">
            

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">自定义任务</h2>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <input
                  type="text"
                  value={newCustomTask.title}
                  onChange={(e) => setNewCustomTask({ ...newCustomTask, title: e.target.value })}
                  placeholder="任务名称"
                  maxLength={64}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mint-500"
                />
                <input
                  type="text"
                  value={newCustomTask.description}
                  onChange={(e) => setNewCustomTask({ ...newCustomTask, description: e.target.value })}
                  placeholder="任务描述"
                  maxLength={200}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mint-500"
                />
                <input
                  type="number"
                  min={1}
                  value={newCustomTask.reward}
                  onChange={(e) => setNewCustomTask({ ...newCustomTask, reward: parseInt(e.target.value) || 1 })}
                  placeholder="奖励织梦豆"
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mint-500"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={addCustomTask}
                  className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600"
                >
                  添加任务
                </Button>
              </div>
              <div className="mt-4 grid gap-3">
                {customTasks.length === 0 ? (
                  <div className="text-gray-600">暂无自定义任务</div>
                ) : (
                  customTasks.map(ct => (
                    <Card key={ct.id} className="p-4 bg-white/80 backdrop-blur-sm border-white/20" onClick={() => openCustomDetail(ct)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{ct.title.length > 24 ? ct.title.slice(0,24)+'…' : ct.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{ct.description.length > 48 ? ct.description.slice(0,48)+'…' : ct.description}</p>
                          <div className="mt-1 text-sm text-gray-700">奖励 {ct.reward} 织梦豆</div>
                        </div>
                        <span className="text-xs text-gray-500">点击查看</span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
            {/* Daily Tasks */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-mint-500" />
                每日任务
              </h2>
              <div className="grid gap-4">
                {dailyTasks.map(task => {
                  const isCompleted = checkTaskCompletion(task)
                  return (
                    <Card key={task.id} className="p-4 bg-white/80 backdrop-blur-sm border-white/20" onClick={() => openTaskDetail(task)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{task.title.length > 24 ? task.title.slice(0,24)+'…' : task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{task.description.length > 48 ? task.description.slice(0,48)+'…' : task.description}</p>
                          <div className="flex items-center mt-2">
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Coins className="w-3 h-3 mr-1" />
                              +{task.reward} 织梦豆
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">点击查看</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Weekly & Special Tasks */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-lavender-500" />
                特殊任务
              </h2>
              <div className="grid gap-4">
                {specialTasks.map(task => {
                  const isCompleted = checkTaskCompletion(task)
                  return (
                    <Card key={task.id} className="p-4 bg-white/80 backdrop-blur-sm border-white/20" onClick={() => openTaskDetail(task)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{task.title.length > 24 ? task.title.slice(0,24)+'…' : task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{task.description.length > 48 ? task.description.slice(0,48)+'…' : task.description}</p>
                          <div className="flex items-center mt-2">
                            <Badge className="bg-purple-100 text-purple-800">
                              <Coins className="w-3 h-3 mr-1" />
                              +{task.reward} 织梦豆
                            </Badge>
                            <Badge className="ml-2 bg-blue-100 text-blue-800">
                              {task.type === 'weekly' ? '每周' : '特殊'}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">点击查看</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'redeem' && (
          <div className="space-y-6">
            {/* Create Reward Button */}
            <div className="text-right">
              <Button
                onClick={() => setShowCreateReward(true)}
                className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建自定义奖励
              </Button>
            </div>

            {userRewards && userRewards.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">我的自定义奖励</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {userRewards.map(reward => {
                    const safeReward = {
                      ...reward,
                      id: (reward as any).id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      title: (reward as any).title || '自定义奖励',
                      description: (reward as any).description || '用户创建的奖励',
                      cost: (reward as any).cost || 10
                    }
                    return (
                      <Card key={safeReward.id} className="p-4 bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-2xl">{getCategoryIcon((safeReward as any).category || 'self_care')}</div>
                          <Badge className="bg-gray-100 text-gray-800">自定义</Badge>
                        </div>
                        <h3 className="font-medium text-gray-800 mb-2">{safeReward.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{safeReward.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold text-gray-800">{safeReward.cost}</span>
                          </div>
                          <Button
                            onClick={() => handleRedeemReward(safeReward.id)}
                            disabled={balance < safeReward.cost}
                            className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            兑换
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Official Rewards */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">官方推荐奖励</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {officialRewards.map(reward => (
                  <Card key={reward.id} className="p-4 bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-2xl">{getCategoryIcon(reward.category)}</div>
                      <Badge className={getCategoryColor(reward.category)}>
                        {reward.category === 'entertainment' && '娱乐'}
                        {reward.category === 'food' && '美食'}
                        {reward.category === 'shopping' && '购物'}
                        {reward.category === 'self_care' && '自我关怀'}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-gray-800 mb-2">{reward.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-800">{reward.cost}</span>
                      </div>
                      <Button
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={balance < reward.cost}
                        className="bg-gradient-to-r from-lavender-400 to-lavender-500 hover:from-lavender-500 hover:to-lavender-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        兑换
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            
            {/* 调试信息 - 显示用户奖励状态 */}
            {(!userRewards || userRewards.length === 0) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-center">暂无社区奖励，点击上方"创建自定义奖励"来添加你的第一个奖励吧！</p>
              </div>
            )}

            {/* Transaction History */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">交易记录</h2>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无交易记录</p>
                  </div>
                ) : (
                  <VirtualList
                    items={transactions}
                    itemHeight={72}
                    height={360}
                    render={(transaction) => (
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{(transaction as any).description}</p>
                          <p className="text-sm text-gray-500">{new Date((transaction as any).created_at).toLocaleString()}</p>
                        </div>
                        <div className={`font-semibold ${((transaction as any).type === 'earn' ? 'text-green-600' : 'text-red-600')}`}>
                          {((transaction as any).type === 'earn' ? '+' : '-')}{(transaction as any).amount}
                        </div>
                      </div>
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Reward Modal */}
        {showCreateReward && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-white/20">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">创建自定义奖励</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">奖励名称</label>
                    <input
                      type="text"
                      value={newReward.title}
                      onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      placeholder="例如：看一集喜欢的电视剧"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">奖励描述</label>
                    <textarea
                      value={newReward.description}
                      onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      rows={3}
                      placeholder="详细描述这个奖励..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">所需织梦豆</label>
                    <input
                      type="number"
                      value={newReward.cost}
                      onChange={(e) => setNewReward({ ...newReward, cost: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">奖励类别</label>
                    <select
                      value={newReward.category}
                      onChange={(e) => setNewReward({ ...newReward, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                    >
                      <option value="entertainment">娱乐</option>
                      <option value="food">美食</option>
                      <option value="shopping">购物</option>
                      <option value="self_care">自我关怀</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <Button
                    onClick={() => setShowCreateReward(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleCreateReward}
                    className="flex-1 bg-gradient-to-r from-lavender-400 to-lavender-500 hover:from-lavender-500 hover:to-lavender-600"
                  >
                    创建奖励
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    {/* 任务详情弹层 */}
    {showTaskModal && selectedTask && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-white/20">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 break-words">{selectedTask.title}</h3>
            <p className="text-sm text-gray-700 mb-4 break-words whitespace-pre-line max-h-32 overflow-auto pr-2">{selectedTask.description}</p>
            <div className="flex items-center space-x-2 mb-6">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Coins className="w-3 h-3 mr-1" />+{selectedTask.reward} 织梦豆
              </Badge>
              {selectedTask.type && (
                <Badge className="bg-blue-100 text-blue-800">{selectedTask.type === 'weekly' ? '每周' : selectedTask.type === 'daily' ? '每日' : '特殊'}</Badge>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <Link to={getTaskRoute(selectedTask)} className="w-28 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 text-white hover:from-sky-500 hover:to-sky-600">前往</Link>
              <Button
                onClick={() => { handleTaskComplete(selectedTask); setShowTaskModal(false); }}
                size="fixed"
                className="bg-gradient-to-r from-mint-400 to-mint-500 text-white"
              >
                完成
              </Button>
              <Button
                onClick={() => { setShowTaskModal(false); setSelectedTask(null); }}
                size="fixed"
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                关闭
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )}

    {/* 自定义任务详情弹层 */}
    {showCustomModal && selectedCustomTask && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-white/20">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 break-words">{selectedCustomTask.title}</h3>
            <p className="text-sm text-gray-700 mb-4 break-words whitespace-pre-line max-h-32 overflow-auto pr-2">{selectedCustomTask.description}</p>
            <div className="flex items-center space-x-2 mb-6">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Coins className="w-3 h-3 mr-1" />+{selectedCustomTask.reward} 织梦豆
              </Badge>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => { completeCustomTask(selectedCustomTask); setShowCustomModal(false); }}
                size="fixed"
                className="bg-gradient-to-r from-mint-400 to-mint-500 text-white"
              >
                完成
              </Button>
              <Button
                onClick={() => { const list = customTasks.filter(t => t.id !== selectedCustomTask.id); setCustomTasks(list); persistCustomTasks(list); setShowCustomModal(false); }}
                size="fixed"
                className="bg-pink-200 text-pink-800 hover:bg-pink-300"
              >
                删除
              </Button>
              <Button
                onClick={() => { setShowCustomModal(false); setSelectedCustomTask(null); }}
                size="fixed"
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                关闭
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )}
    </div>
  )
}
