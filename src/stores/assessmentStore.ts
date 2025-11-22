import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import supabase from '../config/supabase'

type Answer = { id: string; value: number }

type ScaleType = 'ASRS' | 'SVAS'

interface AssessmentState {
  goalId: string | null
  status: 'idle' | 'in_progress' | 'completed'
  stepIndex: number
  answers: Answer[]
  score: number
  riskProfile: string
  riskNarrative: string
  recommendations: string[]
  nextFollowUpISO: string | null
  scaleType: ScaleType
}

interface AssessmentActions {
  start: (goalId: string) => void
  answer: (id: string, value: number) => void
  next: () => void
  prev: () => void
  compute: () => Promise<void>
  complete: () => Promise<void>
  reset: () => void
  setScale: (t: ScaleType) => void
}

interface AssessmentStore extends AssessmentState, AssessmentActions {}

export const screeningSteps = [
  { id: 'screen_impact', title: '对日常生活影响', items: [
    { id: 'impact_work', label: '工作/学习受影响程度', min: 0, max: 4 },
    { id: 'impact_family', label: '家庭/社交受影响程度', min: 0, max: 4 },
    { id: 'impact_health', label: '身心健康受影响程度', min: 0, max: 4 },
  ]},
  { id: 'screen_frequency', title: '行为频率与持续时间', items: [
    { id: 'freq', label: '过去30天每周发生频次', min: 0, max: 7 },
    { id: 'duration', label: '过去90天平均持续时间(小时)', min: 0, max: 24 },
  ]},
  { id: 'screen_severity', title: '严重程度自评', items: [
    { id: 'severity', label: '总体严重程度(0-10)', min: 0, max: 10 },
  ]},
]

export const ASRS_ITEMS = [
  { id: 'asrs_1', label: '完成细节时粗心犯错', min: 0, max: 4, required: true },
  { id: 'asrs_2', label: '难以保持注意力', min: 0, max: 4, required: true },
  { id: 'asrs_3', label: '在工作或娱乐中难以组织任务', min: 0, max: 4, required: true },
  { id: 'asrs_4', label: '经常丢失任务或活动所需物品', min: 0, max: 4, required: true },
  { id: 'asrs_5', label: '容易被外界刺激分散注意力', min: 0, max: 4, required: true },
  { id: 'asrs_6', label: '忘记日常活动', min: 0, max: 4, required: true },
  { id: 'asrs_7', label: '难以按时完成任务', min: 0, max: 4, required: true },
  { id: 'asrs_8', label: '在需要专注时容易走神', min: 0, max: 4, required: true },
  { id: 'asrs_9', label: '避免需要长时间集中注意的任务', min: 0, max: 4, required: true },
  { id: 'asrs_10', label: '坐立不安或难以保持安静', min: 0, max: 4, required: true },
  { id: 'asrs_11', label: '说话过多或打断他人', min: 0, max: 4, required: true },
  { id: 'asrs_12', label: '难以等待或遵守顺序', min: 0, max: 4, required: true },
]

export const SVAS_ITEMS = [
  { id: 'svas_1', label: '过去7天每日刷短视频超过1小时', min: 0, max: 1, required: true },
  { id: 'svas_2', label: '计划停止但经常超时继续刷', min: 0, max: 1, required: true },
  { id: 'svas_3', label: '因刷短视频影响工作或学习', min: 0, max: 1, required: true },
  { id: 'svas_4', label: '睡前刷短视频导致晚睡或睡眠不足', min: 0, max: 1, required: true },
  { id: 'svas_5', label: '停用短视频时出现焦虑/烦躁等不适', min: 0, max: 1, required: true },
  { id: 'svas_6', label: '为刷短视频放弃线下社交或兴趣活动', min: 0, max: 1, required: true },
  { id: 'svas_7', label: '经常在通勤/吃饭/休息时不自觉刷短视频', min: 0, max: 1, required: true },
  { id: 'svas_8', label: '刷短视频后出现内疚但难以改变', min: 0, max: 1, required: true },
  { id: 'svas_9', label: '设置过时长限制但经常绕过或关闭', min: 0, max: 1, required: true },
  { id: 'svas_10', label: '短视频内容导致情绪波动或注意力涣散', min: 0, max: 1, required: true },
]

export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set, get) => ({
      goalId: null,
      status: 'idle',
      stepIndex: 0,
      answers: [],
      score: 0,
      riskProfile: '',
      riskNarrative: '',
      recommendations: [],
      nextFollowUpISO: null,
      scaleType: 'ASRS',

      start: (goalId) => {
        set({ goalId, status: 'in_progress', stepIndex: 0, answers: [], score: 0, riskProfile: '', recommendations: [], nextFollowUpISO: null })
      },
      answer: (id, value) => {
        const arr = [...get().answers]
        const idx = arr.findIndex(a => a.id === id)
        if (idx >= 0) arr[idx] = { id, value }
        else arr.push({ id, value })
        set({ answers: arr })
      },
      next: () => {
        const i = get().stepIndex + 1
        set({ stepIndex: Math.min(i, screeningSteps.length - 1) })
      },
      prev: () => {
        const i = get().stepIndex - 1
        set({ stepIndex: Math.max(0, i) })
      },
      compute: async () => {
        const ans = get().answers
        const scale = get().scaleType
        let raw = 0
        if (scale === 'ASRS') {
          const ids = new Set(ASRS_ITEMS.map(i => i.id))
          for (const a of ans) if (ids.has(a.id)) raw += Number(a.value || 0)
        } else {}
        let score = 0
        let risk = '低风险'
        let narrative = ''
        if (scale === 'ASRS') {
          const partAIds = new Set(['asrs_1','asrs_2','asrs_3','asrs_4','asrs_5','asrs_6'])
          let partA = 0
          let partB = 0
          let partACoreCount = 0
          for (const a of ans) {
            const v = Number(a.value || 0)
            if (partAIds.has(a.id)) partA += v
            else partB += v
            if (partAIds.has(a.id) && v >= 3) partACoreCount++
          }
          const weighted = partA * 1.5 + partB
          const maxWeighted = (6 * 4 * 1.5) + ((ASRS_ITEMS.length - 6) * 4)
          score = Math.max(0, Math.min(100, Math.round((weighted / maxWeighted) * 100)))
          if (score >= 70) risk = '高风险'
          else if (score >= 40) risk = '中风险'
          const positiveA = partACoreCount >= 4
          if (positiveA && risk === '低风险') risk = '中风险'
          narrative = risk === '高风险'
            ? 'ASRS评分较高，注意力与组织可能显著受影响，建议尽快进行专业评估与干预。'
            : risk === '中风险'
            ? 'ASRS评分中等，建议采用任务拆分与时间块等行为策略，并观察变化。'
            : 'ASRS评分较低，当前风险较小，保持良好习惯并定期复评。'
          if (positiveA) {
            narrative = 'ASRS Part A 初筛阳性（≥4项为经常/非常经常），建议进一步进行专业评估。' + (risk !== '低风险' ? `（当前风险等级：${risk}）` : '')
          }
          const partBHigh = partB >= 10
          if (partBHigh) {
            narrative += ' 伴随Part B项目得分较高，建议加入环境控制与自我监控策略（减少干扰源、设定行为提示）。'
          }
        } else {
          const ids = new Set(SVAS_ITEMS.map(i => i.id))
          let rawSVAS = 0
          for (const a of ans) if (ids.has(a.id)) rawSVAS += Number(a.value || 0)
          score = Math.max(0, Math.min(100, Math.round((rawSVAS / SVAS_ITEMS.length) * 100)))
          if (rawSVAS >= 6) risk = '高风险'
          else if (rawSVAS >= 3) risk = '中风险'
          narrative = rawSVAS >= 6
            ? '短视频成瘾风险为高（≥6），建议尽快进行专业评估，并制定屏幕时间管理与替代行为计划。'
            : rawSVAS >= 3
            ? '短视频成瘾风险为中（3–5），建议减少高诱因场景、设置时长限制并建立支持系统。'
            : '短视频成瘾风险为低（0–2），保持良好使用习惯并在复评期检查变化。'
        }
        const recs: string[] = []
        if (risk === '高风险') recs.push('建议尽快寻求专业咨询与治疗')
        if (risk !== '低风险') recs.push('设置短周期目标，增加正向替代行为')
        recs.push('使用自助工具进行日常监测与记录')
        const d = new Date(); d.setDate(d.getDate() + (risk === '高风险' ? 7 : 14))
        const follow = d.toISOString().slice(0, 10)
        set({ score, riskProfile: risk, riskNarrative: narrative, recommendations: recs, nextFollowUpISO: follow })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const uid = session?.user?.id
          if (uid) {
            await supabase.from('assessments').insert({ user_id: uid, goal_id: get().goalId, score, risk_profile: risk, recommendations: recs, next_follow_up: follow, answers: ans, created_at: new Date().toISOString() })
          }
        } catch {}
      },
      complete: async () => {
        await get().compute()
        set({ status: 'completed' })
      },
      reset: () => {
        set({ goalId: null, status: 'idle', stepIndex: 0, answers: [], score: 0, riskProfile: '', recommendations: [], nextFollowUpISO: null })
      },
      setScale: (t) => set({ scaleType: t })
    }),
    { name: 'dreweave_assessment_store' }
  )
)