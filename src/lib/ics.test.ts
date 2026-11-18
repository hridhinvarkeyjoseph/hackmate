import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import { googleCalendarUrl } from './ics'

describe('googleCalendarUrl', () => {
  const url = new URL(
    googleCalendarUrl({
      ...sampleHackathons[0],
      name: 'Build & Ship',
      startDate: '2026-12-30',
      endDate: '2026-12-31',
      deadline: '2026-12-20',
      website: 'javascript:alert(1)',
    }),
  )

  it('fills in the event and encodes its name', () => {
    expect(url.hostname).toBe('calendar.google.com')
    expect(url.searchParams.get('text')).toBe('Build & Ship')
  })

  it('uses an exclusive end date across a new year', () => {
    expect(url.searchParams.get('dates')).toBe('20261230/20270101')
  })

  it('leaves out links that are not web pages', () => {
    expect(url.searchParams.get('details')).toBe('Deadline: Dec 20')
  })
})
