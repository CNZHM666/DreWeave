import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, x-debug') } catch {}
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') { res.status(200).json({ ok: true, provider: String(process.env.AI_PROVIDER || '') || 'auto' }); return }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method_not_allowed' }); return }
  const provider = String(process.env.AI_PROVIDER || '').toLowerCase()
  const openKey = process.env.OPENROUTER_API_KEY || ''
  const dashKey = process.env.DASHSCOPE_API_KEY || ''
  if (!openKey && !dashKey) { res.status(500).json({ ok: false, error: 'server_env_missing' }); return }
  const { questionnaire, answers, goalName, score } = (req.body || {}) as { questionnaire?: 'ASRS'|'SVAS'; answers?: Array<{ id: string; value: number }>; goalName?: string; score?: number }
  const q = questionnaire === 'SVAS' ? 'SVAS' : 'ASRS'
  const sum = Array.isArray(answers) ? answers.reduce((acc, a) => acc + Number(a?.value || 0), 0) : 0
  const s = typeof score === 'number' ? score : sum
  const sys = '你是健康行为干预助手，依据标准量表（ASRS/SVAS）与用户评分生成专业但非诊断性的建议。要求：1) 用中文，2) 结构化分短期(1–2周)/中期(3–4周)，3) 给出自助工具与复评日期，4) 高风险时明确建议寻求专业帮助。仅输出JSON数组字符串，每项为一句建议，不要包含其他文本或解释。'
  const user = `量表: ${q}\n分数: ${s}\n目标: ${String(goalName||'').trim()||'未提供'}\n要点: ${Array.isArray(answers)?answers.slice(0,6).map(a=>`${a.id}:${a.value}`).join(', '):''}\n请根据上述信息给出分阶段建议与复评时间，严格输出JSON数组。`
  try {
    async function call(which: 'dashscope'|'openrouter') {
      const useDash = which === 'dashscope'
      const headers: Record<string,string> = useDash
        ? { 'Authorization': `Bearer ${dashKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
        : { 'Authorization': `Bearer ${openKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
      if (!useDash) {
        const url = 'https://openrouter.ai/api/v1/chat/completions'
        const body = { model: 'qwen/qwen2.5-7b-instruct', messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], temperature: 0.7 }
        const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
        const status = resp.status
        let raw = ''; try { raw = await resp.text() } catch {}
        let text = ''; try { const data = JSON.parse(raw); text = data?.choices?.[0]?.message?.content || '' } catch {}
        let tips: string[] = []
        if (text) { try { const parsed = JSON.parse(text); if (Array.isArray(parsed)) tips = parsed.map(x=>String(x)) } catch { tips = String(text).split('\n').map(l=>l.replace(/^[-*\s]+/,'')).filter(Boolean) } }
        console.log('[ai/suggestions]', { provider: which, status, length: raw.length })
        return { tips, status }
      }
      const endpoints = ['https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions']
      const models = ['qwen-turbo-latest', 'qwen2.5-7b-instruct']
      for (const ep of endpoints) {
        for (const m of models) {
          const body = { model: m, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], temperature: 0.7 }
          const resp = await fetch(ep, { method: 'POST', headers, body: JSON.stringify(body) })
          const status = resp.status
          let raw = ''; try { raw = await resp.text() } catch {}
          let text = ''; try { const data = JSON.parse(raw); text = data?.choices?.[0]?.message?.content || '' } catch {}
          let tips: string[] = []
          if (text) { try { const parsed = JSON.parse(text); if (Array.isArray(parsed)) tips = parsed.map(x=>String(x)) } catch { tips = String(text).split('\n').map(l=>l.replace(/^[-*\s]+/,'')).filter(Boolean) } }
          console.log('[ai/suggestions]', { provider: which, status, length: raw.length, endpoint: ep, model: m })
          if (status === 200 && tips.length) return { tips, status }
        }
      }
      return { tips: [], status: 400 }
    }
    let primary: 'dashscope'|'openrouter' = (provider === 'dashscope' && dashKey) ? 'dashscope' : (openKey ? 'openrouter' : 'dashscope')
    let result = await call(primary)
    if (!result.tips.length) {
      const secondary: 'dashscope'|'openrouter' = primary === 'dashscope' ? 'openrouter' : 'dashscope'
      if ((secondary === 'dashscope' && dashKey) || (secondary === 'openrouter' && openKey)) {
        const fb = await call(secondary)
        if (fb.tips.length) result = fb
      }
    }
    if (!result.tips.length) result.tips = ['本建议仅供参考，不构成医疗诊断。如存在高风险或不适，请尽快寻求专业帮助。']
    const debug = String(req.headers['x-debug'] || '').toLowerCase() === 'true'
    if (debug) { res.status(200).json({ ok: true, tips: result.tips, provider: primary, status: result.status }); return }
    res.status(200).json({ ok: true, tips: result.tips })
  } catch (e: any) {
    res.status(502).json({ ok: false, error: String(e?.message || 'bad_gateway') })
  }
}