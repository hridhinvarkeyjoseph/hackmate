import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import type { Hackathon } from '../types'
import type { LiveEvent } from './live'
import { cityPresets, distanceKm, locateVenue, rankListings } from './finder'

const today = '2026-11-18'
const bengaluru = cityPresets.find((city) => city.label === 'Bengaluru, IN')!
const london = cityPresets.find((city) => city.label === 'London, UK')!

const listing = (overrides: Partial<LiveEvent> = {}): LiveEvent => ({
  id: 'a',
  name: 'Build Week',
  organizer: 'Host',
  mode: 'In person',
  location: 'Bengaluru',
  themes: [],
  prize: '',
  applyUrl: 'https://example.com/a',
  startDate: '2026-12-10',
  endDate: '2026-12-11',
  deadline: '2026-12-01',
  region: 'offline',
  open: true,
  source: 'unstop',
  ...overrides,
})

const board = (overrides: Partial<Hackathon>): Hackathon => ({
  ...sampleHackathons[0],
  name: 'Mine',
  status: 'Registered',
  themes: [],
  startDate: '2027-01-01',
  endDate: '2027-01-02',
  ...overrides,
})

const rank = (item: LiveEvent, events: Hackathon[] = [], place = bengaluru) =>
  rankListings([item], events, place, today)[0]

describe('locateVenue', () => {
  it('finds a city inside a full address', () => {
    expect(locateVenue('UCL East, Sidings Street, London, UK')?.country).toBe('GB')
  })

  it('understands older city names', () => {
    expect(locateVenue('Bangalore')?.city).toBe('Bengaluru')
  })

  it('does not match part of a word', () => {
    expect(locateVenue('Punekar Hall')).toBeNull()
  })
})

describe('distanceKm', () => {
  it('measures Bengaluru to Delhi', () => {
    const delhi = cityPresets.find((city) => city.label === 'New Delhi, IN')!
    expect(distanceKm(bengaluru, delhi)).toBeGreaterThan(1700)
    expect(distanceKm(bengaluru, delhi)).toBeLessThan(1800)
  })
})

describe('rankListings', () => {
  it('says go for a local event', () => {
    expect(rank(listing())).toMatchObject({ verdict: 'go', km: 0 })
  })

  it('says go for online events with no distance', () => {
    expect(rank(listing({ mode: 'Online', location: 'Online' }))).toMatchObject({
      verdict: 'go',
      km: null,
    })
  })

  it('skips a far event without matching themes', () => {
    expect(rank(listing({ location: 'Kolkata' })).verdict).toBe('skip')
  })

  it('keeps a far hybrid event in play', () => {
    expect(rank(listing({ location: 'Kolkata', mode: 'Hybrid' })).verdict).toBe('maybe')
  })

  it('lifts a far event when themes match, ignoring case', () => {
    const result = rank(listing({ location: 'Kolkata', themes: ['AI', 'Design'] }), [
      board({ themes: ['ai', 'design'] }),
    ])
    expect(result.verdict).toBe('maybe')
  })

  it('counts interests chosen at setup as themes', () => {
    const result = rankListings(
      [listing({ location: 'Kolkata', themes: ['AI', 'Design'] })],
      [],
      bengaluru,
      today,
      ['ai', 'design'],
    )
    expect(result[0].verdict).toBe('maybe')
  })

  it('treats an unknown venue as maybe', () => {
    expect(rank(listing({ location: 'India' }))).toMatchObject({ verdict: 'maybe', km: null })
  })

  it('lets a date clash outrank everything', () => {
    const result = rank(listing(), [board({ startDate: '2026-12-11', endDate: '2026-12-12' })])
    expect(result.verdict).toBe('skip')
    expect(result.headline).toContain('Mine')
  })

  it('ignores clashes with finished hackathons', () => {
    const done = board({ status: 'Completed', startDate: '2026-12-11', endDate: '2026-12-12' })
    expect(rank(listing(), [done]).verdict).toBe('go')
  })

  it('flags a deadline that is close', () => {
    expect(rank(listing({ deadline: today })).reasons).toContain('Registration closes today.')
  })

  it('does not invent a registration cutoff for Devfolio', () => {
    const result = rank(listing({ source: 'devfolio', deadline: '2026-11-20' }))
    expect(result.reasons).toContain('Starts in 2 days.')
  })

  it('hides in-person events in another country', () => {
    expect(rankListings([listing()], [], london, today)).toEqual([])
  })

  it('hides what is already on the board', () => {
    expect(rankListings([listing()], [board({ name: 'BUILD WEEK' })], bengaluru, today)).toEqual([])
  })

  it('orders by verdict and then deadline', () => {
    const results = rankListings(
      [
        listing({ id: 'skip', name: 'Far', location: 'Kolkata' }),
        listing({ id: 'later', name: 'Later', deadline: '2026-12-05' }),
        listing({ id: 'first', name: 'First', deadline: '2026-11-25' }),
      ],
      [],
      bengaluru,
      today,
    )
    expect(results.map((result) => result.listing.id)).toEqual(['first', 'later', 'skip'])
  })
})
