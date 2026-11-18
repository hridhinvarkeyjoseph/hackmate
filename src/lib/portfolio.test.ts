import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import type { Hackathon } from '../types'
import { buildPortfolio } from './portfolio'

const event = (overrides: Partial<Hackathon>): Hackathon => ({
  ...sampleHackathons[0],
  name: 'Build Week',
  organizer: 'Host',
  mode: 'Online',
  status: 'Submitted',
  endDate: '2026-11-10',
  prize: '',
  notes: '',
  themes: ['AI'],
  submission: { repo: '', demo: '', video: '' },
  ...overrides,
})

describe('buildPortfolio', () => {
  it('leaves out work that was never shipped', () => {
    const result = buildPortfolio([event({ status: 'Idea' })], 'Asha')
    expect(result).toContain('0 shipped')
    expect(result).not.toContain('Build Week')
  })

  it('marks wins with their prize and counts them', () => {
    const result = buildPortfolio([event({ status: 'Won', prize: '₹50,000' })], 'Asha')
    expect(result).toContain("# Asha's hackathons")
    expect(result).toContain('1 shipped · 1 win')
    expect(result).toContain('## Build Week (Winner)')
    expect(result).toContain('Prize: ₹50,000')
  })

  it('lists only the links that exist, newest event first', () => {
    const result = buildPortfolio(
      [
        event({ name: 'Older', endDate: '2026-01-01' }),
        event({ name: 'Newer', submission: { repo: 'https://r.dev', demo: '', video: '' } }),
      ],
      '',
    )
    expect(result.indexOf('Newer')).toBeLessThan(result.indexOf('Older'))
    expect(result).toContain('[Code](https://r.dev)')
    expect(result).not.toContain('[Demo]')
  })
})
