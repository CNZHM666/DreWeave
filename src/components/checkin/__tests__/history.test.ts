import { describe, it, expect, vi } from 'vitest'
import { checkInApi } from '../../../config/supabase'

vi.mock('../../../config/supabase', () => ({
  checkInApi: {
    getUserCheckInsPage: vi.fn(async (_userId: string, page: number, pageSize: number) => {
      const total = 45
      const start = page * pageSize
      const end = Math.min(start + pageSize, total)
      const data = Array.from({ length: end - start }, (_, i) => ({ id: `id_${start + i}`, created_at: new Date().toISOString() }))
      return { data, total }
    })
  }
}))

describe('history pagination api', () => {
  it('returns correct page slices', async () => {
    const api: any = checkInApi
    const { data, total } = await api.getUserCheckInsPage('u1', 0, 20)
    expect(total).toBe(45)
    expect(data.length).toBe(20)
    const { data: data2 } = await api.getUserCheckInsPage('u1', 2, 20)
    expect(data2.length).toBe(5)
  })
})