import { describe, it, expect } from 'vitest'
import { useAuthStore } from '../../stores/authStore'

describe('authStore.checkNetworkStatus', () => {
  it('returns status without throwing', async () => {
    const OriginalImage = (global as any).Image
    ;(global as any).Image = class {
      onload: Function | null = null
      onerror: Function | null = null
      set src(_v: string) { setTimeout(() => { this.onload && this.onload(null) }, 0) }
    }
    const res = await useAuthStore.getState().checkNetworkStatus()
    expect(['online','offline']).toContain(res)
    ;(global as any).Image = OriginalImage
  })
})