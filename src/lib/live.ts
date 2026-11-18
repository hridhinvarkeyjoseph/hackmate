import type { Hackathon, Mode } from '../types'
import { toISODate } from './date'

/** Shape written by scripts/fetch-hackathons.mjs. */
export type LiveEvent = {
  id: string
  name: string
  organizer: string
  mode: Mode
  location: string
  themes: string[]
  prize: string
  applyUrl: string
  startDate: string
  endDate: string
  deadline: string
  region: string
  open: boolean
  source: string
}

export type LiveFeed = {
  generatedAt: string
  events: LiveEvent[]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MODES: Mode[] = ['Online', 'In person', 'Hybrid']

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')
const date = (value: unknown): string => {
  const candidate = text(value).slice(0, 10)
  return ISO_DATE.test(candidate) ? candidate : ''
}

const themeName = (theme: unknown): string =>
  typeof theme === 'string' ? theme.trim() : text((theme as { name?: unknown } | null)?.name)

/** Turns one untrusted feed row into a listing, or null if it is unusable. */
export function normalizeListing(raw: unknown): LiveEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const row = raw as Record<string, unknown>
  const id = text(row.id)
  const name = text(row.name)
  const applyUrl = text(row.applyUrl)
  if (!id || !name || !/^https:\/\//.test(applyUrl)) return null

  const startDate = date(row.startDate)
  return {
    id,
    name,
    organizer: text(row.organizer),
    mode: MODES.includes(row.mode as Mode) ? (row.mode as Mode) : 'In person',
    location: text(row.location),
    themes: (Array.isArray(row.themes) ? row.themes : [])
      .map(themeName)
      .filter((theme) => theme && theme !== 'No Restrictions')
      .slice(0, 3),
    prize: text(row.prize),
    applyUrl,
    startDate,
    endDate: date(row.endDate) || startDate,
    deadline: date(row.deadline) || startDate,
    region: text(row.region),
    open: row.open === true,
    source: text(row.source),
  }
}

export function parseFeed(payload: unknown): LiveFeed {
  const feed = (typeof payload === 'object' && payload !== null ? payload : {}) as {
    generatedAt?: unknown
    events?: unknown
  }
  return {
    generatedAt: text(feed.generatedAt),
    events: (Array.isArray(feed.events) ? feed.events : [])
      .map(normalizeListing)
      .filter((event): event is LiveEvent => event !== null),
  }
}

export const listingKey = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** A listing is worth showing only while people can still sign up for it. */
export function isOpenListing(event: LiveEvent, today = toISODate(new Date())): boolean {
  return event.open && event.deadline !== '' && event.deadline >= today
}

/** Open listings, one per hackathon, with the most urgent first. */
export function openListings(events: LiveEvent[], today = toISODate(new Date())): LiveEvent[] {
  const seen = new Set<string>()
  return events
    .filter((event) => isOpenListing(event, today))
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || a.name.localeCompare(b.name))
    .filter((event) => {
      const key = listingKey(event.name)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

/** Devfolio publishes no sign-up cutoff, so its start date stands in for one. */
export const deadlineIsEstimated = (event: LiveEvent): boolean => event.source === 'devfolio'

/** Copies a listing onto the user's board, ready to plan around. */
export function listingToHackathon(event: LiveEvent, id: string, createdAt: string): Hackathon {
  const origin = event.source ? `Found on ${event.source[0].toUpperCase()}${event.source.slice(1)}.` : ''
  const caution = deadlineIsEstimated(event)
    ? ' The deadline is the start date, so confirm the real cutoff on the listing.'
    : ''
  return {
    id,
    name: event.name,
    organizer: event.organizer,
    mode: event.mode,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    deadline: event.deadline,
    status: 'Idea',
    prize: event.prize,
    teamSize: 3,
    themes: event.themes,
    notes: `${origin}${caution}`.trim(),
    website: event.applyUrl,
    favorite: false,
    createdAt,
    team: [],
    tasks: [],
    submission: { repo: '', demo: '', video: '' },
  }
}
