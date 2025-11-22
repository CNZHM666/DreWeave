import React from 'react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Progress } from './ui/Progress'
import { Heart, Brain, TrendingUp, Award, Lightbulb, Shield } from 'lucide-react'
import CapabilityAnalysisChart from './CapabilityAnalysisChart'
import ImprovementChart from './ImprovementChart'

interface TestResult {
  id: string
  user_id: string
  test_type: string
  test_name: string
  score: number
  max_score: number
  percentage: number
  result_category: string
  result_description: string
  recommendations: string[]
  completed_at: string
  answers: Record<number, number>
  result?: {
    description: string
    advice: string
    radarData?: Array<{ subject: string; value: number }>
  }
}

interface TestReportProps {
  result: TestResult
  onComplete: () => void
  onRetake: () => void
}

const TestReport: React.FC<TestReportProps> = ({ result, onComplete, onRetake }) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    setIsVisible(true)
  }, [])

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreEmoji = (percentage: number) => {
    if (percentage >= 80) return '🌟'
    if (percentage >= 60) return '😊'
    return '💪'
  }

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return '优秀表现！你的状态非常好'
    if (percentage >= 60) return '良好状态！继续保持积极心态'
    return '需要关注！让我们一起努力改善'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getWarmMessage = () => {
    const messages = [
      "每一次自我探索都是成长的开始",
      "你的勇气值得被赞赏",
      "关爱自己是最美的修行",
      "心理健康同样重要，你做得很好",
      "愿你在温暖的陪伴中找到力量"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-200"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-400"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* 专业头部标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-6 shadow-2xl transform hover:scale-110 transition-transform duration-300">
            <Heart className="w-10 h-10 text-blue-900 drop-shadow-lg" />
          </div>
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium mb-3">
              专业心理健康评估
            </span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            心理健康测评报告
          </h1>
          <p className="text-gray-600 text-lg font-medium">专业分析 · 温暖陪伴 · 科学建议</p>
          <div className="mt-4 text-sm text-purple-600 font-medium bg-purple-50 inline-block px-4 py-2 rounded-full">
            ✨ {getWarmMessage()}
          </div>
        </div>

        {/* 基本信息卡片 */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{result.test_name}</h3>
                <p className="text-gray-600 text-sm">
                  测试时间：{formatDate(result.completed_at)}
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                专业测评
              </Badge>
            </div>
          </div>
        </Card>

        {/* 得分展示 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 得分卡片 */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-800">测评得分</h3>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 ${getScoreColor(result.percentage)}`}>
                  {getScoreEmoji(result.percentage)} {result.score}
                  <span className="text-2xl text-gray-500">/{result.max_score}</span>
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  {result.percentage}%
                </div>
                <Progress value={result.percentage} className="h-3 mb-3" />
                <div className="text-sm text-gray-600">
                  {getScoreMessage(result.percentage)}
                </div>
              </div>
            </div>
          </Card>

          {/* 结果等级卡片 */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold text-gray-800">结果评级</h3>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {result.result_category}
                </div>
                <div className="text-gray-700 text-sm leading-relaxed">
                  {result.result_description}
                </div>
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">综合评估</div>
                  <div className="text-sm font-medium text-gray-800">
                    {result.percentage >= 80 ? '心理健康状态优秀' : 
                     result.percentage >= 60 ? '心理健康状态良好' : 
                     '需要关注心理健康'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 专业建议 */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-gray-800">专业建议</h3>
            </div>
            <div className="space-y-4">
              {result.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-900 text-xs font-bold">{index + 1}</span>
                  </div>
                  <div className="text-gray-700 leading-relaxed">{recommendation}</div>
                </div>
              ))}
              
              {result.result?.advice && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-blue-800">专家提示</span>
                  </div>
                  <div className="text-blue-700 text-sm leading-relaxed">
                    {result.result.advice}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 能力分析图 */}
        <CapabilityAnalysisChart 
          testType={result.test_type === 'iat' ? 'iat' : 'sexual_repression'}
          answers={result.answers}
          score={result.score}
          maxScore={result.max_score}
        />

        {/* 改进分析图 */}
        {(() => {
          // 生成能力数据用于改进分析
          const generateCapabilityData = () => {
            if (result.test_type === 'iat') {
              return [
                {
                  name: '时间管理',
                  value: Math.max(0, 100 - (((result.answers[1] || 1) + (result.answers[6] || 1) + (result.answers[16] || 1) + (result.answers[18] || 1) - 4) / 16) * 100),
                  color: '#10B981',
                  level: 'good',
                  improvement: '建议制定详细的上网时间表，使用番茄工作法管理时间'
                },
                {
                  name: '社交关系',
                  value: Math.max(0, 100 - (((result.answers[4] || 1) + (result.answers[10] || 1) + (result.answers[19] || 1) - 3) / 12) * 100),
                  color: '#3B82F6',
                  level: 'average',
                  improvement: '多参与线下活动，培养面对面交流技能'
                },
                {
                  name: '情绪调节',
                  value: Math.max(0, 100 - (((result.answers[14] || 1) + (result.answers[15] || 1) + (result.answers[20] || 1) - 3) / 12) * 100),
                  color: '#8B5CF6',
                  level: 'needs_improvement',
                  improvement: '学习冥想和深呼吸技巧，培养情绪觉察能力'
                },
                {
                  name: '生活平衡',
                  value: Math.max(0, 100 - (((result.answers[2] || 1) + (result.answers[5] || 1) + (result.answers[11] || 1) + (result.answers[13] || 1) - 4) / 16) * 100),
                  color: '#F59E0B',
                  level: 'average',
                  improvement: '建立健康的生活作息，培养多样化兴趣爱好'
                },
                {
                  name: '自我认知',
                  value: Math.max(0, 100 - (((result.answers[9] || 1) + (result.answers[12] || 1) + (result.answers[20] || 1) - 3) / 12) * 100),
                  color: '#EF4444',
                  level: 'excellent',
                  improvement: '定期进行自我反思，记录网络使用情况和感受'
                }
              ]
            } else {
              return [
                {
                  name: '性观念健康',
                  value: Math.max(0, 100 - (((result.answers[1] || 1) + (result.answers[3] || 1) + (result.answers[5] || 1) + (result.answers[11] || 1) - 4) / 16) * 100),
                  color: '#10B981',
                  level: 'good',
                  improvement: '学习科学的性知识，建立健康的性观念'
                },
                {
                  name: '情绪管理',
                  value: Math.max(0, 100 - (((result.answers[2] || 1) + (result.answers[8] || 1) + (result.answers[12] || 1) + (result.answers[15] || 1) - 4) / 16) * 100),
                  color: '#8B5CF6',
                  level: 'needs_improvement',
                  improvement: '学习情绪调节技巧，接纳自己的情感体验'
                },
                {
                  name: '自我接纳',
                  value: Math.max(0, 100 - (((result.answers[4] || 1) + (result.answers[6] || 1) + (result.answers[9] || 1) + (result.answers[13] || 1) - 4) / 16) * 100),
                  color: '#3B82F6',
                  level: 'average',
                  improvement: '练习自我接纳，理解性冲动是正常生理现象'
                },
                {
                  name: '行为控制',
                  value: Math.max(0, 100 - (((result.answers[6] || 1) + (result.answers[10] || 1) + (result.answers[14] || 1) - 3) / 12) * 100),
                  color: '#F59E0B',
                  level: 'average',
                  improvement: '培养健康的兴趣爱好，转移注意力技巧'
                }
              ]
            }
          }

          const capabilityData = generateCapabilityData()
          return <ImprovementChart capabilityData={capabilityData} />
        })()}

        {/* 温馨寄语 */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-pink-50 to-purple-50 backdrop-blur hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="text-center">
              <div className="text-3xl mb-3 animate-bounce">💝</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">温暖的寄语</h3>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>心理健康是一段持续的旅程，每一个测试都是对自己的关爱。</p>
                <p>记住，寻求帮助是勇敢的表现，我们始终陪伴在你身边。</p>
                <p className="font-medium text-purple-700">愿你在自我探索的道路上，找到内心的平静与力量。</p>
              </div>
              <div className="mt-4 text-xs text-purple-500 font-medium">
                🌈 你比你想象的更加坚强
              </div>
            </div>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onComplete}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            完成测试
          </Button>
          <Button 
            onClick={onRetake}
            variant="secondary"
            className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 px-8 py-3 rounded-xl font-medium transition-all duration-300"
          >
            重新测试
          </Button>
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-8 text-gray-500 text-sm space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>本测试仅供参考，如有需要请咨询专业心理健康人士</span>
          </div>
          <p className="text-purple-600 font-medium">💚 关爱自己，从心理健康开始</p>
          <div className="text-xs text-gray-400 mt-3">
            报告生成时间：{formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestReport