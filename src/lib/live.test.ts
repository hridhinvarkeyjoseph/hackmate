import { describe, expect, it } from 'vitest'
import { isOpenListing, listingToHackathon, normalizeListing, openListings, parseFeed, type LiveEvent } from './live'

const listing = (overrides: Partial<LiveEvent> = {}): LiveEvent => ({
  id: 'a',
  name: 'Build Week',
  organizer: 'Host',
  mode: 'Online',
  location: 'Online',
  themes: [],
  prize: '',
  applyUrl: 'https://example.com/a',
  startDate: '2026-12-01',
  endDate: '2026-12-02',
  deadline: '2026-11-25',
  region: 'online',
  open: true,
  source: 'unstop',
  ...overrides,
})

describe('normalizeListing', () => {
  it('reads theme names from Devfolio objects and drops the catch-all', () => {
    const result = normalizeListing({
      ...listing(),
      themes: [{ name: 'AI' }, 'Design', { name: 'No Restrictions' }, null],
    })
    expect(result?.themes).toEqual(['AI', 'Design'])
  })

  it('does not treat audience tags as themes', () => {
    const result = normalizeListing({ ...listing(), themes: ['Undergraduate', 'AI'] })
    expect(result?.themes).toEqual(['AI'])
  })

  it('shows plain prize amounts as rupees', () => {
    expect(normalizeListing({ ...listing(), prize: '100000' })?.prize).toBe('₹1,00,000')
    expect(normalizeListing({ ...listing(), prize: '$500' })?.prize).toBe('$500')
  })

  it('replaces placeholder organizers with the source', () => {
    const row = { ...listing(), organizer: 'Devfolio host', source: 'devfolio' }
    expect(normalizeListing(row)?.organizer).toBe('Listed on Devfolio')
  })

  it('rejects rows without a safe link', () => {
    expect(normalizeListing({ ...listing(), applyUrl: 'javascript:alert(1)' })).toBeNull()
    expect(normalizeListing('nope')).toBeNull()
  })

  it('falls back to the start date when the deadline is malformed', () => {
    expect(normalizeListing({ ...listing(), deadline: 'soon' })?.deadline).toBe('2026-12-01')
  })
})

describe('parseFeed', () => {
  it('survives a broken payload', () => {
    expect(parseFeed(null)).toEqual({ generatedAt: '', events: [] })
    expect(parseFeed({ events: 'x' }).events).toEqual([])
  })
})

describe('openListings', () => {
  const today = '2026-11-18'

  it('keeps a listing through its deadline day', () => {
    expect(isOpenListing(listing({ deadline: today }), today)).toBe(true)
    expect(isOpenListing(listing({ deadline: '2026-11-17' }), today)).toBe(false)
  })

  it('hides closed registrations', () => {
    expect(isOpenListing(listing({ open: false }), today)).toBe(false)
  })

  it('sorts by deadline and removes duplicates across sources', () => {
    const result = openListings(
      [
        listing({ id: 'late', name: 'Late', deadline: '2026-12-20' }),
        listing({ id: 'soon', name: 'Soon!', deadline: '2026-11-19' }),
        listing({ id: 'copy', name: 'soon', deadline: '2026-11-20', source: 'devfolio' }),
        listing({ id: 'gone', name: 'Gone', deadline: '2026-11-01' }),
      ],
      today,
    )
    expect(result.map((event) => event.id)).toEqual(['soon', 'late'])
  })
})

describe('listingToHackathon', () => {
  it('keeps real dates and starts as an idea', () => {
    const saved = listingToHackathon(listing(), 'hm-1', '2026-11-18T00:00:00.000Z')
    expect(saved).toMatchObject({ id: 'hm-1', status: 'Idea', deadline: '2026-11-25' })
    expect(saved.website).toBe('https://example.com/a')
  })

  it('warns when the deadline is only an estimate', () => {
    const saved = listingToHackathon(listing({ source: 'devfolio' }), 'hm-2', '')
    expect(saved.notes).toContain('confirm the real cutoff')
  })
})
