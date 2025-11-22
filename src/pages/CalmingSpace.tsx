import React, { useState, useEffect } from 'react'
import { useCalmingStore } from '../stores/calmingStore'
import { getMusicRecommendations, getBreathingAnimations } from '../stores/calmingStore'
import { useAuthStore } from '../stores/authStore'
import { useAchievementStore } from '../stores/achievementStore'
import { Heart, Wind, Music, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import BackToHome from '../components/BackToHome'

const CalmingSpace: React.FC = () => {
  const {
    currentMessage,
    isBreathing,
    currentBreathingPhase,
    breathingAnimation,
    isLoading,
    getRandomMessage,
    startBreathing,
    stopBreathing
  } = useCalmingStore()
  
  const { user } = useAuthStore()

  const [showBreathing, setShowBreathing] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [breathingCircleSize, setBreathingCircleSize] = useState(100)

  // 获取随机治愈消息
  useEffect(() => {
    getRandomMessage()
  }, [])

  // 呼吸引导动画
  useEffect(() => {
    if (isBreathing && breathingAnimation) {
      const currentPhase = breathingAnimation.phases[currentBreathingPhase]
      
      // 根据呼吸阶段调整圆圈大小
      const animateBreathing = () => {
        if (currentPhase.name === '吸气') {
          setBreathingCircleSize(150) // 放大
        } else if (currentPhase.name === '呼气') {
          setBreathingCircleSize(100) // 缩小
        } else {
          setBreathingCircleSize(125) // 屏息时中等大小
        }
      }
      
      animateBreathing()
    }
  }, [isBreathing, currentBreathingPhase, breathingAnimation])

  const handleStartBreathing = (animation: any) => {
    startBreathing(animation)
    setShowBreathing(true)
    toast.success('开始呼吸引导', {
      description: '跟着节奏，深呼吸...',
      duration: 3000
    })
  }

  const handleStopBreathing = () => {
    stopBreathing()
    setShowBreathing(false)
    setBreathingCircleSize(100)
    
    // 更新成就进度
    if (user) {
      const { updateProgress } = useAchievementStore.getState()
      updateProgress(user.id, 'calm_sessions', 1)
    }
    
    toast.success('呼吸引导结束', {
      description: '感觉好些了吗？',
      duration: 3000
    })
  }

  const handleGetNewMessage = () => {
    getRandomMessage()
  }

  const musicRecommendations = getMusicRecommendations()
  const breathingAnimations = getBreathingAnimations()

  return (
    <div className="min-h-screen gradient-healing p-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航 */}
        <div className="relative mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 text-shadow-strong" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2)'}}>冷静空间</h1>
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
            </div>
            <p className="text-lg sm:text-xl text-blue-800 text-shadow-medium">当冲动来临时，给自己一个暂停的空间 💙</p>
          </div>
          {/* 移动端：固定右下角悬浮按钮 */}
          <div className="fixed bottom-20 right-4 z-50 sm:hidden">
            <BackToHome showText={false} className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300" />
          </div>
          {/* 桌面端：右上角绝对定位 */}
          <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2">
            <BackToHome />
          </div>
        </div>

        {/* 治愈消息卡片 */}
        <div className="glass rounded-3xl p-8 mb-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-blue-900 text-shadow-medium">今日治愈</h2>
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            
            {currentMessage ? (
              <div className="space-y-4">
                <p className="text-xl text-blue-800 leading-relaxed text-shadow-light" style={{fontWeight: 500}}>
                  {currentMessage.message}
                </p>
                <div className="glass-light rounded-2xl p-4">
                  <div className="flex items-center justify-center space-x-2 text-blue-300 mb-2">
                    <Wind className="w-5 h-5" />
                    <span className="font-semibold text-blue-800 text-shadow-light">呼吸引导</span>
                  </div>
                  <p className="text-blue-800 font-medium text-shadow-light">
                    {currentMessage.breathing}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-blue-800 font-medium text-shadow-light">
                正在为你准备治愈消息...
              </div>
            )}
            
            <button
              onClick={handleGetNewMessage}
              disabled={isLoading}
              className="mt-6 btn-healing px-6 py-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-blue-800 font-medium text-shadow-light">获取中...</span>
                </div>
              ) : (
                <span className="text-blue-800 font-medium text-shadow-light">换一条消息</span>
              )}
            </button>
          </div>
        </div>

        {/* 呼吸引导区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass rounded-3xl p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Wind className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-blue-900 text-shadow-medium">呼吸引导</h3>
                <Wind className="w-6 h-6 text-blue-400" />
              </div>
            </div>

            {!showBreathing ? (
              <div className="space-y-4">
                {breathingAnimations.map((animation) => (
                  <button
                    key={animation.id}
                    onClick={() => handleStartBreathing(animation)}
                    className="w-full glass-light rounded-2xl p-4 text-left hover:bg-white hover:bg-opacity-20 transition-all duration-300"
                  >
                    <h4 className="text-blue-800 font-bold mb-2 text-shadow-light">
                      {animation.name}
                    </h4>
                    <p className="text-blue-800 text-sm font-medium text-shadow-light">
                      {animation.description}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center">
                {breathingAnimation && (
                  <div className="space-y-6">
                    {/* 呼吸圆圈动画 */}
                    <div className="flex justify-center mb-6">
                      <div
                        className="rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center transition-all duration-1000 ease-in-out"
                        style={{
                          width: `${breathingCircleSize}px`,
                          height: `${breathingCircleSize}px`,
                        }}
                      >
                        <Wind className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* 当前阶段 */}
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold text-blue-900 text-shadow-strong">
                        {breathingAnimation.phases[currentBreathingPhase].name}
                      </h4>
                      <p className="text-blue-800 font-medium text-shadow-light">
                        保持 {breathingAnimation.phases[currentBreathingPhase].duration / 1000} 秒
                      </p>
                    </div>

                    {/* 进度指示器 */}
                    <div className="flex justify-center space-x-2">
                      {breathingAnimation.phases.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentBreathingPhase
                              ? 'bg-blue-400'
                              : index < currentBreathingPhase
                              ? 'bg-blue-300'
                              : 'bg-white bg-opacity-30'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleStopBreathing}
                      className="mt-6 glass-light px-6 py-3 rounded-2xl text-blue-800 font-semibold text-shadow-light hover:bg-white hover:bg-opacity-20 transition-all duration-300 flex items-center space-x-2 mx-auto"
                    >
                      <Pause className="w-4 h-4" />
                      <span>结束呼吸</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 音乐推荐区域 */}
          <div className="glass rounded-3xl p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Music className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-blue-900 text-shadow-medium">治愈音乐</h3>
                <Music className="w-6 h-6 text-green-400" />
              </div>
            </div>

            <div className="space-y-4">
              {musicRecommendations.map((music) => (
                <div
                  key={music.id}
                  className="glass-light rounded-2xl p-4 hover:bg-white hover:bg-opacity-20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-blue-800 font-bold mb-1 text-shadow-light">
                        {music.title}
                      </h4>
                      <p className="text-blue-800 text-sm mb-1 font-medium text-shadow-light">
                        {music.description}
                      </p>
                      <p className="text-blue-700 text-xs font-medium">
                        {music.duration}
                      </p>
                    </div>
                    <button
                      onClick={() => toast.info('音乐播放功能开发中...')}
                      className="glass-light p-3 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-300"
                    >
                      <Play className="w-5 h-5 text-blue-800" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => toast.info('更多音乐功能开发中...')}
                className="text-blue-700 hover:text-blue-800 transition-colors duration-300 text-sm font-medium text-shadow-light"
              >
                更多音乐推荐 →
              </button>
            </div>
          </div>
        </div>

        {/* 快速操作按钮 */}
        <div className="glass rounded-3xl p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-blue-900 text-shadow-medium mb-2">快速操作</h3>
            <p className="text-blue-800" style={{fontWeight: 500, textShadow: '1px 1px 2px rgba(0,0,0,0.2)'}}>
              当你需要立即帮助时，试试这些
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleGetNewMessage}
              className="glass-light rounded-2xl p-4 text-center hover:bg-white hover:bg-opacity-20 transition-all duration-300"
            >
              <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-blue-800 font-bold mb-1" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)'}}>新的治愈消息</div>
              <div className="text-blue-700 text-sm font-medium" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.1)'}}>
                获取新的正能量
              </div>
            </button>

            <button
              onClick={() => {
                if (!showBreathing) {
                  handleStartBreathing(breathingAnimations[0])
                } else {
                  handleStopBreathing()
                }
              }}
              className="glass-light rounded-2xl p-4 text-center hover:bg-white hover:bg-opacity-20 transition-all duration-300"
            >
              <Wind className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-blue-800 font-bold mb-1" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)'}}>
                {showBreathing ? '停止呼吸' : '开始呼吸'}
              </div>
              <div className="text-blue-700 text-sm font-medium" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.1)'}}>
                {showBreathing ? '结束呼吸引导' : '开始深呼吸'}
              </div>
            </button>

            <button
              onClick={() => {
                // 重置所有状态
                stopBreathing()
                setShowBreathing(false)
                setShowMusic(false)
                getRandomMessage()
                toast.success('空间已重置', {
                  description: '重新开始你的治愈之旅',
                  duration: 3000
                })
              }}
              className="glass-light rounded-2xl p-4 text-center hover:bg-white hover:bg-opacity-20 transition-all duration-300"
            >
              <RotateCcw className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-blue-800 font-bold mb-1" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)'}}>重置空间</div>
              <div className="text-white text-opacity-85 text-sm font-medium" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.1)'}}>
                重新开始
              </div>
            </button>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <div className="glass-light rounded-3xl p-6 max-w-2xl mx-auto">
            <h4 className="text-lg font-bold text-gray-800 mb-3 text-shadow-light">
              💡 小提示
            </h4>
            <p className="text-gray-800 font-medium" style={{lineHeight: '1.7', textShadow: '1px 1px 1px rgba(255,255,255,0.5)'}}>
              当冲动来临时，先深呼吸10次，给自己一点时间。记住，你有能力控制自己的情绪，
              每一次自制都是对自己的投资。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalmingSpace
