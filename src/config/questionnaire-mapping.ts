export type ScaleType = 'ASRS' | 'SVAS'

type MappingItem = {
  goalType: string
  keywords: string[]
  questionnaire: ScaleType
  weight: number
}

const MAPPINGS: MappingItem[] = [
  { goalType: '短视频节制', keywords: ['短视频','刷视频','抖音','快手','视频成瘾'], questionnaire: 'SVAS', weight: 4 },
  { goalType: '专注', keywords: ['注意力', '专注', '拖延', '组织'], questionnaire: 'ASRS', weight: 3 },
  { goalType: '早起', keywords: ['早起', '作息', '规律'], questionnaire: 'ASRS', weight: 1 },
  { goalType: '冥想', keywords: ['冥想', '正念', '焦虑'], questionnaire: 'ASRS', weight: 1 },
]

export function determineQuestionnaireForGoal(name: string): ScaleType {
  const n = String(name || '').toLowerCase()
  let best: { score: number; q: ScaleType } | null = null
  for (const it of MAPPINGS) {
    let score = 0
    for (const k of it.keywords) {
      if (n.includes(k.toLowerCase())) score += it.weight
    }
    if (!best || score > best.score) best = { score, q: it.questionnaire }
  }
  return best && best.score > 0 ? best.q : 'ASRS'
}