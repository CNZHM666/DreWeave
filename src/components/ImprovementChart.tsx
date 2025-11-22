import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'
import { Card } from './ui/Card'
import { TrendingUp, Target, Brain, Activity, Zap, Award } from 'lucide-react'

interface ImprovementChartProps {
  capabilityData: Array<{
    name: string
    value: number
    color: string
    level: string
    improvement: string
  }>
}

const ImprovementChart: React.FC<ImprovementChartProps> = ({ capabilityData }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string>('all')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // 生成改进建议数据
  const generateImprovementData = () => {
    return capabilityData.map((item, index) => ({
      name: item.name,
      current: item.value,
      target: 100,
      improvement: Math.max(0, 100 - item.value),
      priority: item.level === 'needs_improvement' ? 'high' : 
                item.level === 'average' ? 'medium' : 'low',
      color: item.color
    }))
  }

  // 生成时间序列改进目标数据
  const generateTimelineData = () => {
    const weeks = ['第1周', '第2周', '第3周', '第4周', '第8周', '第12周']
    return weeks.map((week, index) => {
      const baseImprovement = index * 8 // 每周基础改进8分
      return {
        week,
        expected: Math.min(100, capabilityData.reduce((sum, item) => sum + item.value, 0) / capabilityData.length + baseImprovement),
        optimistic: Math.min(100, capabilityData.reduce((sum, item) => sum + item.value, 0) / capabilityData.length + baseImprovement * 1.2),
        conservative: Math.min(100, capabilityData.reduce((sum, item) => sum + item.value, 0) / capabilityData.length + baseImprovement * 0.8)
      }
    })
  }

  const improvementData = generateImprovementData()
  const timelineData = generateTimelineData()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔥'
      case 'medium': return '⚠️'
      case 'low': return '✅'
      default: return '📊'
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium">{entry.value.toFixed(1)}分</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 改进空间分析 */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-800">改进空间分析</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                目标导向
              </span>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={improvementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="current" 
                    name="当前分数" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                  <Bar 
                    dataKey="improvement" 
                    name="改进空间" 
                    fill="#E5E7EB" 
                    radius={[0, 0, 4, 4]}
                    animationDuration={2000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>当前水平</span>
                <div className="w-3 h-3 bg-gray-300 rounded ml-4"></div>
                <span>改进空间</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 改进时间线 */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-bold text-gray-800">改进时间线</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                进度预测
              </span>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="conservative" 
                    name="保守估计" 
                    stackId="1" 
                    stroke="#F59E0B" 
                    fill="#FEF3C7" 
                    fillOpacity={0.6}
                    animationDuration={2000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expected" 
                    name="预期进度" 
                    stackId="2" 
                    stroke="#10B981" 
                    fill="#D1FAE5" 
                    fillOpacity={0.8}
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="optimistic" 
                    name="乐观估计" 
                    stackId="3" 
                    stroke="#3B82F6" 
                    fill="#DBEAFE" 
                    fillOpacity={0.4}
                    animationDuration={2500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>预期进度</span>
                <div className="w-3 h-3 bg-yellow-500 rounded ml-4"></div>
                <span>保守估计</span>
                <div className="w-3 h-3 bg-blue-500 rounded ml-4"></div>
                <span>乐观估计</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 优先级建议 */}
      <Card className="mt-6 border-0 shadow-lg bg-white/80 backdrop-blur">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold text-gray-800">改进优先级建议</h3>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              行动指南
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {improvementData
              .sort((a, b) => b.improvement - a.improvement) // 按改进空间排序
              .slice(0, 6) // 取前6个
              .map((item, index) => {
                const originalData = capabilityData.find(d => d.name === item.name)
                return (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPriorityIcon(item.priority)}</span>
                        <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority === 'high' ? '优先' : item.priority === 'medium' ? '重要' : '关注'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>当前: {item.current.toFixed(1)}分</span>
                        <span>目标: 100分</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500 group-hover:shadow-md"
                          style={{ 
                            width: `${item.current}%`, 
                            backgroundColor: item.color 
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        改进空间: <span className="font-medium">{item.improvement.toFixed(1)}分</span>
                      </div>
                    </div>
                    
                    {originalData && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                        💡 {originalData.improvement}
                      </div>
                    )}
                  </div>
                )
              })
            }
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-purple-800">改进建议</span>
            </div>
            <div className="text-sm text-purple-700 space-y-1">
              <p>• 从优先级高的能力开始改进，循序渐进</p>
              <p>• 设定小目标，每周评估进展情况</p>
              <p>• 结合专业建议和个人实际情况制定计划</p>
              <p>• 保持耐心，心理健康的改善需要时间</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ImprovementChart