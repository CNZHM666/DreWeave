import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAssessmentStore, screeningSteps, ASRS_ITEMS, SVAS_ITEMS } from '../stores/assessmentStore'
import { getSuggestions, submitFeedback } from '../services/aiSuggestions'

export default function AddictionAssessment() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const st = useAssessmentStore()
  const goalId = params.get('goalId')
  React.useEffect(() => { if (goalId && st.status === 'idle') st.start(goalId) }, [goalId, st.status])
  const [highContrast, setHighContrast] = React.useState(false)
  const [review, setReview] = React.useState(false)
  const [aiTips, setAiTips] = React.useState<string[]>([])
  const totalSteps = screeningSteps.length
  React.useEffect(() => {
    if (st.status === 'completed') {
      getSuggestions({ questionnaire: st.scaleType as any, answers: st.answers, goalName: '', score: st.score }).then(setAiTips).catch(() => setAiTips([]))
    }
  }, [st.status])
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') st.stepIndex < totalSteps - 1 && st.next(); if (e.key === 'ArrowLeft') st.stepIndex > 0 && st.prev() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [st.stepIndex])
  const step = screeningSteps[st.stepIndex]
  const scaleItems = st.scaleType === 'ASRS' ? ASRS_ITEMS : SVAS_ITEMS
  const currentItems = st.stepIndex === 0 ? scaleItems : step.items
  const requireIds = currentItems.map(i => i.id)
  const answered = st.answers.filter(a => requireIds.includes(a.id))
  const allRequiredDone = answered.length >= requireIds.length
  const scrollTopSmooth = () => { try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {} }
  const goNext = () => { st.next(); setTimeout(scrollTopSmooth, 10) }
  const goPrev = () => { st.prev(); setTimeout(scrollTopSmooth, 10) }
  return (
    <div className={`${highContrast ? 'bg-black' : 'gradient-healing'} min-h-screen p-6`}>
      <div className="max-w-3xl mx-auto">
        <div className={`flex items-center justify-between px-4 py-3 rounded-2xl ${highContrast ? 'bg-yellow-300 text-black' : 'bg-white/20 text-blue-900'} backdrop-blur-lg`} role="banner" aria-label="问卷标题栏">
          <div className="flex items-center gap-3">
            <div className={`${highContrast ? 'bg-black' : 'bg-indigo-600'} w-8 h-8 rounded-full`} />
            <div className="text-[18px] font-bold">DREWEAVE 专业评估 · 成瘾筛查</div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[14px]">高对比度</label>
            <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
          </div>
        </div>
        <div className={`mt-4 p-4 rounded-2xl ${highContrast ? 'bg-white text-black' : 'glass-light bg-white/20 text-blue-900'} backdrop-blur-lg`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[16px] font-semibold">进度</div>
            <div className="text-[14px]">第 {st.stepIndex + 1} / {totalSteps} 步</div>
          </div>
          <div className="w-full h-2 bg-white/50 rounded" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((st.stepIndex+1)/totalSteps)*100)}>
            <div className={`${highContrast ? 'bg-black' : 'bg-indigo-600'} h-2 rounded`} style={{ width: `${Math.round(((st.stepIndex+1)/totalSteps)*100)}%` }} />
          </div>
        </div>
        {(!review && st.status !== 'completed') ? (
          <div className={`mt-4 p-4 rounded-2xl ${highContrast ? 'bg-white text-black' : 'glass-light bg-white/20 text-blue-900'} backdrop-blur-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[16px] font-semibold">第 {st.stepIndex + 1} 步 · {st.stepIndex===0?'标准量表评估':step.title}</div>
              {st.stepIndex===0 && (
                <select className="p-2 rounded-2xl bg-white/60 text-blue-900" value={st.scaleType} onChange={(e) => st.setScale(e.target.value as any)}>
                  <option value="ASRS">ASRS</option>
                  <option value="SVAS">短视频成瘾量表</option>
                </select>
              )}
            </div>
            <div className="space-y-4">
              {currentItems.map((it, idx) => (
                <div key={it.id} className="rounded-2xl p-3 bg-white/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[14px] font-semibold"><span className="mr-2">{idx + 1}.</span>{it.label}<span className="ml-1 text-red-600">*</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={it.label}>
                    {Array.from({ length: (it.max - it.min + 1) }).map((_, i) => {
                      const val = it.min + i
                      const selected = !!st.answers.find(a => a.id === it.id && a.value === val)
                      return (
                        <label key={val} className={`cursor-pointer px-3 py-2 rounded-2xl ${selected ? 'bg-indigo-600 text-white' : 'bg-white/70 text-blue-900 hover:bg-white'}`}>
                          <input type="radio" className="sr-only" name={it.id} value={val} onChange={() => st.answer(it.id, val)} />
                          {val}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button className="px-4 py-3 rounded-2xl bg-indigo-600 text-white active:scale-95 min-h-[44px]" onClick={goPrev}>上一步</button>
              <div className="flex gap-2">
                <button className="px-4 py-3 rounded-2xl bg-gray-600 text-white active:scale-95 min-h-[44px]" onClick={() => setReview(true)}>暂存/预览</button>
                {st.stepIndex < totalSteps - 1 ? (
                  <button disabled={!allRequiredDone} className={`px-4 py-3 rounded-2xl ${allRequiredDone ? 'bg-green-600' : 'bg-green-300'} text-white active:scale-95 min-h-[44px]`} onClick={goNext}>下一步</button>
                ) : (
                  <button disabled={!allRequiredDone} className={`px-4 py-3 rounded-2xl ${allRequiredDone ? 'bg-blue-600' : 'bg-blue-300'} text-white active:scale-95 min-h-[44px]`} onClick={() => setReview(true)}>进入汇总确认</button>
                )}
              </div>
            </div>
          </div>
        ) : st.status !== 'completed' ? (
          <div className={`mt-4 p-4 rounded-2xl ${highContrast ? 'bg-white text-black' : 'glass-light bg-white/20 text-blue-900'} backdrop-blur-lg`}>
            <div className="text-[16px] font-semibold mb-3">答案汇总确认</div>
            <ul className="space-y-2 text-[14px]">
              {(st.scaleType==='ASRS'?ASRS_ITEMS:SVAS_ITEMS).map(it => {
                const a = st.answers.find(x => x.id === it.id)
                return (<li key={it.id} className="flex justify-between"><span>{it.label}</span><span>{a?.value ?? '-'}</span></li>)
              })}
              {screeningSteps.flatMap(s => s.items).map(it => {
                const a = st.answers.find(x => x.id === it.id)
                return (<li key={it.id} className="flex justify-between"><span>{it.label}</span><span>{a?.value ?? '-'}</span></li>)
              })}
            </ul>
            <div className="mt-4 flex justify-between">
              <button className="px-4 py-3 rounded-2xl bg-gray-600 text-white active:scale-95 min-h-[44px]" onClick={() => setReview(false)}>返回修改</button>
              <button className="px-4 py-3 rounded-2xl bg-blue-600 text-white active:scale-95 min-h-[44px]" onClick={async () => { await st.complete() }}>提交并生成报告</button>
            </div>
          </div>
        ) : (
          <div className={`mt-4 p-4 rounded-2xl ${highContrast ? 'bg-white text-black' : 'glass-light bg-white/20 text-blue-900'} backdrop-blur-lg`}>
            <div className="text-[16px] font-semibold mb-2">评估报告</div>
            <div className="mb-2 text-[14px]">风险等级：{st.riskProfile}</div>
            <div className="mb-2 text-[14px]">分级说明：{st.riskNarrative}</div>
            <div className="mb-2 text-[14px]">评分：{st.score}</div>
            <div className="mb-2 text-[14px]">建议：</div>
            <ul className="list-disc ml-6 text-[14px]">{st.recommendations.map((r, i) => (<li key={i}>{r}</li>))}</ul>
            <div className="mt-3 text-[14px]">AI建议：</div>
            <ul className="list-disc ml-6 text-[14px]">{aiTips.map((r, i) => (<li key={i}>{r}</li>))}</ul>
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-2 rounded-2xl bg-green-600 text-white active:scale-95" onClick={() => submitFeedback({ helpful: true })}>有帮助</button>
              <button className="px-3 py-2 rounded-2xl bg-gray-600 text-white active:scale-95" onClick={() => submitFeedback({ helpful: false })}>无帮助</button>
            </div>
            <div className="mt-3 text-[14px]">下次跟进：{st.nextFollowUpISO || '未设定'}</div>
            <div className="mt-6 flex justify-between">
              <button className="px-4 py-3 rounded-2xl bg-gray-600 text-white active:scale-95 min-h-[44px]" onClick={() => { st.reset(); navigate('/discipline-journey') }}>返回自律之旅</button>
              <button className="px-4 py-3 rounded-2xl btn-healing min-h-[44px]" onClick={() => navigate('/goal/' + (st.goalId || ''))}>查看目标详情</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}