import type { GeoPoint, SubmitPayload } from './types'

export function calcRiskScore(payload: SubmitPayload): number {
  let score = 0
  const now = Date.now()
  const ts = new Date(payload.ts_client).getTime()
  const skew = Math.abs(now - ts)
  if (skew > 120000) score += 40
  if (!payload.device_fp) score += 30
  if (payload.geo) score += geoRisk(payload.geo)
  if (payload.method === 'manual') score += 20
  return Math.min(score, 100)
}

function geoRisk(geo: GeoPoint): number {
  if (!geo.accuracy || geo.accuracy > 100) return 20
  return 0
}