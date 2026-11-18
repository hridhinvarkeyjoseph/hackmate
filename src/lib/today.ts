import type { Hackathon, Task } from '../types'
import { daysBetween, formatDate, parseDate, startOfDay, toISODate } from './date'

export type FocusItem = {
  event: Hackathon
  task: Task
  title: string
  when: string
  tone: 'late' | 'today' | 'next'
}

const DATE_PREFIX = /^[A-Z][a-z]{2} \d{1,2}: /
const LIMIT = 5

/**
 * Picks what to do now from every sprint plan: anything due or overdue, or the
 * next few steps when today is clear.
 */
export function todaysFocus(events: Hackathon[], now = new Date()): FocusItem[] {
  const today = toISODate(startOfDay(now))
  const open = events
    .filter((event) => !['Won', 'Completed'].includes(event.status) && event.endDate >= today)
    .flatMap((event) =>
      event.tasks
        .filter((task) => !task.done && task.dueDate)
        .map((task) => ({ event, task, dueDate: task.dueDate as string })),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const due = open.filter((item) => item.dueDate <= today)
  return (due.length > 0 ? due : open).slice(0, LIMIT).map(({ event, task, dueDate }) => {
    const late = daysBetween(parseDate(dueDate), parseDate(today))
    return {
      event,
      task,
      title: task.label.replace(DATE_PREFIX, ''),
      when: late > 0 ? `${late} day${late === 1 ? '' : 's'} late` : late === 0 ? 'Today' : formatDate(dueDate),
      tone: late > 0 ? 'late' : late === 0 ? 'today' : 'next',
    }
  })
}
