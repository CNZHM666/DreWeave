import { create } from 'zustand'
import { testApi } from '../config/supabase'
import { toast } from 'sonner'
import { useAchievementStore } from './achievementStore'
import { testTypes, scoringCriteria } from '../data/testQuestions'
import { backupNetworkCheck } from '../utils/backupNetworkCheck'

// 测试状态接口
interface TestState {
  currentTest: string | null
  currentQuestion: number
  answers: Record<number, number>
  isLoading: boolean
  error: string | null
  testHistory: TestResult[]
}

// 测试结果接口
interface TestResult {
  id: string
  user_id: string
  test_type: string
  score: number
  answers: Record<number, number>
  result: TestAnalysis
  created_at: string
}

// 测试分析接口
interface TestAnalysis {
  score: number
  level: string
  description: string
  advice: string
  radarData: Array<{ subject: string; value: number }>
}

// 测试操作接口
interface TestActions {
  startTest: (testType: string) => void
  answerQuestion: (questionId: number, answer: number) => void
  nextQuestion: () => void
  prevQuestion: () => void
  submitTest: (userId: string) => Promise<TestResult | null>
  fetchTestHistory: (userId: string) => Promise<void>
  clearTest: () => void
  clearError: () => void
}

// 测试存储类型
interface TestStore extends TestState, TestActions {}

// 获取测试题目
function getTestQuestions(testType: string) {
  const upperType = testType.toUpperCase()
  return testTypes[upperType as keyof typeof testTypes]?.questions || []
}

// 计算得分
function calculateScore(testType: string, answers: Record<number, number>): number {
  const questions = getTestQuestions(testType)
  let totalScore = 0
  
  questions.forEach((question, index) => {
    const answer = answers[question.id]
    if (answer) {
      totalScore += answer
    }
  })
  
  return totalScore
}

// 分析测试结果
function analyzeTestResult(testType: string, score: number, answers: Record<number, number>): TestAnalysis {
  const testData = testTypes[testType.toUpperCase() as keyof typeof testTypes]
  const criteria = scoringCriteria[testType.toUpperCase() as keyof typeof scoringCriteria]
  
  if (!testData || !criteria) {
    return {
      score,
      level: '未知',
      description: '无法分析测试结果',
      advice: '请稍后重试',
      radarData: []
    }
  }
  
  // 根据得分确定等级
  let level = ''
  let description = ''
  let advice = ''
  
  if (testType === 'sexual_repression') {
    if (score <= (criteria as any).low.max) {
      level = (criteria as any).low.level
      description = (criteria as any).low.description
      advice = (criteria as any).low.advice
    } else if (score <= (criteria as any).moderate.max) {
      level = (criteria as any).moderate.level
      description = (criteria as any).moderate.description
      advice = (criteria as any).moderate.advice
    } else {
      level = (criteria as any).high.level
      description = (criteria as any).high.description
      advice = (criteria as any).high.advice
    }
  } else {
    const c = (criteria as any)
    if (score <= c.normal.max) {
      level = 'normal'
      description = c.normal.description
      advice = c.normal.advice
    } else if (score <= c.mild.max) {
      level = 'mild'
      description = c.mild.description
      advice = c.mild.advice
    } else if (score <= c.moderate.max) {
      level = 'moderate'
      description = c.moderate.description
      advice = c.moderate.advice
    } else {
      level = 'severe'
      description = c.severe.description
      advice = c.severe.advice
    }
  }
  
  // 生成雷达图数据
  const radarData = [
    { subject: '自我认知', value: Math.max(0, 100 - (score * 2)) },
    { subject: '情绪管理', value: Math.max(0, 100 - (score * 1.5)) },
    { subject: '社交能力', value: Math.max(0, 100 - (score * 1.8)) },
    { subject: '生活平衡', value: Math.max(0, 100 - (score * 2.2)) },
    { subject: '行为控制', value: Math.max(0, 100 - (score * 1.6)) }
  ]
  
  return {
    score,
    level,
    description,
    advice,
    radarData
  }
}

