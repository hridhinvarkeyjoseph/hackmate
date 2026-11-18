import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import { suggestListings } from './catalog'
import type { LiveEvent } from './live'

const listing = (id: string, themes: string[], deadline = '2026-12-01'): LiveEvent => ({
  id,
  name: id,
  organizer: '',
  mode: 'Online',
  location: 'Online',
  themes,
  prize: '',
  applyUrl: 'https://example.com',
  startDate: '2026-12-05',
  endDate: '2026-12-06',
  deadline,
  region: 'online',
  open: true,
  source: 'unstop',
})

describe('suggestListings', () => {
  const mine = [{ ...sampleHackathons[0], name: 'Mine', themes: ['AI'] }]

  it('prefers listings that share a theme', () => {
    const [first] = suggestListings([listing('other', ['Web']), listing('match', ['ai'])], mine)
    expect(first.listing.id).toBe('match')
    expect(first.reason).toContain('ai')
  })

  it('breaks ties with the nearest deadline', () => {
    const result = suggestListings(
      [listing('later', [], '2026-12-09'), listing('sooner', [], '2026-12-02')],
      [],
    )
    expect(result[0].listing.id).toBe('sooner')
  })

  it('leaves out what is already tracked', () => {
    expect(suggestListings([listing('Mine', ['AI'])], mine)).toEqual([])
  })
})
