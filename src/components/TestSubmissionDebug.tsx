import React, { useState } from 'react'
import { useTestStore } from '../stores/testStore'
import { useAuthStore } from '../stores/authStore'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Brain, Heart, Activity } from 'lucide-react'

const TestSubmissionDebug: React.FC = () => {
  const { user } = useAuthStore()
  const { submitTest, startTest, answers, currentTest } = useTestStore()
  const [testResult, setTestResult] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartSexualRepressionTest = () => {
    console.log('🚀 开始性压抑测试')
    startTest('sexual_repression')
  }

  const handleStartIATTest = () => {
    console.log('🚀 开始IAT测试')
    startTest('iat')
  }

  const handleSubmitTest = async () => {
    if (!user?.id) {
      setError('用户未登录')
      return
    }

    if (!currentTest) {
      setError('没有正在进行的测试')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      console.log('📝 提交测试:', { userId: user.id, currentTest, answers })
      const result = await submitTest(user.id)
      console.log('✅ 测试结果:', result)
      setTestResult(result)
    } catch (err: any) {
      console.error('❌ 测试提交失败:', err)
      setError(err.message || '测试提交失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSimulateCompleteAnswers = () => {
    console.log('📝 模拟完整答题')
    if (currentTest === 'sexual_repression') {
      // 模拟性压抑测试答案
      const sexualAnswers = {
        1: 2, 2: 3, 3: 2, 4: 4, 5: 2, 6: 3, 7: 2, 8: 4, 9: 3, 10: 2,
        11: 2, 12: 3, 13: 2, 14: 4, 15: 3
      }
      console.log('💝 性压抑测试答案:', sexualAnswers)
    } else if (currentTest === 'iat') {
      // 模拟IAT测试答案
      const iatAnswers = {
        1: 3, 2: 2, 3: 4, 4: 2, 5: 3, 6: 4, 7: 2, 8: 3, 9: 2, 10: 3,
        11: 4, 12: 3, 13: 2, 14: 4, 15: 3, 16: 4, 17: 2, 18: 3, 19: 2, 20: 4
      }
      console.log('🌐 IAT测试答案:', iatAnswers)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            测试提交调试工具
          </h1>
          <p className="text-gray-600">调试性压抑量表和IAT测试的提交功能</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 用户状态 */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800">用户状态</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">登录状态:</span>
                <span className={user ? 'text-green-600' : 'text-red-600'}>
                  {user ? '已登录' : '未登录'}
                </span>
              </div>
              {user && (
                <div className="flex justify-between">
                  <span className="text-gray-600">用户ID:</span>
                  <span className="text-blue-600 font-mono text-xs">{user.id}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">当前测试:</span>
                <span className={currentTest ? 'text-purple-600' : 'text-gray-400'}>
                  {currentTest || '无'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">已答题数:</span>
                <span className="text-blue-600">{Object.keys(answers).length}</span>
              </div>
            </div>
          </Card>

          {/* 测试控制 */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-800">测试控制</h2>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleStartSexualRepressionTest}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Heart className="w-4 h-4 mr-2" />
                开始性压抑测试
              </Button>
              <Button
                onClick={handleStartIATTest}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Brain className="w-4 h-4 mr-2" />
                开始IAT测试
              </Button>
              <Button
                onClick={handleSimulateCompleteAnswers}
                variant="secondary"
                className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                模拟完整答题
              </Button>
            </div>
          </Card>
        </div>

        {/* 提交测试 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-800">提交测试</h2>
          </div>
          <div className="space-y-4">
            <Button
              onClick={handleSubmitTest}
              disabled={isSubmitting || !user?.id || !currentTest}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  提交中...
                </>
              ) : (
                '提交测试'
              )}
            </Button>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                ❌ {error}
              </div>
            )}
            
            {testResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                ✅ 测试提交成功！得分: {testResult.score}分
                <div className="mt-1 text-xs text-green-600">
                  测试类型: {testResult.test_name}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 调试信息 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-800">调试信息</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-700 space-y-1">
            <div>当前测试: {currentTest || 'null'}</div>
            <div>答案数量: {Object.keys(answers).length}</div>
            <div>用户状态: {user ? '已登录' : '未登录'}</div>
            {user && <div>用户ID: {user.id}</div>}
          </div>
          {Object.keys(answers).length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">当前答案:</div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 max-h-32 overflow-y-auto">
                {JSON.stringify(answers, null, 2)}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default TestSubmissionDebug