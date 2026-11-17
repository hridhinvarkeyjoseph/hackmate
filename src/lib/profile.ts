export const PROFILE_KEY = 'hackmate.profile.v1'

export type Profile = { name: string }

export function loadProfile(): Profile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)
    if (!raw) return { name: '' }
    const parsed = JSON.parse(raw) as { name?: unknown }
    return { name: typeof parsed.name === 'string' ? parsed.name.trim().slice(0, 40) : '' }
  } catch {
    return { name: '' }
  }
}

export function saveProfile(profile: Profile): void {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // A blocked write just means the name is not remembered.
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
