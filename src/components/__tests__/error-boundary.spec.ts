import { describe, it, expect } from 'vitest'
import ErrorBoundary, { classifyError } from '../../components/ErrorBoundary'

describe('ErrorBoundary classification', () => {
  it('classifies network errors', () => {
    expect(classifyError('Failed to fetch', 'unknown')).toBe('network')
  })
  it('classifies session errors', () => {
    expect(classifyError('JWT expired', 'unknown')).toBe('session')
  })
  it('classifies server errors', () => {
    expect(classifyError('500 Service Unavailable', 'unknown')).toBe('server')
  })
})