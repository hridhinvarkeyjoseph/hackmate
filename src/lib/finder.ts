import type { Hackathon } from '../types'
import { daysBetween, parseDate, toISODate } from './date'
import { deadlineIsEstimated, listingKey, type LiveEvent } from './live'

export type Place = {
  label: string
  country: string
  lat: number
  lng: number
}

export type Venue = {
  city: string
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
  { label: 'Kolkata, IN', country: 'IN', lat: 22.5726, lng: 88.3639 },
  { label: 'Kochi, IN', country: 'IN', lat: 9.9312, lng: 76.2673 },
  { label: 'London, UK', country: 'GB', lat: 51.5074, lng: -0.1278 },
  { label: 'Berlin, DE', country: 'DE', lat: 52.52, lng: 13.405 },
  { label: 'Singapore, SG', country: 'SG', lat: 1.3521, lng: 103.8198 },
  { label: 'Toronto, CA', country: 'CA', lat: 43.6532, lng: -79.3832 },
  { label: 'New York, US', country: 'US', lat: 40.7128, lng: -74.006 },
  { label: 'Dubai, AE', country: 'AE', lat: 25.2048, lng: 55.2708 },
]

/** [names as they appear in listings, country, latitude, longitude] */
const VENUES: Array<[string[], string, number, number]> = [
  [['Bengaluru', 'Bangalore'], 'IN', 12.9716, 77.5946],
  [['Soladevanahalli'], 'IN', 13.08, 77.5],
  [['Mysuru', 'Mysore'], 'IN', 12.2958, 76.6394],
  [['Mangaluru', 'Mangalore'], 'IN', 12.9141, 74.856],
  [['New Delhi', 'Delhi'], 'IN', 28.6139, 77.209],
  [['Noida'], 'IN', 28.5355, 77.391],
  [['Gurugram', 'Gurgaon'], 'IN', 28.4595, 77.0266],
  [['Mumbai', 'Bombay'], 'IN', 19.076, 72.8777],
  [['Pune'], 'IN', 18.5204, 73.8567],
  [['Nagpur'], 'IN', 21.1458, 79.0882],
  [['Goa'], 'IN', 15.2993, 74.124],
  [['Hyderabad'], 'IN', 17.385, 78.4867],
  [['Visakhapatnam', 'Vizag'], 'IN', 17.6868, 83.2185],
  [['Chennai', 'Madras'], 'IN', 13.0827, 80.2707],
  [['Coimbatore'], 'IN', 11.0168, 76.9558],
  [['Vellore'], 'IN', 12.9165, 79.1325],
  [['KSR Kalvi Nagar', 'Tiruchengode'], 'IN', 11.38, 77.89],
  [['Myladi'], 'IN', 8.15, 77.5],
  [['Kochi', 'Cochin'], 'IN', 9.9312, 76.2673],
  [['Thiruvananthapuram', 'Trivandrum'], 'IN', 8.5241, 76.9366],
  [['Kozhikode', 'Calicut'], 'IN', 11.2588, 75.7804],
  [['Bidhannagar', 'Salt Lake'], 'IN', 22.5867, 88.4171],
  [['Kolkata', 'Calcutta'], 'IN', 22.5726, 88.3639],
  [['Kalyani'], 'IN', 22.975, 88.4345],
  [['Bhubaneswar'], 'IN', 20.2961, 85.8245],
  [['Guwahati'], 'IN', 26.1445, 91.7362],
  [['Patna'], 'IN', 25.5941, 85.1376],
  [['Lucknow'], 'IN', 26.8467, 80.9462],
  [['Jaipur'], 'IN', 26.9124, 75.7873],
  [['Ahmedabad'], 'IN', 23.0225, 72.5714],
  [['Indore'], 'IN', 22.7196, 75.8577],
  [['Bhopal'], 'IN', 23.2599, 77.4126],
  [['Chandigarh'], 'IN', 30.7333, 76.7794],
  [['Ludhiana'], 'IN', 30.901, 75.8573],
  [['Patiala'], 'IN', 30.3398, 76.3869],
  [['Hamirpur'], 'IN', 31.6862, 76.5213],
  [['London'], 'GB', 51.5074, -0.1278],
  [['Berlin'], 'DE', 52.52, 13.405],
  [['Singapore'], 'SG', 1.3521, 103.8198],
  [['Toronto'], 'CA', 43.6532, -79.3832],
  [['New York'], 'US', 40.7128, -74.006],
  [['Dubai'], 'AE', 25.2048, 55.2708],
  [['Chiang Mai'], 'TH', 18.7883, 98.9853],
]

const VENUE_PATTERNS = VENUES.map(([names, country, lat, lng]) => ({
  pattern: new RegExp(`\\b(${names.join('|')})\\b`, 'i'),
  venue: { city: names[0], country, lat, lng },
}))

