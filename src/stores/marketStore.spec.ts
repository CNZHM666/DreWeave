import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMarketStore } from './marketStore'

vi.mock('../config/supabase', async (importOriginal) => {
  const original = await importOriginal<typeof import('../config/supabase')>()
  const coinApi = {
    getUserCoins: vi.fn(async () => 10),
    addCoinTransaction: vi.fn(async () => ({ id: 'tx1' })),
    getUserTransactions: vi.fn(async () => []),
  }
  const rewardApi = {
    getUserRewards: vi.fn(async () => []),
    createReward: vi.fn(async () => ({ id: 'r1' })),
  }
  return { ...original, coinApi, rewardApi }
})

class MemoryStorage {
  private store: Record<string, string> = {}
  getItem(k: string) { return this.store[k] ?? null }
  setItem(k: string, v: string) { this.store[k] = String(v) }
  removeItem(k: string) { delete this.store[k] }
  clear() { this.store = {} }
}

const ls = new MemoryStorage()
// @ts-ignore
global.localStorage = ls

describe('MarketStore', () => {
  beforeEach(() => {
    ls.clear()
    useMarketStore.setState({
      coins: 0,
      rewards: [],
      transactions: [],
      availableTasks: [
        { id: 'checkin_daily', title: '每日签到', description: '', reward: 10, type: 'daily', is_completed: false, completed_at: null },
      ]
    } as any)
  })

  it('does not award coins if task not completed', async () => {
    const userId = 'u1'
    await useMarketStore.getState().completeTask(userId, 'checkin_daily')
    expect(useMarketStore.getState().coins).toBe(0)
  })

  it('marks task completed when validation passes', async () => {
    const userId = 'u1'
    ls.setItem(`checkin_${userId}_${new Date().toDateString()}`, 'completed')
    useMarketStore.setState({ fetchUserData: async () => ({} as any) })
    await useMarketStore.getState().completeTask(userId, 'checkin_daily')
    const t = useMarketStore.getState().availableTasks.find((x) => x.id === 'checkin_daily')
    expect(t?.is_completed).toBe(true)
  })

  it('creates reward with complete data', async () => {
    const userId = 'u1'
    await useMarketStore.getState().createReward(userId, { title: 'A', description: 'B', cost: 10, category: 'self_care' })
    const api = await import('../config/supabase')
    expect(api.rewardApi.createReward).toHaveBeenCalled()
    await useMarketStore.getState().fetchUserData(userId)
    expect(api.rewardApi.getUserRewards).toHaveBeenCalled()
  })
})