import { describe, expect, it } from 'vitest'
import { hashForView, pageTitle, viewFromHash } from './routes'

describe('routes', () => {
  it('round-trips every page', () => {
    for (const view of ['overview', 'hackathons', 'calendar', 'insights', 'suggest', 'nearby'] as const) {
      expect(viewFromHash(hashForView(view))).toBe(view)
    }
  })

  it('uses readable links', () => {
    expect(hashForView('nearby')).toBe('#/near-me')
    expect(hashForView('overview')).toBe('')
  })

  it('falls back to the overview for anything else', () => {
    expect(viewFromHash('#/nope')).toBe('overview')
    expect(viewFromHash('#join=abc')).toBe('overview')
  })

  it('names the page', () => {
    expect(pageTitle('suggest')).toBe('Ideas · Hackmate')
  })
})