// 创建测试状态管理 - 移动端优化版本
export const useTestStore = create<TestStore>()((set, get) => ({
  currentTest: null,
  currentQuestion: 0,
  answers: {},
  isLoading: false,
  error: null,
  testHistory: [],

  // 开始测试
  startTest: (testType: string) => {
    console.log('📝 开始测试:', testType)
    set({
      currentTest: testType,
      currentQuestion: 0,
      answers: {},
      error: null
    })
  },

  // 回答问题
  answerQuestion: (questionId: number, answer: number) => {
    set(state => ({
      answers: {
        ...state.answers,
        [questionId]: answer
      }
    }))
  },

  // 下一题
  nextQuestion: () => {
    set(state => ({
      currentQuestion: Math.min(state.currentQuestion + 1, getTestQuestions(state.currentTest || '').length - 1)
    }))
  },

  // 上一题
  prevQuestion: () => {
    set(state => ({
      currentQuestion: Math.max(state.currentQuestion - 1, 0)
    }))
  },

  // 提交测试 - 移动端优化版本
  submitTest: async (userId: string) => {
    const { currentTest, answers } = get()
    
    console.log('📝 开始提交测试:', { currentTest, answers, userId })
    
    if (!currentTest) {
      set({ error: '没有正在进行的测试' })
      return null
    }

    // 检查是否回答了所有问题
    const testQuestions = getTestQuestions(currentTest)
    const answeredCount = Object.keys(answers).length
    
    console.log('📊 答题情况:', { testQuestions: testQuestions.length, answeredCount, answers })
    
    if (answeredCount < testQuestions.length) {
      set({ error: `还有 ${testQuestions.length - answeredCount} 道题未回答` })
      return null
    }

    set({ isLoading: true, error: null })
    
    try {
      // 计算得分
      const score = calculateScore(currentTest, answers)
      console.log('🎯 计算得分:', score)
      
      // 分析结果
      const analysis = analyzeTestResult(currentTest, score, answers)
      console.log('📈 分析结果:', analysis)
      
      // 移动端优化网络检测 - 简化版本
      let isOffline = true // 默认为离线状态，确保测试可以提交
      
      try {
        // 首先检查浏览器内置的在线状态
        if (navigator.onLine === true) {
          // 使用简化网络检测
          const isOnline = await backupNetworkCheck.quickCheck()
          isOffline = !isOnline
          console.log(`🌐 简化网络检测: ${isOnline ? '在线' : '离线'}`)
        } else {
          console.log('🌐 浏览器显示离线，使用离线模式')
          isOffline = true
        }
      } catch (networkError) {
        console.debug('🌐 网络检测出错，使用离线模式:', networkError)
        isOffline = true
      }
      
      let testResult: TestResult
      
      if (isOffline) {
        // 离线模式：创建本地测试结果
        try {
          const offlineResult = {
            id: `offline_${Date.now()}`,
            user_id: userId,
            test_type: currentTest,
            test_name: testTypes[currentTest.toUpperCase() as keyof typeof testTypes].name,
            score: score,
            max_score: testQuestions.length * 5,
            percentage: Math.round((score / (testQuestions.length * 5)) * 100),
            result_category: analysis.description.split('：')[0] || '正常范围',
            result_description: analysis.description,
            recommendations: [analysis.advice],
            completed_at: new Date().toISOString(),
            answers: answers,
            created_at: new Date().toISOString(),
            result: analysis
          }
          
          console.log('💾 创建离线结果:', offlineResult)
          
          // 保存到本地存储
          const offlineTests = JSON.parse(localStorage.getItem('offline_test_results') || '[]')
          offlineTests.push(offlineResult)
          localStorage.setItem('offline_test_results', JSON.stringify(offlineTests))
          
          console.log('💾 离线结果已保存到本地存储')
          
          testResult = offlineResult
          
          toast.success('测试完成！（离线模式）', {
            description: `您的得分：${score}分，${analysis.description}`
          })
        } catch (offlineError) {
          console.error('❌ 离线结果保存失败:', offlineError)
          throw new Error(`离线模式保存失败: ${offlineError.message}`)
        }
      } else {
        // 在线模式：保存到数据库
        const result = await testApi.saveTestResult(userId, currentTest, score, answers)
        
        // 添加分析结果
        testResult = {
          ...result,
          result: analysis
        }
        
        toast.success('测试完成！', {
          description: `您的得分：${score}分，${analysis.description}`
        })
        
        // 更新成就进度（仅在线模式）
        await useAchievementStore.getState().updateProgress(userId, 'tests', 1)
      }
      
      // 清空当前测试
      get().clearTest()
      
      console.log('✅ 测试提交成功，返回结果:', testResult)
      return testResult
    } catch (error: any) {
      console.error('❌ 测试提交失败:', error)
      
      // 移动端友好的错误提示
      if (error.message.includes('网络') || error.message.includes('连接')) {
        toast.error('网络连接问题', {
          description: '测试已保存到本地，网络恢复后会自动同步'
        })
      } else {
        toast.error('测试提交失败', {
          description: '请检查网络连接后重试'
        })
      }
      
      set({
        error: error.message || '测试提交失败',
        isLoading: false
      })
      
      return null
    }
  },

  // 获取测试历史
  fetchTestHistory: async (userId: string) => {
    set({ isLoading: true, error: null })
    
    try {
      // 获取在线历史记录
      const onlineHistory = await testApi.getUserTestHistory(userId)
      
      // 获取离线历史记录
      let offlineHistory: TestResult[] = []
      try {
        const offlineTests = JSON.parse(localStorage.getItem('offline_test_results') || '[]')
        offlineHistory = offlineTests.filter((test: any) => test.user_id === userId)
      } catch (error: any) {
        console.debug('获取离线历史记录失败:', error)
      }
      
      // 合并历史记录
      const allHistory = [...offlineHistory, ...onlineHistory]
      
      // 按时间排序
      allHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      set({
        testHistory: allHistory,
        isLoading: false
      })
      
    } catch (error: any) {
      console.error('获取测试历史失败:', error)
      
      // 如果在线获取失败，只显示离线记录
      try {
        const offlineTests = JSON.parse(localStorage.getItem('offline_test_results') || '[]')
        const userOfflineTests = offlineTests.filter((test: any) => test.user_id === userId)
        
        set({
          testHistory: userOfflineTests,
          isLoading: false
        })
      } catch (offlineError) {
        console.error('获取离线历史记录也失败:', offlineError)
        set({
          error: '获取测试历史失败',
          isLoading: false
        })
      }
    }
  },

  // 清空测试
  clearTest: () => {
    set({
      currentTest: null,
      currentQuestion: 0,
      answers: {},
      error: null
    })
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  }
}))

export type { TestResult, TestAnalysis }