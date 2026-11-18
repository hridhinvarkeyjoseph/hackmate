import { describe, expect, it } from 'vitest'
import { formatRange } from './date'

describe('formatRange', () => {
  it('shows a one-day event once', () => {
    expect(formatRange('2026-11-21', '2026-11-21')).toBe('Nov 21, 2026')
  })

  it('joins days in the same month', () => {
    expect(formatRange('2026-11-21', '2026-11-24')).toBe('Nov 21–24, 2026')
  })
})
