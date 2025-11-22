import { describe, it, expect } from 'vitest'
import { calcRiskScore } from '../src/services/checkin/risk'

describe('risk score', () => {
  it('penalizes large time skew', () => {
    const payload: any = { ts_client: new Date(Date.now() - 180000).toISOString(), device_fp: 'x', method: 'manual' }
    const score = calcRiskScore({ ...payload, user_id: 'u', tz_offset_minutes: 0 })
    expect(score).toBeGreaterThanOrEqual(40)
  })
  it('penalizes low accuracy geo', () => {
    const payload: any = { ts_client: new Date().toISOString(), device_fp: 'x', method: 'gps', geo: { lat: 1, lng: 1, accuracy: 500 } }
    const score = calcRiskScore({ ...payload, user_id: 'u', tz_offset_minutes: 0 })
    expect(score).toBeGreaterThanOrEqual(20)
  })
})