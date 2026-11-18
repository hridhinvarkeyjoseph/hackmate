import type { Hackathon, Task } from '../types'
import { addDays, daysBetween, formatDate, parseDate, startOfDay, toISODate } from './date'

/** Each step starts at this share of the available time. */
const PHASES: Array<[number, string]> = [
  [0, 'Read the rules and judging criteria'],
  [0, 'Lock the idea and split roles'],
  [0.1, 'Get the repo and a skeleton running'],
  [0.2, 'Build the one flow you will demo'],
  [0.6, 'Freeze features and fix bugs'],
  [0.7, 'Write the README and add screenshots'],
  [0.8, 'Record a two-minute demo video'],
  [0.9, 'Rehearse the pitch out loud'],
  [0.95, 'Submit early and check every link'],
]

/**
 * Spreads a proven hackathon routine across the time that is really left, and
 * skips anything already on the plan. A finished event gets no plan.
 */
export function planSprint(
  event: Hackathon,
  now: Date,
  makeTaskId: () => string,
): Task[] {
  const today = startOfDay(now)
  const end = startOfDay(parseDate(event.endDate))
  if (end < today) return []

  const scheduledStart = startOfDay(parseDate(event.startDate))
  const start = scheduledStart > today ? scheduledStart : today
  const span = Math.max(daysBetween(start, end), 0)
  const existing = event.tasks.map((task) => task.label.toLowerCase())

  return PHASES.filter(([, label]) => !existing.some((task) => task.includes(label.toLowerCase()))).map(
    ([share, label]) => ({
      id: makeTaskId(),
      label: `${formatDate(toISODate(addDays(start, Math.floor(span * share))))}: ${label}`,
      done: false,
    }),
  )
}
