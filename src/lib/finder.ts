import type { Hackathon } from '../types'
import { catalog, type CatalogEntry } from './catalog'

export type Place = {
  label: string
  country: string
  lat: number
  lng: number
}

export const cityPresets: Place[] = [
  { label: 'Bengaluru, IN', country: 'IN', lat: 12.9716, lng: 77.5946 },
  { label: 'New Delhi, IN', country: 'IN', lat: 28.6139, lng: 77.209 },
  { label: 'Mumbai, IN', country: 'IN', lat: 19.076, lng: 72.8777 },
  { label: 'Hyderabad, IN', country: 'IN', lat: 17.385, lng: 78.4867 },
  { label: 'Pune, IN', country: 'IN', lat: 18.5204, lng: 73.8567 },
  { label: 'Chennai, IN', country: 'IN', lat: 13.0827, lng: 80.2707 },
  { label: 'London, UK', country: 'GB', lat: 51.5074, lng: -0.1278 },
  { label: 'Berlin, DE', country: 'DE', lat: 52.52, lng: 13.405 },
  { label: 'Singapore, SG', country: 'SG', lat: 1.3521, lng: 103.8198 },
  { label: 'Toronto, CA', country: 'CA', lat: 43.6532, lng: -79.3832 },
  { label: 'New York, US', country: 'US', lat: 40.7128, lng: -74.006 },
  { label: 'Dubai, AE', country: 'AE', lat: 25.2048, lng: 55.2708 },
]

/** Where each catalog entry actually happens. Online entries have no venue. */
export const venues: Record<string, Omit<Place, 'label'> & { city: string }> = {
  'cat-devfolio-eth': { city: 'Bengaluru, IN', country: 'IN', lat: 12.9716, lng: 77.5946 },
  'cat-sih': { city: 'New Delhi, IN', country: 'IN', lat: 28.6139, lng: 77.209 },
  'cat-techfest': { city: 'Mumbai, IN', country: 'IN', lat: 19.076, lng: 72.8777 },
  'cat-london': { city: 'London, UK', country: 'GB', lat: 51.5074, lng: -0.1278 },
  'cat-singapore': { city: 'Singapore, SG', country: 'SG', lat: 1.3521, lng: 103.8198 },
  'cat-berlin': { city: 'Berlin, DE', country: 'DE', lat: 52.52, lng: 13.405 },
}

const toRad = (value: number) => (value * Math.PI) / 180

const isoFromOffset = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function distanceKm(from: Place, to: { lat: number; lng: number }): number {
  const earth = 6371
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * earth * Math.asin(Math.sqrt(a)))
}

export type Verdict = 'go' | 'maybe' | 'skip'

export type NearbyResult = {
  entry: CatalogEntry
  km: number | null
  verdict: Verdict
  headline: string
  reasons: string[]
}

/**
 * Ranks the shelf against a place and the calendar you already have.
 * Distance decides how practical it is; theme overlap decides whether it is
 * worth the travel; a date clash outranks both.
 */
export function rankNearby(events: Hackathon[], place: Place): NearbyResult[] {
  const myThemes = new Set(events.flatMap((event) => event.themes))
  const tracked = new Set(events.map((event) => event.name.toLowerCase()))

  return catalog
    .filter((entry) => !tracked.has(entry.name.toLowerCase()))
    .filter((entry) => {
      if (entry.mode === 'Online') return true
      const venue = venues[entry.id]
      return !venue || venue.country === place.country
    })
    .map((entry): NearbyResult => {
      const themeMatches = entry.themes.filter((theme) => myThemes.has(theme))
      const venue = venues[entry.id]

      if (entry.mode === 'Online' || !venue) {
        return {
          entry,
          km: null,
          verdict: 'go',
          headline: 'Go — no travel needed',
          reasons: [
            'Online, so your postcode is irrelevant.',
            themeMatches.length > 0
              ? `Hits themes you already track: ${themeMatches.slice(0, 2).join(', ')}.`
              : 'A low-risk way to try a new theme.',
          ],
        }
      }

      const km = distanceKm(place, venue)
      const reasons: string[] = [`${km} km from ${place.label}.`]
      let verdict: Verdict
      let headline: string

      if (km <= 75) {
        verdict = 'go'
        headline = 'Go — it is local'
        reasons.push('Close enough to sleep at home.')
      } else if (km <= 500) {
        verdict = themeMatches.length >= 2 ? 'go' : 'maybe'
        headline =
          themeMatches.length >= 2
            ? 'Go — short trip, strong match'
            : 'Maybe — a short trip'
        reasons.push(
          themeMatches.length >= 2
            ? `Two of your themes line up: ${themeMatches.slice(0, 2).join(', ')}.`
            : 'Reachable, but the theme fit is thin.',
        )
      } else {
        verdict = themeMatches.length >= 2 ? 'maybe' : 'skip'
        headline =
          themeMatches.length >= 2
            ? 'Maybe — far, but on-theme'
            : 'Skip — too far for the fit'
        reasons.push(
          themeMatches.length >= 2
            ? 'Worth the flight only if you can pair it with the trip.'
            : 'Not enough overlap to justify the journey — look for a remote one.',
        )
      }

      const clash = events.find(
        (event) =>
          !['Won', 'Completed'].includes(event.status) &&
          event.startDate <= isoFromOffset(entry.end) &&
          event.endDate >= isoFromOffset(entry.start),
      )
      if (clash) {
        return {
          entry,
          km,
          verdict: 'skip',
          headline: `Skip — clashes with ${clash.name}`,
          reasons: [...reasons, 'You already have a hackathon on those dates.'],
        }
      }

      return { entry, km, verdict, headline, reasons }
    })
    .sort((a, b) => {
      const order: Record<Verdict, number> = { go: 0, maybe: 1, skip: 2 }
      if (order[a.verdict] !== order[b.verdict]) return order[a.verdict] - order[b.verdict]
      return (a.km ?? 0) - (b.km ?? 0)
    })
}
