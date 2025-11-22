import { describe, it, expect } from 'vitest'
import { validateCheckInNote, getNoteKey } from '../../checkin/useCheckInController'

describe('validateCheckInNote', () => {
  it('fails for short text', () => {
    expect(validateCheckInNote('1234').valid).toBe(false)
  })
  it('passes for valid text', () => {
    expect(validateCheckInNote('有效备注内容')).toStrictEqual({ valid: true })
  })
})

describe('getNoteKey', () => {
  it('generates correct key', () => {
    const k = getNoteKey('u1', '2025-01-01')
    expect(k).toBe('dreweave_checkin_note_u1_2025-01-01')
  })
})