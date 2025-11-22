import React from 'react'
import CapabilityAnalysisChart from '../components/CapabilityAnalysisChart'
import ImprovementChart from '../components/ImprovementChart'

const TestCapabilityAnalysis: React.FC = () => {
  // 模拟IAT测试数据
  const iatTestData = {
    testType: 'iat' as const,
    answers: {
      1: 3, 2: 2, 3: 4, 4: 2, 5: 3, 6: 4, 7: 2, 8: 3, 9: 2, 10: 3,
      11: 4, 12: 3, 13: 2, 14: 4, 15: 3, 16: 4, 17: 2, 18: 3, 19: 2, 20: 4
    },
    score: 65,
    maxScore: 100
  }

  // 模拟性压抑测试数据
  const sexualRepressionData = {
    testType: 'sexual_repression' as const,
    answers: {
      1: 2, 2: 3, 3: 2, 4: 4, 5: 2, 6: 3, 7: 2, 8: 4, 9: 3, 10: 2,
      11: 2, 12: 3, 13: 2, 14: 4, 15: 3
    },
    score: 45,
    maxScore: 75
  }

  // 生成能力数据用于改进分析
  const generateCapabilityData = (testType: 'iat' | 'sexual_repression', answers: Record<number, number>) => {
    if (testType === 'iat') {
      return [
        {
          name: '时间管理',
          value: Math.max(0, 100 - (((answers[1] || 1) + (answers[6] || 1) + (answers[16] || 1) + (answers[18] || 1) - 4) / 16) * 100),
          color: '#10B981',
          level: 'good' as const,
          improvement: '建议制定详细的上网时间表，使用番茄工作法管理时间'
        },
        {
          name: '社交关系',
          value: Math.max(0, 100 - (((answers[4] || 1) + (answers[10] || 1) + (answers[19] || 1) - 3) / 12) * 100),
          color: '#3B82F6',
          level: 'average' as const,
          improvement: '多参与线下活动，培养面对面交流技能'
        },
        {
          name: '情绪调节',
          value: Math.max(0, 100 - (((answers[14] || 1) + (answers[15] || 1) + (answers[20] || 1) - 3) / 12) * 100),
          color: '#8B5CF6',
          level: 'needs_improvement' as const,
          improvement: '学习冥想和深呼吸技巧，培养情绪觉察能力'
        },
        {
          name: '生活平衡',
          value: Math.max(0, 100 - (((answers[2] || 1) + (answers[5] || 1) + (answers[11] || 1) + (answers[13] || 1) - 4) / 16) * 100),
          color: '#F59E0B',
          level: 'average' as const,
          improvement: '建立健康的生活作息，培养多样化兴趣爱好'
        },
        {
          name: '自我认知',
          value: Math.max(0, 100 - (((answers[9] || 1) + (answers[12] || 1) + (answers[20] || 1) - 3) / 12) * 100),
          color: '#EF4444',
          level: 'excellent' as const,
          improvement: '定期进行自我反思，记录网络使用情况和感受'
        }
      ]
    } else {
      return [
        {
          name: '性观念健康',
          value: Math.max(0, 100 - (((answers[1] || 1) + (answers[3] || 1) + (answers[5] || 1) + (answers[11] || 1) - 4) / 16) * 100),
          color: '#10B981',
          level: 'good' as const,
          improvement: '学习科学的性知识，建立健康的性观念'
        },
        {
          name: '情绪管理',
          value: Math.max(0, 100 - (((answers[2] || 1) + (answers[8] || 1) + (answers[12] || 1) + (answers[15] || 1) - 4) / 16) * 100),
          color: '#8B5CF6',
          level: 'needs_improvement' as const,
          improvement: '学习情绪调节技巧，接纳自己的情感体验'
        },
        {
          name: '自我接纳',
          value: Math.max(0, 100 - (((answers[4] || 1) + (answers[6] || 1) + (answers[9] || 1) + (answers[13] || 1) - 4) / 16) * 100),
          color: '#3B82F6',
          level: 'average' as const,
          improvement: '练习自我接纳，理解性冲动是正常生理现象'
        },
        {
          name: '行为控制',
          value: Math.max(0, 100 - (((answers[6] || 1) + (answers[10] || 1) + (answers[14] || 1) - 3) / 12) * 100),
          color: '#F59E0B',
          level: 'average' as const,
          improvement: '培养健康的兴趣爱好，转移注意力技巧'
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            能力分析图表测试
          </h1>
          <p className="text-gray-600">测试饼状图和改进分析功能</p>
        </div>

        {/* IAT能力分析 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">🌐 IAT网络成瘾能力分析</h2>
          <CapabilityAnalysisChart {...iatTestData} />
        </div>

        {/* 性压抑能力分析 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">💝 性压抑能力分析</h2>
          <CapabilityAnalysisChart {...sexualRepressionData} />
        </div>

        {/* 改进分析 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">📈 改进分析图表</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">网络成瘾改进分析</h3>
              <ImprovementChart capabilityData={generateCapabilityData('iat', iatTestData.answers)} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">性压抑改进分析</h3>
              <ImprovementChart capabilityData={generateCapabilityData('sexual_repression', sexualRepressionData.answers)} />
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="bg-white/80 backdrop-blur rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 功能特点</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>交互式饼状图，支持悬停和点击</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">✅</span>
                <span>多维度能力分析（5个核心维度）</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✅</span>
                <span>智能评分算法，基于具体问题</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✅</span>
                <span>改进空间分析和时间线预测</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500">✅</span>
                <span>优先级建议和具体行动计划</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-indigo-500">✅</span>
                <span>专业美观的可视化设计</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestCapabilityAnalysis