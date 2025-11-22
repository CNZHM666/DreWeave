import { describe, it, expect, beforeEach, vi } from 'vitest'

function setupGlobals(online: boolean) {
  const store: Record<string, string> = {}
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => (store[k] = String(v)),
    removeItem: (k: string) => delete store[k],
    clear: () => Object.keys(store).forEach(k => delete store[k]),
    key: (i: number) => Object.keys(store)[i] || null,
    get length() {
      return Object.keys(store).length
    }
  }
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: online }, configurable: true })
}

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./achievementStore', () => ({ useAchievementStore: { getState: () => ({ updateProgress: vi.fn() }) } }))

describe('useTestStore 提交测试离线回退', () => {
  beforeEach(() => {
    vi.resetModules()
    setupGlobals(false)
  })

  it('未配置 Supabase 时离线保存', async () => {
    vi.doMock('../config/supabase', () => ({
      isSupabaseConfigured: false,
      testApi: {
        saveTestResult: vi.fn(),
        getUserTestHistory: vi.fn().mockResolvedValue([])
      }
    }))
    vi.doMock('../utils/backupNetworkCheck', () => ({ default: { quickCheck: vi.fn().mockResolvedValue(false) } }))
    vi.doMock('../utils/emergencyNetworkBypass', () => ({ emergencyNetworkBypass: { isForceOnline: () => false } }))

    const { useTestStore } = await import('./testStore')
    const state = useTestStore.getState()
    state.startTest('iat')
    const ans: Record<number, number> = {}
    for (let i = 1; i <= 20; i++) ans[i] = 3
    ;(useTestStore as any).setState({ answers: ans })
    expect(Object.keys(useTestStore.getState().answers).length).toBe(20)
    const res = await state.submitTest('u1')
    expect(res && res.id.startsWith('offline_')).toBe(true)
    const saved = JSON.parse((globalThis as any).localStorage.getItem('offline_test_results') || '[]')
    expect(saved.length).toBeGreaterThan(0)
  })

  it('浏览器离线时离线保存', async () => {
    setupGlobals(false)
    vi.doMock('../config/supabase', () => ({
      isSupabaseConfigured: true,
      testApi: {
        saveTestResult: vi.fn(),
        getUserTestHistory: vi.fn().mockResolvedValue([])
      }
    }))
    vi.doMock('../utils/backupNetworkCheck', () => ({ default: { quickCheck: vi.fn().mockResolvedValue(false) } }))
    vi.doMock('../utils/emergencyNetworkBypass', () => ({ emergencyNetworkBypass: { isForceOnline: () => false } }))

    const { useTestStore } = await import('./testStore')
    const state = useTestStore.getState()
    state.startTest('iat')
    const ans: Record<number, number> = {}
    for (let i = 1; i <= 20; i++) ans[i] = 4
    ;(useTestStore as any).setState({ answers: ans })
    expect(Object.keys(useTestStore.getState().answers).length).toBe(20)
    const res = await state.submitTest('u2')
    expect(res && res.id.startsWith('offline_')).toBe(true)
  })

  it('在线但快速检测失败时离线保存', async () => {
    setupGlobals(true)
    vi.doMock('../config/supabase', () => ({
      isSupabaseConfigured: true,
      testApi: {
        saveTestResult: vi.fn(),
        getUserTestHistory: vi.fn().mockResolvedValue([])
      }
    }))
    vi.doMock('../utils/backupNetworkCheck', () => ({ default: { quickCheck: vi.fn().mockResolvedValue(false) } }))
    vi.doMock('../utils/emergencyNetworkBypass', () => ({ emergencyNetworkBypass: { isForceOnline: () => false } }))

    const { useTestStore } = await import('./testStore')
    const state = useTestStore.getState()
    state.startTest('iat')
    const ans: Record<number, number> = {}
    for (let i = 1; i <= 20; i++) ans[i] = 5
    ;(useTestStore as any).setState({ answers: ans })
    expect(Object.keys(useTestStore.getState().answers).length).toBe(20)
    const res = await state.submitTest('u3')
    expect(res && res.id.startsWith('offline_')).toBe(true)
  })

  it('在线接口 answers 列错误时离线回退', async () => {
    setupGlobals(true)
    const save = vi.fn().mockRejectedValue(new Error("Could not find the 'answers' column of 'test_results' in the schema cache"))
    vi.doMock('../config/supabase', () => ({
      isSupabaseConfigured: true,
      testApi: {
        saveTestResult: save,
        getUserTestHistory: vi.fn().mockResolvedValue([])
      }
    }))
    vi.doMock('../utils/backupNetworkCheck', () => ({ default: { quickCheck: vi.fn().mockResolvedValue(true) } }))
    vi.doMock('../utils/emergencyNetworkBypass', () => ({ emergencyNetworkBypass: { isForceOnline: () => false } }))

    const { useTestStore } = await import('./testStore')
    const state = useTestStore.getState()
    state.startTest('iat')
    const ans: Record<number, number> = {}
    for (let i = 1; i <= 20; i++) ans[i] = 2
    ;(useTestStore as any).setState({ answers: ans })
    expect(Object.keys(useTestStore.getState().answers).length).toBe(20)
    const res = await state.submitTest('u4')
    expect(res && res.id.startsWith('offline_')).toBe(true)
    expect(save).toHaveBeenCalled()
  })

  it('获取历史包含离线结果', async () => {
    setupGlobals(true)
    vi.doMock('../config/supabase', () => ({
      isSupabaseConfigured: true,
      testApi: {
        saveTestResult: vi.fn().mockResolvedValue({ id: 'r1', user_id: 'u5', test_type: 'iat', score: 60, answers: {}, created_at: new Date().toISOString() }),
        getUserTestHistory: vi.fn().mockResolvedValue([])
      }
    }))
    vi.doMock('../utils/backupNetworkCheck', () => ({ default: { quickCheck: vi.fn().mockResolvedValue(false) } }))
    vi.doMock('../utils/emergencyNetworkBypass', () => ({ emergencyNetworkBypass: { isForceOnline: () => false } }))

    const { useTestStore } = await import('./testStore')
    const state = useTestStore.getState()
    state.startTest('iat')
    const ans: Record<number, number> = {}
    for (let i = 1; i <= 20; i++) ans[i] = 3
    ;(useTestStore as any).setState({ answers: ans })
    expect(Object.keys(useTestStore.getState().answers).length).toBe(20)
    await state.submitTest('u5')
    await state.fetchTestHistory('u5')
    const history = useTestStore.getState().testHistory
    expect(history.length).toBeGreaterThan(0)
    expect(history[0].user_id).toBe('u5')
  })
})