import React, { useState, useEffect } from 'react'
import { useTestStore } from '../stores/testStore'
import { useAuthStore } from '../stores/authStore'
import { testTypes } from '../data/testQuestions'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Calendar, Clock, TrendingUp, Award, Eye, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import TestReport from './TestReport'

interface TestHistoryViewerProps {
  userId: string
  onClose?: () => void
}

const TestHistoryViewer: React.FC<TestHistoryViewerProps> = ({ userId, onClose }) => {
  const { testHistory, fetchTestHistory, isLoading } = useTestStore()
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [showReport, setShowReport] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')

  useEffect(() => {
    fetchTestHistory(userId)
  }, [userId])

  // 过滤和排序测试历史
  const filteredAndSortedHistory = React.useMemo(() => {
    let filtered = testHistory

    // 按类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(test => test.test_type === filterType)
    }

    // 排序
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return b.score - a.score
      }
    })
  }, [testHistory, filterType, sortBy])

  const handleViewResult = (result: any) => {
    setSelectedResult(result)
    setShowReport(true)
  }

  const handleShareResult = (result: any) => {
    if (navigator.share) {
      navigator.share({
        title: '我的心理健康测评结果',
        text: `我刚刚完成了${testTypes[result.test_type as keyof typeof testTypes]?.name}，得分${result.score}分！`,
        url: window.location.href
      })
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(
        `我刚刚完成了${testTypes[result.test_type as keyof typeof testTypes]?.name}，得分${result.score}分！`
      )
      toast.success('结果已复制到剪贴板')
    }
  }

  const handleExportResult = (result: any) => {
    const exportData = {
      测试名称: testTypes[result.test_type as keyof typeof testTypes]?.name,
      得分: result.score,
      完成时间: new Date(result.created_at).toLocaleString(),
      结果描述: result.result?.description || '',
      建议: result.result?.advice || ''
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `心理健康测评_${result.test_type}_${new Date(result.created_at).toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('测试结果已导出')
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreEmoji = (percentage: number) => {
    if (percentage >= 80) return '🌟'
    if (percentage >= 60) return '😊'
    return '⚠️'
  }

  if (showReport && selectedResult) {
    return (
      <TestReport
        result={selectedResult}
        onComplete={() => {
          setShowReport(false)
          setSelectedResult(null)
        }}
        onRetake={() => {
          setShowReport(false)
          setSelectedResult(null)
          // 可以在这里添加重新测试的逻辑
        }}
      />
    )
  }

  return (
    <div className="min-h-screen gradient-healing p-6">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="relative mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">测试历史记录</h1>
            <p className="text-xl text-blue-800">查看您的心理健康测评历史</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 btn-secondary"
            >
              返回
            </button>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-light border-0">
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{testHistory.length}</div>
              <div className="text-blue-800">总测试次数</div>
            </div>
          </Card>
          
          <Card className="glass-light border-0">
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {testHistory.length > 0 ? Math.round(testHistory.reduce((sum, test) => sum + test.score, 0) / testHistory.length) : 0}
              </div>
              <div className="text-blue-800">平均分</div>
            </div>
          </Card>
          
          <Card className="glass-light border-0">
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {testHistory.filter(test => test.score >= 80).length}
              </div>
              <div className="text-blue-800">优秀次数</div>
            </div>
          </Card>
        </div>

        {/* 筛选和排序 */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-blue-800 font-medium">测试类型:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 rounded-lg border border-blue-200 bg-white/80"
              >
                <option value="all">全部</option>
                <option value="iat">iAT网络成瘾测试</option>
                <option value="sexual_repression">性压抑指数测试</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-blue-800 font-medium">排序:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                className="px-4 py-2 rounded-lg border border-blue-200 bg-white/80"
              >
                <option value="date">按时间</option>
                <option value="score">按分数</option>
              </select>
            </div>
          </div>
        </div>

        {/* 测试历史列表 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800">加载中...</p>
          </div>
        ) : filteredAndSortedHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-blue-900 mb-2">暂无测试记录</h3>
            <p className="text-blue-700 mb-4">完成您的心理健康测评，开始记录您的成长历程</p>
            <Button onClick={onClose} className="btn-healing">
              去测试
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAndSortedHistory.map((result, index) => {
              const percentage = Math.round((result.score / ((result as any).max_score || 100)) * 100)
              const testType = testTypes[result.test_type as keyof typeof testTypes]
              
              return (
                <Card key={result.id} className="glass border-0 hover:shadow-lg transition-all duration-300">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {testType?.name || '未知测试'}
                          </Badge>
                          <span className={`text-2xl ${getScoreColor(percentage)}`}>
                            {getScoreEmoji(percentage)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-blue-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(result.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(result.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            <span className="text-lg font-bold text-blue-900">
                              {result.score}分
                            </span>
                            <span className="text-sm text-blue-600">
                              ({percentage}%)
                            </span>
                          </div>
                          
                          {result.result?.description && (
                            <Badge variant="default" className="text-blue-700">
                              {result.result.description}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewResult(result)}
                          variant="secondary"
                          size="md"
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          查看
                        </Button>
                        
                        <Button
                          onClick={() => handleShareResult(result)}
                          variant="secondary"
                          size="md"
                          className="flex items-center gap-1"
                        >
                          <Share2 className="w-4 h-4" />
                          分享
                        </Button>
                        
                        <Button
                          onClick={() => handleExportResult(result)}
                          variant="secondary"
                          size="md"
                          className="flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          导出
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TestHistoryViewer