/** Finds the known city named in a listing's free-text location. */
export function locateVenue(location: string): Venue | null {
  return VENUE_PATTERNS.find(({ pattern }) => pattern.test(location))?.venue ?? null
}

const toRad = (value: number) => (value * Math.PI) / 180

export function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const earth = 6371
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * earth * Math.asin(Math.sqrt(a)))
}

export type Verdict = 'go' | 'maybe' | 'skip'

export type RankedListing = {
  listing: LiveEvent
  km: number | null
  verdict: Verdict
  headline: string
  reasons: string[]
}

const LOCAL_KM = 75
const SHORT_TRIP_KM = 500
const STRONG_MATCH = 2
const URGENT_DAYS = 3
const ORDER: Record<Verdict, number> = { go: 0, maybe: 1, skip: 2 }

const isActive = (event: Hackathon) => !['Won', 'Completed'].includes(event.status)

function deadlineReason(listing: LiveEvent, today: string): string | null {
  const days = daysBetween(parseDate(today), parseDate(listing.deadline))
  if (days > URGENT_DAYS) return null
  const plural = days === 1 ? '' : 's'
  if (deadlineIsEstimated(listing)) {
    return days === 0 ? 'Starts today, so check if sign-ups are open.' : `Starts in ${days} day${plural}.`
  }
  return days === 0 ? 'Registration closes today.' : `Only ${days} day${plural} left to register.`
}

function judgeTrip(
  listing: LiveEvent,
  km: number | null,
  place: Place,
  matches: string[],
): Pick<RankedListing, 'verdict' | 'headline' | 'reasons'> {
  const strong = matches.length >= STRONG_MATCH
  const fit =
    matches.length > 0
      ? `Matches themes you follow: ${matches.slice(0, 2).join(', ')}.`
      : 'A chance to try a new theme.'

  if (listing.mode === 'Online') {
    return { verdict: 'go', headline: 'Go: no travel needed', reasons: ['Join from anywhere.', fit] }
  }
  if (km === null) {
    return {
      verdict: 'maybe',
      headline: 'Maybe: check the venue',
      reasons: [`The listing only says "${listing.location || 'in person'}".`, fit],
    }
  }

  const away = `${km} km from ${place.label}.`
  if (km <= LOCAL_KM) {
    return { verdict: 'go', headline: 'Go: it is local', reasons: [away, 'Close enough to sleep at home.'] }
  }
  if (km <= SHORT_TRIP_KM) {
    return strong
      ? { verdict: 'go', headline: 'Go: short trip, strong match', reasons: [away, fit] }
      : { verdict: 'maybe', headline: 'Maybe: a short trip', reasons: [away, fit] }
  }
  return strong
    ? { verdict: 'maybe', headline: 'Maybe: far, but on theme', reasons: [away, fit] }
    : { verdict: 'skip', headline: 'Skip: too far for the fit', reasons: [away, 'Look for an online one instead.'] }
}

/**
 * Ranks open listings against a place and the user's board. Distance decides
 * how practical a trip is, themes decide if it is worth it, and a date clash
 * outranks both.
 */
export function rankListings(
  listings: LiveEvent[],
  events: Hackathon[],
  place: Place,
  today = toISODate(new Date()),
): RankedListing[] {
  const myThemes = new Set(events.flatMap((event) => event.themes.map((theme) => theme.toLowerCase())))
  const tracked = new Set(events.map((event) => listingKey(event.name)))
  const active = events.filter(isActive)

  return listings
    .filter((listing) => !tracked.has(listingKey(listing.name)))
    .flatMap((listing): RankedListing[] => {
      const online = listing.mode === 'Online'
      const venue = online ? null : locateVenue(listing.location)
      // Unlocated in-person listings come from Indian boards.
      if (!online && (venue?.country ?? 'IN') !== place.country) return []

      const km = venue ? distanceKm(place, venue) : null
      const matches = listing.themes.filter((theme) => myThemes.has(theme.toLowerCase()))
      const judged = judgeTrip(listing, km, place, matches)
      const urgency = deadlineReason(listing, today)
      const reasons = urgency ? [...judged.reasons, urgency] : judged.reasons

      const clash = listing.startDate
        ? active.find(
            (event) => event.startDate <= listing.endDate && event.endDate >= listing.startDate,
          )
        : undefined

      return [
        clash
          ? {
              listing,
              km,
              verdict: 'skip',
              headline: `Skip: clashes with ${clash.name}`,
              reasons: [...reasons, 'You already have a hackathon on those dates.'],
            }
          : { listing, km, ...judged, reasons },
      ]
    })
    .sort(
      (a, b) =>
        ORDER[a.verdict] - ORDER[b.verdict] ||
        a.listing.deadline.localeCompare(b.listing.deadline) ||
        (a.km ?? 0) - (b.km ?? 0),
    )
}
