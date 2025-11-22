import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTestStore } from '../stores/testStore'
import { useAuthStore } from '../stores/authStore'
import { testTypes } from '../data/testQuestions'
import { Brain, Heart, BarChart3, ArrowLeft, ArrowRight } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
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
  const [showHistory, setShowHistory] = useState(false)
  const [selectedType, setSelectedType] = useState<'all' | 'iat' | 'sexual_repression'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  React.useEffect(() => {
    if (user?.id) {
      fetchTestHistory(user.id)
    }
  }, [user?.id])

  const handleStartTest = (testType: string) => {
    clearError()
    startTest(testType)
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

    const result = await submitTest(user.id)
    if (result) {
      setShowResults(false)
      setShowHistory(true)
      setSelectedType((result.test_type as any) || 'all')
      if (user?.id) {
        await fetchTestHistory(user.id)
      }
      setExpandedId(result.id)
      clearTest()
    }
  }

  const getCurrentTestData = () => {
    if (!currentTest) return null
    return testTypes[currentTest.toUpperCase() as keyof typeof testTypes]
  }

  const currentTestData = getCurrentTestData()

  // 如果没有正在进行的测试，显示测试选择页面
  if (!currentTest) {
    return (
      <div className="min-h-screen gradient-healing p-6">
        <div className="max-w-4xl mx-auto">
          {/* 顶部导航 */}
          {/* 移动端优化的标题和返回按钮 */}
          <div className="relative mb-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">自测中心</h1>
              <p className="text-lg sm:text-xl text-blue-800">科学评估你的状态，更好地了解自己 🧠</p>
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

          <div className="flex items-center justify-center space-x-3 mb-6">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                !showHistory ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'bg-white/80 text-gray-700 hover:bg-white/90'
              }`}
            >
              测试项目
            </button>
            <button
              onClick={() => {
                setShowHistory(true)
                if (user?.id) fetchTestHistory(user.id)
              }}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                showHistory ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'bg-white/80 text-gray-700 hover:bg-white/90'
              }`}
            >
              查看测试历史
            </button>
          </div>

          {!showHistory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="glass rounded-3xl p-8 text-center">
                <Brain className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-blue-900 mb-4">
                  iAT网络成瘾内隐量表
                </h3>
                <p className="text-blue-700 mb-6">
                  评估你的网络使用习惯和依赖程度，帮助你了解自己的网络使用模式。
                </p>
                <button
                  onClick={() => handleStartTest('iat')}
                  className="btn-healing px-8 py-3"
                >
                  开始测试
                </button>
              </div>

              <div className="glass rounded-3xl p-8 text-center">
                <Heart className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-4">
                  性压抑指数量表
                </h3>
                <p className="text-white text-opacity-80 mb-6">
                  评估性冲动管理和性观念健康程度，提供科学的情绪管理建议。
                </p>
                <button
                  onClick={() => handleStartTest('sexual_repression')}
                  className="btn-healing px-8 py-3"
                >
                  开始测试
                </button>
              </div>
            </div>
          )}

          {showHistory && (
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-blue-900">测试历史</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`px-3 py-1 rounded-full text-sm ${selectedType==='all' ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-700 hover:bg-white/90'}`}
                  >全部</button>
                  <button
                    onClick={() => setSelectedType('iat')}
                    className={`px-3 py-1 rounded-full text-sm ${selectedType==='iat' ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-700 hover:bg-white/90'}`}
                  >iAT</button>
                  <button
                    onClick={() => setSelectedType('sexual_repression')}
                    className={`px-3 py-1 rounded-full text-sm ${selectedType==='sexual_repression' ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-700 hover:bg-white/90'}`}
                  >性压抑</button>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索名称/结论"
                    className="px-3 py-1 rounded-full text-sm bg-white/80 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={() => { if (user?.id) fetchTestHistory(user.id) }}
                    className="ml-2 px-3 py-1 rounded-full text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  >刷新</button>
                  <button
                    onClick={() => {
                      const filtered = testHistory
                        .filter(h => selectedType==='all' || h.test_type === selectedType)
                        .filter(h => {
                          const name = (testTypes[h.test_type as keyof typeof testTypes]?.name) || (h as any).test_name || h.test_type
                          const desc = (h as any).result_description || h.result?.description || ''
                          const q = searchQuery.trim().toLowerCase()
                          return !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)
                        })
                      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'test-history.json'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="px-3 py-1 rounded-full text-sm bg-white/80 text-gray-800"
                  >导出JSON</button>
                  <button
                    onClick={() => {
                      const filtered = testHistory
                        .filter(h => selectedType==='all' || h.test_type === selectedType)
                        .filter(h => {
                          const name = (testTypes[h.test_type as keyof typeof testTypes]?.name) || (h as any).test_name || h.test_type
                          const desc = (h as any).result_description || h.result?.description || ''
                          const q = searchQuery.trim().toLowerCase()
                          return !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)
                        })
                      const header = ['id','test_type','test_name','score','percentage','created_at','completed_at','description','advice']
                      const rows = filtered.map(h => [
                        h.id,
                        h.test_type,
                        (testTypes[h.test_type as keyof typeof testTypes]?.name) || (h as any).test_name || h.test_type,
                        h.score,
                        (h as any).percentage != null ? (h as any).percentage : '',
                        h.created_at,
                        (h as any).completed_at || '',
                        (h as any).result_description || h.result?.description || '',
                        h.result?.advice || ''
                      ])
                      const csv = [header.join(','), ...rows.map(r => r.map(v => String(v).replace(/"/g,'""')).join(','))].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'test-history.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="px-3 py-1 rounded-full text-sm bg-white/80 text-gray-800"
                  >导出CSV</button>
                </div>
              </div>
              {testHistory.length === 0 ? (
                <div className="glass-light rounded-2xl p-8 text-center text-blue-800">暂无测试记录</div>
              ) : (
                <>
                  {(() => {
                    const filtered = testHistory
                      .filter(h => selectedType==='all' || h.test_type === selectedType)
                      .filter(h => {
                        const name = (testTypes[h.test_type as keyof typeof testTypes]?.name) || (h as any).test_name || h.test_type
                        const desc = (h as any).result_description || h.result?.description || ''
                        const q = searchQuery.trim().toLowerCase()
                        return !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)
                      })
                    const avg = Math.round(filtered.reduce((s, r) => s + r.score, 0) / Math.max(1, filtered.length))
                    return (
                      <div>
                        <div className="glass-light rounded-2xl p-4 mb-4 flex items-center justify-between">
                          <div className="text-blue-800">共 {filtered.length} 次记录，平均得分 {avg} 分</div>
                          <div className="text-sm text-blue-700">按测试类型筛选与搜索</div>
                        </div>
                        <div className="glass rounded-2xl p-4 mb-4">
                          <div className="text-blue-900 font-semibold mb-2">分数趋势</div>
                          <div className="w-full h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={filtered.map(h => ({
                                t: new Date(((h as any).completed_at || h.created_at)).toLocaleDateString(),
                                score: h.score
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="t" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <div className="space-y-4">
                    {testHistory
                      .filter(h => selectedType==='all' || h.test_type === selectedType)
                      .filter(h => {
                        const name = (testTypes[h.test_type as keyof typeof testTypes]?.name) || (h as any).test_name || h.test_type
                        const desc = (h as any).result_description || h.result?.description || ''
                        const q = searchQuery.trim().toLowerCase()
                        return !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)
                      })
                      .map((result) => {
                        const name = (testTypes[result.test_type as keyof typeof testTypes]?.name) || (result as any).test_name || result.test_type
                        const total = ((testTypes[result.test_type as keyof typeof testTypes]?.questions.length) || 20) * 5
                        const pct = (result as any).percentage != null ? (result as any).percentage : Math.round((result.score / total) * 100)
                        const isExpanded = expandedId === result.id
                        return (
                          <div key={result.id} className="glass-light rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-blue-800 font-semibold">{name}</h4>
                                <p className="text-blue-600 text-sm">{new Date(((result as any).completed_at || result.created_at)).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-blue-900 font-bold text-lg">{result.score}分</div>
                                <div className="w-32 h-2 bg-white/40 rounded-full overflow-hidden mt-2">
                                  <div className="h-full bg-gradient-to-r from-green-400 to-blue-500" style={{ width: `${Math.min(100, pct)}%` }} />
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center space-x-2">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : result.id)}
                                className="px-3 py-1 rounded-full text-sm bg-white/80 text-gray-700 hover:bg-white/90"
                              >{isExpanded ? '收起' : '展开详情'}</button>
                              <button
                                onClick={() => handleStartTest(result.test_type)}
                                className="px-3 py-1 rounded-full text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                              >重测</button>
                            </div>
                            {isExpanded && (
                              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass rounded-2xl p-4">
                                  <div className="text-blue-900 font-semibold mb-2">能力维度</div>
                                  <div className="w-full h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <RadarChart data={result.result?.radarData || []}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={45} domain={[0, 100]} />
                                        <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                      </RadarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                                <div className="glass rounded-2xl p-4">
                                  <div className="text-blue-900 font-semibold mb-2">结论与建议</div>
                                  <div className="text-blue-800 mb-2">{(result as any).result_description || result.result?.description}</div>
                                  <div className="text-blue-700 text-sm">{result.result?.advice}</div>
                                  <div className="mt-4">
                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">等级 {(result.result?.level || '').toUpperCase()}</span>
                                  </div>
                                  <div className="mt-6">
                                    <div className="text-blue-900 font-semibold mb-2">建议行动</div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Link to="/checkin" className="px-3 py-2 rounded-xl bg-white/80 text-blue-800 text-sm hover:bg-white/90 text-center">每日打卡</Link>
                                      <Link to="/calm" className="px-3 py-2 rounded-xl bg-white/80 text-blue-800 text-sm hover:bg-white/90 text-center">呼吸练习</Link>
                                      <button onClick={() => handleStartTest(result.test_type)} className="px-3 py-2 rounded-xl bg-white/80 text-blue-800 text-sm hover:bg-white/90 text-center">安排复测</button>
                                      <Link to="/market" className="px-3 py-2 rounded-xl bg-white/80 text-blue-800 text-sm hover:bg-white/90 text-center">创建激励奖励</Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 显示测试结果
  if (showResults && currentResult) {
    return (
      <TestReport
        result={currentResult}
        onComplete={() => {
          setShowResults(false)
          setCurrentResult(null)
          clearTest()
        }}
        onRetake={() => handleStartTest(currentTest)}
      />
    )
  }

  // 显示测试题目
  if (!currentTestData) {
    return <div>测试数据加载中...</div>
  }

  const currentQuestionData = currentTestData.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / currentTestData.questions.length) * 100

  return (
    <div className="min-h-screen gradient-healing p-6">
      <div className="max-w-2xl mx-auto">
        {/* 网络状态指示器 - 暂时隐藏 */}
        {/* <div className="mb-4 flex justify-center">
          <NetworkStatusFix />
        </div> */}
        
        {/* 手动网络修复工具 - 暂时隐藏 */}
        {/* <div className="mb-4 flex justify-center">
          <ManualNetworkFix />
        </div> */}
        
        {/* 顶部导航 */}
        <div className="relative mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-900 mb-2 text-shadow-lg">
              {currentTestData.name}
            </h1>
            <p className="text-blue-800 text-shadow-md">
              第 {currentQuestion + 1} 题，共 {currentTestData.questions.length} 题
            </p>
          </div>
          {/* 题目区域返回按钮 - 响应式布局 */}
          <div className="sm:hidden mb-4">
            <BackToHome className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300" />
          </div>
          <div className="hidden sm:block absolute left-0 top-1/2 transform -translate-y-1/2">
            <BackToHome />
          </div>
        </div>

        {/* 进度条 */}
        <div className="glass rounded-full p-2 mb-8 bg-white/10">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 题目 */}
        <div className="glass rounded-3xl p-8 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-6 text-shadow-md">
            {currentQuestionData.question}
          </h2>
          
          <div className="space-y-3">
            {currentQuestionData.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswerQuestion(option.value)}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                  answers[currentQuestionData.id] === option.value
                    ? 'bg-blue-600 text-white shadow-lg text-shadow-md'
                    : 'glass-light text-blue-800 text-shadow-sm hover:bg-white hover:bg-opacity-20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 导航按钮 */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (currentQuestion > 0) {
                prevQuestion()
              } else {
                clearTest()
              }
            }}
            className="px-6 py-3 rounded-2xl text-blue-800 font-medium bg-white/20 hover:bg-white/30 transition-all duration-300 flex items-center space-x-2 border border-white/30 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentQuestion > 0 ? '上一题' : '退出测试'}</span>
          </button>

          <div className="text-blue-700 text-shadow-sm">
            {currentQuestion + 1} / {currentTestData.questions.length}
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={!answers[currentQuestionData.id]}
            className={`px-6 py-3 rounded-2xl font-medium flex items-center space-x-2 transition-all duration-300 ${
              answers[currentQuestionData.id]
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white text-shadow-md hover:scale-105'
                : 'bg-gray-600 text-gray-500 cursor-not-allowed text-shadow-sm'
            }`}
          >
            <span>{currentQuestion < currentTestData.questions.length - 1 ? '下一题' : '提交测试'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-2xl p-4 text-red-800 text-shadow-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default TestCenter
