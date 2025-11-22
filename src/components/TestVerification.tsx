import React from 'react'
import { useTestStore } from '../stores/testStore'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

const TestVerification: React.FC = () => {
  const { 
    startTest, 
    submitTest, 
    currentTest, 
    currentQuestion, 
    answers,
    isLoading,
    error 
  } = useTestStore()

  const testSexualRepressionCompletion = async () => {
    console.log('🧪 开始测试性压抑量表完成功能')
    
    // 开始性压抑量表测试
    startTest('sexual_repression')
    console.log('✅ 已开始性压抑量表测试')
    
    // 模拟回答所有问题（性压抑量表有20道题）
    const mockAnswers: Record<number, number> = {}
    for (let i = 1; i <= 20; i++) {
      mockAnswers[i] = Math.floor(Math.random() * 5) + 1 // 1-5的随机分数
    }
    
    console.log('📝 模拟答题数据:', mockAnswers)
    
    // 使用测试存储的submitTest功能
    try {
      console.log('🚀 准备提交测试结果...')
      const result = await submitTest('test_user_id')
      
      if (result) {
        console.log('✅ 测试提交成功!', result)
        alert(`测试提交成功！\n得分: ${result.score}\n结果: ${result.result.description}\n建议: ${result.result.advice}`)
      } else {
        console.log('❌ 测试提交失败，结果为null')
        alert('测试提交失败，请检查控制台日志')
      }
    } catch (error: any) {
      console.error('❌ 测试提交出错:', error)
      alert(`测试提交出错: ${error}`)
    }
  }

  return (
    <Card className="p-6 max-w-md mx-auto mt-8">
      <h3 className="text-lg font-bold mb-4">性压抑量表测试验证</h3>
      <p className="text-gray-600 mb-4">点击按钮测试性压抑量表的完成功能</p>
      
      <div className="space-y-4">
        <Button 
          onClick={testSexualRepressionCompletion}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? '测试中...' : '测试性压抑量表完成'}
        </Button>
        
        {currentTest && (
          <div className="text-sm text-gray-500">
            <p>当前测试: {currentTest}</p>
            <p>当前题目: {currentQuestion + 1}</p>
            <p>已答题数: {Object.keys(answers).length}</p>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-sm">
            错误: {error}
          </div>
        )}
      </div>
    </Card>
  )
}

export default TestVerification