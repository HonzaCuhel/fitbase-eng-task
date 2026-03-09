import { describe, it, expect } from 'vitest'
import { getFormattedDate, getRelativeTime } from '../formatDate'

describe('getFormattedDate', () => {
  it('formats a date with default format', () => {
    const result = getFormattedDate('2026-03-15')
    expect(result).toBe('Mar 15, 2026')
  })

  it('formats a date with custom format', () => {
    const result = getFormattedDate('2026-03-15', 'YYYY-MM-DD')
    expect(result).toBe('2026-03-15')
  })

  it('returns empty string for null', () => {
    expect(getFormattedDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(getFormattedDate(undefined)).toBe('')
  })
})

describe('getRelativeTime', () => {
  it('returns empty string for null', () => {
    expect(getRelativeTime(null)).toBe('')
  })

  it('returns "Today" for today', () => {
    expect(getRelativeTime(new Date())).toBe('Today')
  })
})
