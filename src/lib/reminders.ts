import type { Hackathon } from '../types'
import { daysUntil } from './date'

const KEY = 'hackmate.reminders.v1'

type ReminderState = { enabled: boolean; notified: string[] }

export function getReminderState(): ReminderState {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ReminderState
      if (typeof parsed?.enabled === 'boolean') return parsed
    }
  } catch {
    // Ignore a broken preference.
  }
  return { enabled: false, notified: [] }
}

function save(state: ReminderState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Reminders are a nicety; a failed write is not fatal.
  }
}

export async function enableReminders(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission !== 'granted') return false
  save({ enabled: true, notified: [] })
  return true
}

export function disableReminders(): void {
  save({ enabled: false, notified: [] })
}

/** Fires at most one notification per event+deadline, for deadlines within 2 days. */
export function runReminders(events: Hackathon[]): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const state = getReminderState()
  if (!state.enabled) return

  const fresh: string[] = []
  for (const event of events) {
    if (['Won', 'Completed'].includes(event.status)) continue
    const days = daysUntil(event.deadline)
    if (days < 0 || days > 2) continue
    const key = `${event.id}:${event.deadline}`
    if (state.notified.includes(key)) continue
    new Notification(
      days === 0 ? `${event.name} closes today` : `${event.name} closes in ${days} day${days === 1 ? '' : 's'}`,
      { body: 'Open Hackmate and see what is left.', tag: key },
    )
    fresh.push(key)
  }

  if (fresh.length > 0) save({ ...state, notified: [...state.notified, ...fresh].slice(-50) })
}
