import type { Hackathon } from '../types'
import { addDays, daysUntil, parseDate } from './date'
import { isNativeApp } from './platform'

const KEY = 'hackmate.reminders.v1'
const MAX_SCHEDULED = 60
const REMINDER_HOUR = 9
const TIMER_NOTIFICATION_ID = 1

type ReminderState = { enabled: boolean; notified: string[] }

export type ScheduledReminder = { id: number; title: string; body: string; at: Date }

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

/** A stable positive id, kept clear of the ids reserved above. */
function reminderId(key: string): number {
  let hash = 7
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return (Math.abs(hash) % 2_000_000_000) + 100
}

/** Plans a 9 AM nudge two days before each open deadline and on the day itself. */
export function reminderSchedule(events: Hackathon[], now = new Date()): ScheduledReminder[] {
  return events
    .filter((event) => !['Won', 'Completed'].includes(event.status))
    .flatMap((event) =>
      [2, 0].map((daysBefore): ScheduledReminder => {
        const at = addDays(parseDate(event.deadline), -daysBefore)
        at.setHours(REMINDER_HOUR, 0, 0, 0)
        return {
          id: reminderId(`${event.id}:${event.deadline}:${daysBefore}`),
          title:
            daysBefore === 0 ? `${event.name} closes today` : `${event.name} closes in 2 days`,
          body: 'Open Hackmate and see what is left.',
          at,
        }
      }),
    )
    .filter((reminder) => reminder.at > now)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED)
}

let lastSchedule = ''

async function syncNativeReminders(events: Hackathon[]): Promise<void> {
  const reminders = getReminderState().enabled ? reminderSchedule(events) : []
  const signature = reminders.map((reminder) => reminder.id).join(',')
  if (signature === lastSchedule) return
  lastSchedule = signature

  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const { notifications: pending } = await LocalNotifications.getPending()
  if (pending.length > 0) await LocalNotifications.cancel({ notifications: pending })
  if (reminders.length === 0) return
  await LocalNotifications.schedule({
    notifications: reminders.map(({ id, title, body, at }) => ({
      id,
      title,
      body,
      schedule: { at, allowWhileIdle: true },
    })),
  })
}

export async function enableReminders(): Promise<boolean> {
  if (isNativeApp()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.requestPermissions()
    if (display !== 'granted') return false
    save({ enabled: true, notified: [] })
    return true
  }

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

/** Shows a one-off alert when the focus timer finishes. */
export function notifyTimerDone(): void {
  const title = 'Time is up'
  const body = 'Your Hackmate timer just rang.'
  if (isNativeApp()) {
    void import('@capacitor/local-notifications')
      .then(({ LocalNotifications }) =>
        LocalNotifications.schedule({
          notifications: [
            { id: TIMER_NOTIFICATION_ID, title, body, schedule: { at: new Date(Date.now() + 500) } },
          ],
        }),
      )
      .catch(() => undefined)
    return
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}

/**
 * Keeps reminders current. On Android they are handed to the system so they
 * fire with the app closed. In a browser they fire while the app is open, at
 * most once per event and deadline, for deadlines within 2 days.
 */
export function runReminders(events: Hackathon[]): void {
  if (isNativeApp()) {
    void syncNativeReminders(events).catch(() => {
      lastSchedule = ''
    })
    return
  }

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
