import { describe, expect, it } from 'vitest'
import { combineSources, fromDevfolio, fromUnstop, prizeLabel, selectUpcoming } from './listings.mjs'

describe('prizeLabel', () => {
  it('formats cash with its currency', () => {
    expect(prizeLabel({ cash: 100000, currency: 'fa-rupee' })).toBe('₹1,00,000')
    expect(prizeLabel({ cash: 500, currency: 'fa-dollar' })).toBe('$500')
  })

  it('falls back to the prize name', () => {
    expect(prizeLabel({ cash: null, name: 'Internship' })).toBe('Internship')
    expect(prizeLabel(undefined)).toBe('')
  })
})

describe('fromUnstop', () => {
  const row = {
    id: 7,
    title: 'Build Week',
    region: 'online',
    public_url: 'hackathons/build-week',
    start_date: '2026-12-01T09:00:00',
    end_date: '2026-12-02T09:00:00',
    regn_end_date: '2026-11-25T23:59:00',
    regn_open: 1,
    filters: [{ name: 'Undergraduate' }, { name: 'AI' }],
    tags: ['Medical', { name: 'Web' }],
  }

  it('maps the fields the app needs', () => {
    expect(fromUnstop(row)).toMatchObject({
      id: 'unstop-7',
      mode: 'Online',
      location: 'Online',
      deadline: '2026-11-25',
      open: true,
      applyUrl: 'https://unstop.com/hackathons/build-week',
    })
  })

  it('keeps topics and drops audience tags', () => {
    expect(fromUnstop(row).themes).toEqual(['AI', 'Web'])
  })
})

describe('fromDevfolio', () => {
  const row = {
    uuid: 'abc',
    name: 'Chain Jam',
    slug: 'chain-jam',
    starts_at: '2026-12-01T00:00:00Z',
    ends_at: '2026-12-03T00:00:00Z',
    is_online: true,
    themes: [{ name: 'Blockchain' }, { name: 'No Restrictions' }],
  }

  it('uses the start date as the deadline', () => {
    expect(fromDevfolio(row)).toMatchObject({
      id: 'devfolio-abc',
      mode: 'Online',
      deadline: '2026-12-01',
      themes: ['Blockchain'],
    })
  })

  it('skips drafts and private events', () => {
    expect(fromDevfolio({ ...row, status: 'draft' })).toBeNull()
    expect(fromDevfolio({ ...row, private: true })).toBeNull()
  })
})

describe('selectUpcoming', () => {
  it('drops finished events and sorts by start date', () => {
    const events = [
      { id: 'late', startDate: '2026-12-09', endDate: '2026-12-10' },
      { id: 'soon', startDate: '2026-12-01', endDate: '2026-12-02' },
      { id: 'past', startDate: '2026-01-01', endDate: '2026-01-02' },
    ]
    expect(selectUpcoming(events, '2026-11-18').map((event) => event.id)).toEqual(['soon', 'late'])
  })
})

describe('combineSources', () => {
  it('keeps working sources when another one fails', () => {
    const result = combineSources([
      { status: 'rejected', reason: new Error('Unstop page 1: HTTP 403') },
      { status: 'fulfilled', value: [{ id: 'a' }] },
    ])
    expect(result.events).toEqual([{ id: 'a' }])
    expect(result.failures).toEqual(['Unstop page 1: HTTP 403'])
  })
})
