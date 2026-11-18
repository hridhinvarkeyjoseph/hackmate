import { emptyPitch, MAX_PITCH_FIELD } from './pitch'
import { saveTextFile } from './platform'
import type { Hackathon, Pitch, Mode, Status, Submission, Task, TeamMember } from '../types'
import { MODES, STATUSES } from '../types'
import { sampleHackathons } from '../data'
import { toISODate } from './date'

export const STORAGE_KEY = 'hackmate.events.v1'
export const SCHEMA_VERSION = 2
export const BACKUP_KEY = 'hackmate.lastBackup.v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const asISODate = (value: unknown, fallback: string): string => {
  const text = asString(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : fallback
}

export const makeId = (prefix: string): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID().slice(0, 8)}`
    : `${prefix}-${Math.random().toString(36).slice(2, 10)}`

/** Keeps web links only, so imported data can never run script from a link. */
export function safeUrl(value: unknown): string {
  const url = asString(value).trim()
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1].toLowerCase()
  if (scheme && scheme !== 'http' && scheme !== 'https') return ''
  return url
}

const normalizeTeam = (value: unknown): TeamMember[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry, index): TeamMember | null => {
      if (!isRecord(entry)) return null
      const name = asString(entry.name).trim()
      if (!name) return null
      return {
        id: asString(entry.id) || `hm-member-${index}`,
        name,
        role: asString(entry.role).trim(),
      }
    })
    .filter((entry): entry is TeamMember => entry !== null)
}

const normalizeTasks = (value: unknown): Task[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry, index): Task | null => {
      if (!isRecord(entry)) return null
      const label = asString(entry.label).trim()
      if (!label) return null
      return {
        id: asString(entry.id) || `hm-task-${index}`,
        label,
        done: entry.done === true,
        ...(/^\d{4}-\d{2}-\d{2}$/.test(asString(entry.dueDate))
          ? { dueDate: asString(entry.dueDate) }
          : {}),
      }
    })
    .filter((entry): entry is Task => entry !== null)
}

const normalizeSubmission = (value: unknown): Submission => {
  const raw = isRecord(value) ? value : {}
  return {
    repo: safeUrl(raw.repo),
    demo: safeUrl(raw.demo),
    video: safeUrl(raw.video),
  }
}

const normalizePitch = (value: unknown): Pitch | undefined => {
  if (!isRecord(value)) return undefined
  const pitch = emptyPitch()
  for (const key of Object.keys(pitch) as Array<keyof Pitch>) {
    pitch[key] = asString(value[key]).slice(0, MAX_PITCH_FIELD)
  }
  return pitch
}

/**
 * Rebuilds a hackathon from whatever was stored, so a hand-edited or
 * older save can never render a half-empty card or crash a view.
 * Returns null only when the entry is unusable (no name at all).
 */
function normalizeEvent(raw: unknown, index: number): Hackathon | null {
  if (!isRecord(raw)) return null

  const name = asString(raw.name).trim()
  if (!name) return null

  const today = toISODate(new Date())
  const startDate = asISODate(raw.startDate, today)
  const endDate = asISODate(raw.endDate, startDate)
  const teamSize = Number(raw.teamSize)
  const status = STATUSES.includes(raw.status as Status) ? (raw.status as Status) : 'Idea'
  const mode = MODES.includes(raw.mode as Mode) ? (raw.mode as Mode) : 'Online'
  const themes = Array.isArray(raw.themes)
    ? raw.themes.filter((theme): theme is string => typeof theme === 'string' && theme.trim() !== '')
    : []

  return {
    id: asString(raw.id) || `hm-recovered-${index}`,
    name,
    organizer: asString(raw.organizer),
    mode,
    location: asString(raw.location),
    startDate,
    endDate: endDate < startDate ? startDate : endDate,
    deadline: asISODate(raw.deadline, startDate),
    status,
    prize: asString(raw.prize),
    teamSize: Number.isFinite(teamSize) && teamSize >= 1 ? Math.round(teamSize) : 1,
    themes,
    notes: asString(raw.notes),
    website: safeUrl(raw.website),
    favorite: raw.favorite === true,
    createdAt: asString(raw.createdAt) || new Date().toISOString(),
    team: normalizeTeam(raw.team),
    tasks: normalizeTasks(raw.tasks),
    submission: normalizeSubmission(raw.submission),
    ...(normalizePitch(raw.pitch) ? { pitch: normalizePitch(raw.pitch) } : {}),
  }
}

export function normalizeEvents(value: unknown): Hackathon[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry, index) => normalizeEvent(entry, index))
    .filter((entry): entry is Hackathon => entry !== null)
}

/** Reads the saved list; falls back to the sample set on a first visit. */
export function loadEvents(): Hackathon[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) return normalizeEvents(parsed)
      if (isRecord(parsed) && Array.isArray(parsed.events)) {
        return normalizeEvents(parsed.events)
      }
    }
  } catch {
    // A malformed save should never block the app from opening.
  }
  return sampleHackathons
}

/** Returns false when the browser refuses the write (quota, private mode). */
export function saveEvents(events: Hackathon[]): boolean {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: SCHEMA_VERSION, savedAt: new Date().toISOString(), events }),
    )
    return true
  } catch {
    return false
  }
}

export async function downloadEvents(events: Hackathon[]): Promise<void> {
  const payload = {
    app: 'hackmate',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    count: events.length,
    events,
  }
  await saveTextFile(
    `hackmate-${toISODate(new Date())}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  )
  try {
    window.localStorage.setItem(BACKUP_KEY, String(Date.now()))
  } catch {
    // The stamp only drives the reminder.
  }
}

/** True while the board holds nothing the user added. */
export function isSampleBoard(events: Hackathon[]): boolean {
  const samples = new Set(sampleHackathons.map((event) => event.id))
  return events.every((event) => samples.has(event.id))
}

/** True when the user has added their own data and has no recent export. */
export function backupDue(events: Hackathon[]): boolean {
  if (isSampleBoard(events)) return false
  try {
    const last = window.localStorage.getItem(BACKUP_KEY)
    if (!last) return true
    return Date.now() - Number(last) > 7 * 86_400_000
  } catch {
    return false
  }
}

/** Accepts both a bare array and a Hackmate export envelope. */
export function parseImport(text: string): Hackathon[] | null {
  try {
    const parsed: unknown = JSON.parse(text)
    const list = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.events)
        ? parsed.events
        : null

    if (!list) return null
    const events = normalizeEvents(list)
    if (list.length > 0 && events.length === 0) return null
    return events
  } catch {
    return null
  }
}
