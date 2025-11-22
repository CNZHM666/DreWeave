import React, { useState, useEffect } from 'react'
import { useTestStore } from '../stores/testStore'
import { useAuthStore } from '../stores/authStore'
import { testTypes } from '../data/testQuestions'
import { Brain, Heart, BarChart3, ArrowLeft, ArrowRight } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import BackToHome from '../components/BackToHome'
import TestReport from '../components/TestReport'
import NetworkStatusFix from '../components/NetworkStatusFix'
import ManualNetworkFix from '../components/ManualNetworkFix'

const TestCenter: React.FC = () => {
  const { user } = useAuthStore()
  const {
    currentTest,
    currentQuestion,
    answers,
    isLoading,
    error,
    testHistory,
    startTest,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    submitTest,
    fetchTestHistory,
    clearTest,
    clearError
  } = useTestStore()

  const [showResults, setShowResults] = useState(false)
  const [currentResult, setCurrentResult] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchTestHistory(user.id)
    }
  }, [user?.id])

  const handleStartTest = (testType: string) => {
    clearError()
    startTest(testType)
    // 移动端优化：重置滚动位置
    if (isMobile) {
      window.scrollTo(0, 0)
    }
  }

  const handleAnswerQuestion = (answer: number) => {
    const currentTestData = currentTest ? testTypes[currentTest.toUpperCase() as keyof typeof testTypes] : null
    if (!currentTestData) return

    answerQuestion(currentTestData.questions[currentQuestion].id, answer)
  }

  const handleNextQuestion = () => {
    const currentTestData = currentTest ? testTypes[currentTest.toUpperCase() as keyof typeof testTypes] : null
    if (!currentTestData) return

    if (currentQuestion < currentTestData.questions.length - 1) {
      // 移动到下一题
      nextQuestion()
      // 移动端优化：滚动到顶部
      if (isMobile) {
        window.scrollTo(0, 0)
      }
    } else {
      // 提交测试
      handleSubmitTest()
    }
  }

  const handleSubmitTest = async () => {
    if (!user?.id) {
      toast.error('请先登录')
      return
    }

    console.log('📝 移动端测试提交开始...')
    
    try {
      const result = await submitTest(user.id)
      if (result) {
        console.log('✅ 测试提交成功，准备显示结果...')
        setCurrentResult(result)
        setShowResults(true)
        
        // 移动端优化：确保结果界面可见
        if (isMobile) {
          setTimeout(() => {
            window.scrollTo(0, 0)
          }, 100)
        }
        
        if (user?.id) {
          fetchTestHistory(user.id)
        }
      } else {
        console.log('❌ 测试提交失败，结果为null')
        toast.error('测试提交失败，请重试')
      }
    } catch (error: any) {
      console.error('❌ 测试提交出错:', error)
      toast.error('测试提交出错，请检查网络连接')
    }
  }

  const getCurrentTestData = () => {
    if (!currentTest) return null
    return testTypes[currentTest.toUpperCase() as keyof typeof testTypes]
  }

  const currentTestData = getCurrentTestData()

  // 显示测试结果界面
  if (showResults && currentResult) {
    return (
      <div className="min-h-screen gradient-healing">
        <TestReport
          result={currentResult}
          onComplete={() => {
            console.log('📝 用户点击完成测试')
            setShowResults(false)
            setCurrentResult(null)
            clearTest()
            // 移动端优化：返回顶部
            if (isMobile) {
              window.scrollTo(0, 0)
            }
          }}
          onRetake={() => {
            console.log('📝 用户点击重新测试')
            setShowResults(false)
            setCurrentResult(null)
            clearTest()
            if (currentTest) {
              handleStartTest(currentTest)
            }
          }}
        />
      </div>
    )
  }

  // 如果没有正在进行的测试，显示测试选择页面
  if (!currentTest) {
    return (
      <div className="min-h-screen gradient-healing p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* 顶部导航 */}
          <div className="relative mb-6 md:mb-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2 md:mb-4">
                自测中心
              </h1>
              <p className="text-lg md:text-xl text-blue-800">
                科学评估你的状态，更好地了解自己 🧠
              </p>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <BackToHome />
            </div>
          </div>

          {/* 测试选择 - 移动端优化 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
            <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 text-center hover:shadow-xl transition-all duration-300">
              <Brain className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mx-auto mb-3 md:mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-3 md:mb-4">
                iAT网络成瘾内隐量表
              </h3>
              <p className="text-blue-700 text-sm md:text-base mb-4 md:mb-6">
                评估你的网络使用习惯和依赖程度，帮助你了解自己的网络使用模式。
              </p>
              <button
                onClick={() => handleStartTest('iat')}
                className="btn-healing px-6 md:px-8 py-3 text-sm md:text-base w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading ? '加载中...' : '开始测试'}
              </button>
            </div>

            <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 text-center hover:shadow-xl transition-all duration-300">
              <Heart className="w-12 h-12 md:w-16 md:h-16 text-pink-400 mx-auto mb-3 md:mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
                性压抑指数量表
              </h3>
              <p className="text-white text-opacity-80 text-sm md:text-base mb-4 md:mb-6">
                评估性冲动管理和性观念健康程度，提供科学的情绪管理建议。
              </p>
              <button
                onClick={() => handleStartTest('sexual_repression')}
                className="btn-healing px-6 md:px-8 py-3 text-sm md:text-base w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading ? '加载中...' : '开始测试'}
              </button>
            </div>
          </div>

          {/* 测试历史 - 移动端优化 */}
          {testHistory.length > 0 && (
            <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 md:mb-6">
                测试历史
              </h3>
              <div className="space-y-3 md:space-y-4">
                {testHistory.map((result, index) => (
                  <div key={result.id} className="glass-light rounded-xl md:rounded-2xl p-4 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-blue-800 font-semibold text-sm md:text-base truncate">
                          {testTypes[result.test_type as keyof typeof testTypes]?.name}
                        </h4>
                        <p className="text-blue-600 text-xs md:text-sm">
                          {new Date(result.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-blue-900 font-bold text-lg md:text-xl">
                          {result.score}分
                        </div>
                        <div className="text-blue-600 text-xs md:text-sm">
                          {result.result?.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 显示测试题目
  if (!currentTestData) {
    return (
      <div className="min-h-screen gradient-healing p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800">测试数据加载中...</p>
        </div>
      </div>
    )
  }

  const currentQuestionData = currentTestData.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / currentTestData.questions.length) * 100

  return (
    <div className="min-h-screen gradient-healing p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* 网络状态指示器 - 移动端优化显示 */}
        <div className="mb-4 flex justify-center">
          <NetworkStatusFix />
        </div>
        
        {/* 手动网络修复工具 - 移动端优化显示 */}
        <div className="mb-4 flex justify-center">
          <ManualNetworkFix />
        </div>
        
        {/* 顶部导航 - 移动端优化 */}
        <div className="relative mb-6 md:mb-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2 text-shadow-lg">
              {currentTestData.name}
            </h1>
            <p className="text-blue-800 text-sm md:text-base text-shadow-md">
              第 {currentQuestion + 1} 题，共 {currentTestData.questions.length} 题
            </p>
          </div>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <BackToHome />
          </div>
        </div>

        {/* 进度条 - 移动端优化 */}
        <div className="glass rounded-full p-2 mb-6 md:mb-8 bg-white/10">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progress}%` }}
          />
          <div className="text-center mt-2">
            <span className="text-xs text-blue-700 font-medium">
              {Math.round(progress)}% 完成
            </span>
          </div>
        </div>

        {/* 题目 - 移动端优化 */}
        <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-blue-900 mb-4 md:mb-6 text-shadow-md leading-relaxed">
            {currentQuestionData.question}
          </h2>
          
          <div className="space-y-3">
            {currentQuestionData.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswerQuestion(option.value)}
                className={`w-full p-3 md:p-4 rounded-xl text-left transition-all duration-300 text-sm md:text-base ${
                  answers[currentQuestionData.id] === option.value
                    ? 'bg-blue-600 text-white shadow-lg text-shadow-md'
                    : 'glass-light text-blue-800 text-shadow-sm hover:bg-white hover:bg-opacity-20'
                }`}
                disabled={isLoading}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                    answers[currentQuestionData.id] === option.value
                      ? 'border-white bg-white'
                      : 'border-blue-300'
                  }`}>
                    {answers[currentQuestionData.id] === option.value && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  <span className="leading-relaxed">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 导航按钮 - 移动端优化 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentQuestion === 0 || isLoading}
            className="flex items-center justify-center px-4 md:px-6 py-3 rounded-xl bg-white bg-opacity-20 text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-30 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            上一题
          </button>
          
          <button
            onClick={handleNextQuestion}
            disabled={!answers[currentQuestionData.id] || isLoading}
            className="flex items-center justify-center px-4 md:px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            {currentQuestion === currentTestData.questions.length - 1 ? '提交测试' : '下一题'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* 移动端底部提示 */}
        {isMobile && (
          <div className="mt-6 text-center">
            <p className="text-blue-600 text-xs">
              💡 点击选项后自动进入下一题
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestCenter

// 添加CSS样式以支持移动端优化
const styles = `
@media (max-width: 767px) {
  .gradient-healing {
    min-height: 100vh;
    padding: 1rem;
  }
  
  .glass {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  .text-shadow-lg {
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .text-shadow-md {
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  
  .text-shadow-sm {
    text-shadow: 0 1px 1px rgba(0,0,0,0.05);
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  button {
    min-height: 44px; /* iOS推荐的最小触摸目标 */
  }
  
  .glass-light:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

/* 防止移动端双击缩放 */
button, .btn-healing {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 移动端横屏优化 */
@media (max-height: 500px) and (orientation: landscape) {
  .gradient-healing {
    padding: 0.5rem;
  }
  
  .glass {
    padding: 1rem;
  }
}
`