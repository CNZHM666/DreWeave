type SuggestionInput = { userId?: string; questionnaire: 'ASRS' | 'SVAS'; answers: Array<{ id: string; value: number }>; goalName?: string; score?: number }

export async function getSuggestions(input: SuggestionInput): Promise<string[]> {
  const base = (import.meta as any).env?.VITE_AI_API_URL || ''
  const url = base ? `${String(base).replace(/\/$/, '')}/api/ai/suggestions` : '/api/ai/suggestions'
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(input)
    })
    if (resp.ok) {
      const data = await resp.json().catch(() => null)
      if (data && Array.isArray(data.tips)) return data.tips
    }
  } catch {}
  return buildTemplateSuggestions(input)
}

export function submitFeedback(payload: { helpful: boolean; comment?: string }) {
  try {
    const key = 'dreweave_ai_feedback'
    const arr = JSON.parse(localStorage.getItem(key) || '[]')
    arr.push({ ...payload, ts: Date.now() })
    localStorage.setItem(key, JSON.stringify(arr))
  } catch {}
}

function buildTemplateSuggestions(input: SuggestionInput): string[] {
  const sum = (input.answers || []).reduce((acc, a) => acc + Number(a.value || 0), 0)
  const now = new Date()
  const riskScore = typeof input.score === 'number' ? input.score : Math.max(0, Math.min(100, Math.round(sum / Math.max(1, (input.questionnaire === 'ASRS' ? 24 : 10)) * 100)))
  const high = riskScore >= 70
  const mid = riskScore >= 40 && riskScore < 70
  const d = new Date(now)
  d.setDate(d.getDate() + (high ? 7 : 14))
  const follow = d.toISOString().slice(0, 10)
  const name = String(input.goalName || '').trim()
  const header = '本建议仅供参考，不构成医疗诊断。如存在高风险或不适，请尽快寻求专业帮助。'
  if (input.questionnaire === 'SVAS') {
    const s1 = `风险提醒：${high ? '短视频使用风险较高，建议尽快进行专业评估与干预' : mid ? '存在短视频过度使用风险，请及时采取调整策略' : '当前短视频使用风险较低，请保持良好习惯'}`
    const s2 = `短期计划（1–2周）：设置每日总时长上限与睡前禁用时段，为“${name || '目标'}”制定替代活动（散步/阅读/冥想），记录每日实际时长。`
    const s3 = `中期计划（3–4周）：固定无屏时间（如餐前/睡前1小时），使用应用限制与屏蔽工具，建立支持系统（家人/同伴提醒）。`
    const s4 = `自助工具：数字健康时长记录、替代活动清单、情绪与诱因记录，每周复盘一次执行率与情绪变化。`
    const s5 = high
      ? '资源清单：心理咨询门诊、心理援助热线、同伴支持小组；尽快预约评估并设置随访计划。'
      : mid
      ? '资源清单：心理咨询门诊与线上支持社区；建议进行初次咨询并建立家庭/同伴支持。'
      : '资源清单：数字健康工具与线上自助社区；关注无屏时间与替代活动执行率。'
    const s6 = `复评日期：${follow}`
    return [header, s1, s2, s3, s4, s5, s6]
  }
  const s1 = `短期计划（1–2周）：拆分任务为最小可行步骤，为“${name || '目标'}”使用25分钟时间块（番茄），配合环境提示（桌面清理/应用屏蔽），每日完成后做1分钟总结。`
  const s2 = `中期计划（3–4周）：建立固定例程（每日同一时段开始），每周复盘产出与阻碍，按优先级调整任务列表并设置阶段性里程碑。`
  const s3 = `自助工具：时间块计时器、待办分组（重要/可延后）、视觉提示卡、每周目标看板。`
  const s4 = high ? '建议尽快进行专业评估，必要时寻求临床支持。' : mid ? '如策略实施后仍影响显著，建议预约专业评估。' : '保持习惯并在复评期检查变化。'
  const s5 = `复评日期：${follow}`
  return [header, s1, s2, s3, s4, s5]
}