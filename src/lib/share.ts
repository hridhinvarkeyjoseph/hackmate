import type { Hackathon } from '../types'
import { isNativeApp } from './platform'
import { makeId, normalizeEvents } from './storage'

const PUBLIC_APP_URL = 'https://hridhinvarkeyjoseph.github.io/hackmate/'
const HASH_PREFIX = '#join='
const MAX_ENCODED_LENGTH = 12_000

type SharedPlan = Pick<
  Hackathon,
  | 'name'
  | 'organizer'
  | 'mode'
  | 'location'
  | 'startDate'
  | 'endDate'
  | 'deadline'
  | 'prize'
  | 'teamSize'
  | 'themes'
  | 'website'
> & { tasks: string[] }

function toBase64Url(text: string): string {
  let binary = ''
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

/** Packs only the plan. Notes, teammates and submission links stay private. */
export function encodePlan(event: Hackathon): string {
  const plan: SharedPlan = {
    name: event.name,
    organizer: event.organizer,
    mode: event.mode,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    deadline: event.deadline,
    prize: event.prize,
    teamSize: event.teamSize,
    themes: event.themes,
    website: event.website,
    tasks: event.tasks.map((task) => task.label),
  }
  return toBase64Url(JSON.stringify(plan))
}

/** Reads a plan from a link, treating everything in it as untrusted. */
export function decodePlan(encoded: string): Hackathon | null {
  if (!encoded || encoded.length > MAX_ENCODED_LENGTH) return null
  try {
    const plan = JSON.parse(fromBase64Url(encoded)) as Partial<SharedPlan>
    const labels = Array.isArray(plan.tasks) ? plan.tasks : []
    const [event] = normalizeEvents([
      {
        ...plan,
        id: makeId('hm'),
        status: 'Registered',
        tasks: labels.map((label) => ({ id: makeId('task'), label, done: false })),
      },
    ])
    return event ?? null
  } catch {
    return null
  }
}

export function readSharedPlan(hash: string): Hackathon | null {
  return hash.startsWith(HASH_PREFIX) ? decodePlan(hash.slice(HASH_PREFIX.length)) : null
}

export function shareLink(event: Hackathon, base: string): string {
  return `${base}${HASH_PREFIX}${encodePlan(event)}`
}

/** Opens the share sheet where there is one, otherwise copies the link. */
export async function sharePlan(event: Hackathon): Promise<'shared' | 'copied'> {
  const base = isNativeApp()
    ? PUBLIC_APP_URL
    : `${window.location.origin}${window.location.pathname}`
  const url = shareLink(event, base)
  const title = `Join our ${event.name} plan`

  if (isNativeApp()) {
    const { Share } = await import('@capacitor/share')
    await Share.share({ title, url })
    return 'shared'
  }
  if (typeof navigator.share === 'function' && navigator.maxTouchPoints > 0) {
    await navigator.share({ title, url })
    return 'shared'
  }
  await navigator.clipboard.writeText(url)
  return 'copied'
}
