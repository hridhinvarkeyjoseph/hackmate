import type { Place } from './finder'

export const PROFILE_KEY = 'hackmate.profile.v1'

const ONBOARDED_KEY = 'hackmate.onboarded.v1'
const PLACE_KEY = 'hackmate.place.v1'

export const INTEREST_OPTIONS = [
  'AI',
  'Web',
  'Mobile',
  'FinTech',
  'HealthTech',
  'EdTech',
  'Blockchain',
  'Hardware',
  'Design',
  'Climate',
]

export type Profile = { name: string; interests: string[] }

export function loadProfile(): Profile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)
    if (!raw) return { name: '', interests: [] }
    const parsed = JSON.parse(raw) as { name?: unknown; interests?: unknown }
    return {
      name: typeof parsed.name === 'string' ? parsed.name.trim().slice(0, 40) : '',
      interests: Array.isArray(parsed.interests)
        ? parsed.interests.filter((item): item is string => typeof item === 'string')
        : [],
    }
  } catch {
    return { name: '', interests: [] }
  }
}

export function saveProfile(profile: Profile): void {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // A blocked write just means the profile is not remembered.
  }
}

export function hasOnboarded(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDED_KEY) === '1'
  } catch {
    return true
  }
}

export function markOnboarded(): void {
  try {
    window.localStorage.setItem(ONBOARDED_KEY, '1')
  } catch {
    // The welcome may simply show again next time.
  }
}

export function loadPlace(): Place | null {
  try {
    const raw = window.localStorage.getItem(PLACE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Place
    return typeof parsed?.lat === 'number' ? parsed : null
  } catch {
    return null
  }
}

export function forgetPlace(): void {
  try {
    window.localStorage.removeItem(PLACE_KEY)
  } catch {
    // Nothing to clean up if storage is blocked.
  }
}

export function savePlace(place: Place): void {
  try {
    window.localStorage.setItem(PLACE_KEY, JSON.stringify(place))
  } catch {
    // Location is a convenience; failing to persist it is harmless.
  }
}

/** "Hridhin Varkey Joseph" → "HJ", "Hridhin" → "H". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? ''
}
