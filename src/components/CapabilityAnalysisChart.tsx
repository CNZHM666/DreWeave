import React, { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Target, TrendingUp, AlertTriangle, CheckCircle, Brain, Heart, Users, Clock, Home, Star } from 'lucide-react'

interface CapabilityData {
  name: string
  value: number
  color: string
  icon: React.ReactNode
  description: string
  improvement: string
  level: 'excellent' | 'good' | 'average' | 'needs_improvement'
}

interface CapabilityAnalysisProps {
  testType: 'iat' | 'sexual_repression'
  answers: Record<number, number>
  score: number
  maxScore: number
}

const CapabilityAnalysisChart: React.FC<CapabilityAnalysisProps> = ({ 
  testType, 
  answers, 
  score, 
  maxScore 
}) => {
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // 根据测试类型生成能力分析数据
  const generateCapabilityData = (): CapabilityData[] => {
    if (testType === 'iat') {
      return [
        {
          name: '时间管理',
          value: calculateTimeManagementScore(answers),
          color: '#10B981',
          icon: <Clock className="w-4 h-4" />,
          description: '对上网时间的控制能力',
          improvement: '建议制定详细的上网时间表，使用番茄工作法管理时间',
          level: 'good'
        },
        {
          name: '社交关系',
          value: calculateSocialScore(answers),
          color: '#3B82F6',
          icon: <Users className="w-4 h-4" />,
          description: '线上线下社交平衡能力',
          improvement: '多参与线下活动，培养面对面交流技能',
          level: 'average'
        },
        {
          name: '情绪调节',
          value: calculateEmotionalScore(answers),
          color: '#8B5CF6',
          icon: <Heart className="w-4 h-4" />,
          description: '应对网络情绪影响的能力',
          improvement: '学习冥想和深呼吸技巧，培养情绪觉察能力',
          level: 'needs_improvement'
        },
        {
          name: '生活平衡',
          value: calculateLifeBalanceScore(answers),
          color: '#F59E0B',
          icon: <Home className="w-4 h-4" />,
          description: '工作学习与娱乐的平衡',
          improvement: '建立健康的生活作息，培养多样化兴趣爱好',
          level: 'average'
        },
        {
          name: '自我认知',
          value: calculateSelfAwarenessScore(answers),
          color: '#EF4444',
          icon: <Brain className="w-4 h-4" />,
          description: '对网络使用问题的觉察',
          improvement: '定期进行自我反思，记录网络使用情况和感受',
          level: 'excellent'
        }
      ]
    } else {
      // 性压抑测试的能力分析
      return [
        {
          name: '性观念健康',
          value: calculateSexualAttitudeScore(answers),
          color: '#10B981',
          icon: <Heart className="w-4 h-4" />,
          description: '对性的科学认知程度',
          improvement: '学习科学的性知识，建立健康的性观念',
          level: 'good'
        },
        {
          name: '情绪管理',
          value: calculateSexualEmotionalScore(answers),
          color: '#8B5CF6',
          icon: <Brain className="w-4 h-4" />,
          description: '处理性相关情绪的能力',
          improvement: '学习情绪调节技巧，接纳自己的情感体验',
          level: 'needs_improvement'
        },
        {
          name: '自我接纳',
          value: calculateSelfAcceptanceScore(answers),
          color: '#3B82F6',
          icon: <Star className="w-4 h-4" />,
          description: '对自身性冲动的接纳程度',
          improvement: '练习自我接纳，理解性冲动是正常生理现象',
          level: 'average'
        },
        {
          name: '行为控制',
          value: calculateBehavioralControlScore(answers),
          color: '#F59E0B',
          icon: <Target className="w-4 h-4" />,
          description: '对性冲动的控制能力',
          improvement: '培养健康的兴趣爱好，转移注意力技巧',
          level: 'average'
        }
      ]
    }
  }

  // 计算各项能力分数的函数
  const calculateTimeManagementScore = (answers: Record<number, number>): number => {
    const relevantQuestions = [1, 6, 16, 18] // 时间相关题目
    const total = relevantQuestions.reduce((sum, q) => sum + (answers[q] || 1), 0)
    return Math.max(0, 100 - ((total - 4) / 16) * 100) // 转换为0-100分
  }

  const calculateSocialScore = (answers: Record<number, number>): number => {
    const relevantQuestions = [4, 10, 19] // 社交相关题目
    const total = relevantQuestions.reduce((sum, q) => sum + (answers[q] || 1), 0)
    return Math.max(0, 100 - ((total - 3) / 12) * 100)
  }

  const calculateEmotionalScore = (answers: Record<number, number>): number => {
    const relevantQuestions = [14, 15, 20] // 情绪相关题目
    const total = relevantQuestions.reduce((sum, q) => sum + (answers[q] || 1), 0)
    return Math.max(0, 100 - ((total - 3) / 12) * 100)
  }

  const calculateLifeBalanceScore = (answers: Record<number, number>): number => {
    const relevantQuestions = [2, 5, 11, 13] // 生活平衡相关题目
    const total = relevantQuestions.reduce((sum, q) => sum + (answers[q] || 1), 0)
    return Math.max(0, 100 - ((total - 4) / 16) * 100)
  }

  const calculateSelfAwarenessScore = (answers: Record<number, number>): number => {
    const relevantQuestions = [9, 12, 20] // 自我觉察相关题目
    const total = relevantQuestions.reduce((sum, q) => sum + (answers[q] || 1), 0)
    return Math.max(0, 100 - ((total - 3) / 12) * 100)
  }

  // 性压抑测试的计算函数
  const calculateSexualAttitudeScore = (answers: Record<number, number>): number => {
    const relevantQuestions = [1, 3, 5, 11] // 性观念相关题目
    const total = relevantQuestions.reduce((sum, q) => sum + (answers[q] || 1), 0)
    return Math.max(0, 100 - ((total - 4) / 16) * 100)
  }

  const calculateSexualEmotionalScore = (answers: Record<number, number>): number => {
    const relevantQuestions = [2, 8, 12, 15] // 性情绪相关题目
    const total = relevantQuestions.reduce((sum, q) => sum + (answers[q] || 1), 0)
    return Math.max(0, 100 - ((total - 4) / 16) * 100)
  }

  const calculateSelfAcceptanceScore = (answers: Record<number, number>): number => {
    const relevantQuestions = [4, 6, 9, 13] // 自我接纳相关题目
    const total = relevantQuestions.reduce((sum, q) => sum + (answers[q] || 1), 0)
    return Math.max(0, 100 - ((total - 4) / 16) * 100)
  }

  const calculateBehavioralControlScore = (answers: Record<number, number>): number => {
    const relevantQuestions = [6, 10, 14] // 行为控制相关题目
    const total = relevantQuestions.reduce((sum, q) => sum + (answers[q] || 1), 0)
    return Math.max(0, 100 - ((total - 3) / 12) * 100)
  }

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'excellent':
        return { text: '优秀', color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircle className="w-4 h-4 text-green-600" /> }
      case 'good':
        return { text: '良好', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <TrendingUp className="w-4 h-4 text-blue-600" /> }
      case 'average':
        return { text: '一般', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: <AlertTriangle className="w-4 h-4 text-yellow-600" /> }
      case 'needs_improvement':
        return { text: '需改进', color: 'text-red-600', bgColor: 'bg-red-100', icon: <AlertTriangle className="w-4 h-4 text-red-600" /> }
      default:
        return { text: '未知', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <Brain className="w-4 h-4 text-gray-600" /> }
    }
  }

  const capabilityData = generateCapabilityData()
  const pieData = capabilityData.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const fullData = capabilityData.find(item => item.name === data.name)
      if (fullData) {
        return (
          <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              {fullData.icon}
              <span className="font-semibold text-gray-800">{fullData.name}</span>
            </div>
            <div className="text-sm text-gray-600 mb-2">{fullData.description}</div>
            <div className="text-lg font-bold" style={{ color: fullData.color }}>
              {fullData.value.toFixed(1)}分
            </div>
          </div>
        )
      }
    }
    return null
  }

  return (
    <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold text-gray-800">能力分析图</h3>
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              多维度评估
            </Badge>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* 饼状图 */}
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-md font-semibold text-gray-700 mb-3">能力分布</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        onMouseEnter={(_, index) => setSelectedSlice(pieData[index].name)}
                        onMouseLeave={() => setSelectedSlice(null)}
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke={selectedSlice === entry.name ? '#374151' : 'none'}
                            strokeWidth={selectedSlice === entry.name ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 详细分析 */}
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">详细分析</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {capabilityData.map((item, index) => {
                    const levelInfo = getLevelInfo(item.level)
                    const isSelected = selectedSlice === item.name
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                          isSelected ? 'border-purple-400 bg-purple-50 shadow-md' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedSlice(selectedSlice === item.name ? null : item.name)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <span className="font-semibold text-gray-800">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold" style={{ color: item.color }}>
                              {item.value.toFixed(1)}分
                            </span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${levelInfo.bgColor} ${levelInfo.color}`}>
                              {levelInfo.icon}
                              <span className="ml-1">{levelInfo.text}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{item.description}</div>
                        {isSelected && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium text-blue-800">改进建议</span>
                            </div>
                            <div className="text-sm text-blue-700">{item.improvement}</div>
                          </div>
                        )}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${item.value}%`, 
                                backgroundColor: item.color 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 综合建议 */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <h4 className="text-md font-semibold text-gray-800">综合建议</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <div className="font-medium text-green-700 mb-1">🌟 优势领域</div>
                <div className="text-xs">
                  {capabilityData.filter(item => item.level === 'excellent' || item.level === 'good')
                    .map(item => item.name).join('、') || '持续发展中'}
                </div>
              </div>
              <div>
                <div className="font-medium text-orange-700 mb-1">🎯 重点关注</div>
                <div className="text-xs">
                  {capabilityData.filter(item => item.level === 'needs_improvement')
                    .map(item => item.name).join('、') || '整体表现良好'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default CapabilityAnalysisChart