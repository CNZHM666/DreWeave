import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
  } catch {}
  const provider = String(process.env.AI_PROVIDER || '') || 'auto'
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    res.status(200).json({ ok: true, provider })
    return
  }
  res.status(405).json({ ok: false, error: 'method_not_allowed' })
}