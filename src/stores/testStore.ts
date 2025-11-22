import { create } from 'zustand'
import { testApi, isSupabaseConfigured } from '../config/supabase'
import { toast } from 'sonner'
import { useAchievementStore } from './achievementStore'
import { testTypes, scoringCriteria } from '../data/testQuestions'
import { handleSexualRepressionSubmissionError } from '../utils/sexualRepressionErrorHandler'
import { emergencyNetworkBypass } from '../utils/emergencyNetworkBypass'
import backupNetworkCheck from '../utils/backupNetworkCheck'
import { useAuthStore } from './authStore'

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
  completed_at?: string
  max_score?: number
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

// 创建测试状态管理
export const useTestStore = create<TestStore>()((set, get) => ({
  currentTest: null,
  currentQuestion: 0,
  answers: {},
  isLoading: false,
  error: null,
  testHistory: [],

  // 开始测试
  startTest: (testType: string) => {
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

  // 提交测试
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
      
      // 简化网络状态检查 - 默认离线，若环境与网络满足再切换在线
      let isOffline = true
      
      // 只有在明确需要在线模式时才进行网络检测
      if (!isSupabaseConfigured) {
        console.log('⚠️ 未配置 Supabase，使用离线模式保存测试结果')
        isOffline = true
      } else if (emergencyNetworkBypass.isForceOnline()) {
        console.log('🚨 使用紧急绕过模式，强制在线')
        isOffline = false
      } else {
        // 简化网络检测 - 只检查浏览器在线状态
        try {
          if (navigator.onLine === true) {
            // 浏览器显示在线，尝试简单的网络检测
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
        try {
          const result = await testApi.saveTestResult(userId, currentTest, score, answers)
          testResult = { ...result, result: analysis }
          toast.success('测试完成！', { description: `您的得分：${score}分，${analysis.description}` })
          await useAchievementStore.getState().updateProgress(userId, 'tests', 1)
        } catch (e: any) {
          const msg = String(e?.message || '').toLowerCase()
          const code = (e?.code || '').toString()
          const needsOffline = code === '42P01' || code === 'PGRST102' || msg.includes('schema cache') || msg.includes("could not find the 'answers' column") || (msg.includes('column') && msg.includes('answers'))
          if (needsOffline) {
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
            const offlineTests = JSON.parse(localStorage.getItem('offline_test_results') || '[]')
            offlineTests.push(offlineResult)
            localStorage.setItem('offline_test_results', JSON.stringify(offlineTests))
            testResult = offlineResult as any
            toast.success('测试完成！（离线模式）', { description: `您的得分：${score}分，${analysis.description}` })
          } else {
            throw e
          }
        }
      }
      
      // 清空当前测试
      get().clearTest()
      
      console.log('✅ 测试提交成功，返回结果:', testResult)
      return testResult
    } catch (error: any) {
      console.error('❌ 测试提交失败:', error)
      
      // 对于性压抑量表，使用专门的错误处理
      if (currentTest === 'sexual_repression') {
        handleSexualRepressionSubmissionError(error)
      } else {
        // 其他测试使用通用错误处理
        toast.error('测试提交失败，请重试')
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
      const { networkStatus, isOfflineMode } = useAuthStore.getState()
      const isOffline = networkStatus === 'offline' || isOfflineMode
      let allHistory: TestResult[] = []
      if (!isOffline) {
        try {
          const history = await testApi.getUserTestHistory(userId)
          allHistory = history || []
        } catch {}
      }
      const offlineTests = JSON.parse(localStorage.getItem('offline_test_results') || '[]')
      const userOfflineTests = offlineTests.filter((test: any) => test.user_id === userId)
      allHistory = [...allHistory, ...userOfflineTests]
      
      // 为历史记录添加分析结果
      const historyWithAnalysis = allHistory.map(record => ({
        ...record,
        result: analyzeTestResult(record.test_type, record.score, record.answers)
      }))
      
      // 按完成时间排序
      historyWithAnalysis.sort((a, b) => {
        const dateA = a.completed_at ? new Date(a.completed_at).getTime() : new Date(a.created_at).getTime()
        const dateB = b.completed_at ? new Date(b.completed_at).getTime() : new Date(b.created_at).getTime()
        return dateB - dateA
      })
      
      set({ testHistory: historyWithAnalysis, isLoading: false })
    } catch (error: any) {
      const offlineTests = JSON.parse(localStorage.getItem('offline_test_results') || '[]')
      const userOfflineTests = offlineTests.filter((test: any) => test.user_id === userId)
      if (userOfflineTests.length > 0) {
        const historyWithAnalysis = userOfflineTests.map((record: any) => ({
          ...record,
          result: analyzeTestResult(record.test_type, record.score, record.answers)
        }))
        set({ testHistory: historyWithAnalysis, isLoading: false })
      } else {
        set({ error: error.message || '获取测试历史失败', isLoading: false })
        toast.error('获取测试历史失败')
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

// 获取测试题目
function getTestQuestions(testType: string): any[] {
  return testTypes[testType.toUpperCase() as keyof typeof testTypes]?.questions || []
}

// 计算得分
function calculateScore(testType: string, answers: Record<number, number>): number {
  return Object.values(answers).reduce((sum, score) => sum + score, 0)
}

// 分析测试结果
function analyzeTestResult(testType: string, score: number, answers: Record<number, number>): TestAnalysis {
  const testConfig = testTypes[testType.toUpperCase() as keyof typeof testTypes]
  const criteria = testType === 'iat' ? scoringCriteria.iAT : scoringCriteria.sexualRepression
  
  // 找到对应的评分等级
  let level = ''
  let description = ''
  let advice = ''
  
  for (const [key, criterion] of Object.entries(criteria)) {
    const criterionConfig = criterion as any
    if (score >= criterionConfig.min && score <= criterionConfig.max) {
      level = key
      description = criterionConfig.description
      advice = criterionConfig.advice
      break
    }
  }
  
  // 生成雷达图数据
  const radarData = generateRadarData(testType, answers)
  
  return {
    score,
    level,
    description,
    advice,
    radarData
  }
}

// 生成雷达图数据
function generateRadarData(testType: string, answers: Record<number, number>): Array<{ subject: string; value: number }> {
  const questions = testTypes[testType.toUpperCase() as keyof typeof testTypes]?.questions || []
  
  if (testType === 'iat') {
    // iAT测试的雷达图维度
    const dimensions = [
      { name: '时间管理', questions: [1, 2, 6, 8] },
      { name: '社交影响', questions: [3, 4, 5, 19] },
      { name: '情绪依赖', questions: [9, 14, 15, 20] },
      { name: '行为控制', questions: [7, 10, 11, 12] },
      { name: '经济影响', questions: [13, 16, 17, 18] }
    ]
    
    return dimensions.map(dim => {
      const scores = dim.questions.map(qId => answers[qId] || 0)
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      return {
        subject: dim.name,
        value: Math.round(avgScore * 20) // 转换为0-100分
      }
    })
  } else if (testType === 'sexual_repression') {
    // 性压抑测试的雷达图维度
    const dimensions = [
      { name: '道德观念', questions: [1, 3, 5, 11] },
      { name: '情绪反应', questions: [2, 8, 12, 15] },
      { name: '行为控制', questions: [4, 6, 10, 14] },
      { name: '认知影响', questions: [7, 9, 13] }  // 移除了重复的15题
    ]
    
    return dimensions.map(dim => {
      const scores = dim.questions.map(qId => answers[qId] || 0)
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      return {
        subject: dim.name,
        value: Math.round(avgScore * 20) // 转换为0-100分
      }
    })
  }
  
  return []
}

export type { TestResult, TestAnalysis, TestState, TestActions }