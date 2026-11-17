import type { Hackathon } from '../types'
import { parseDate } from './date'

const pad = (value: number) => String(value).padStart(2, '0')

const stamp = (date: Date): string =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}00`

const escape = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

const zip = (text: string): string => {
  const lines: string[] = []
  for (let i = 0; i < text.length; i += 74) lines.push(text.slice(i, i + 74))
  return lines.join('\r\n ')
}

/**
 * Builds a calendar file with one all-day event per hackathon plus its
 * registration deadline, so the whole season can live in a real calendar.
 */
export function buildICS(events: Hackathon[]): string {
  const now = stamp(new Date())
  const body: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hackmate//Hackathon Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const event of events) {
    const end = parseDate(event.endDate)
    const nextDay = new Date(end)
    nextDay.setDate(nextDay.getDate() + 1)

    const details = [
      event.organizer ? `Organizer: ${event.organizer}` : '',
      event.location ? `Where: ${event.location} (${event.mode})` : `Format: ${event.mode}`,
      event.prize ? `Prize: ${event.prize}` : '',
      event.website,
      event.notes,
    ]
      .filter(Boolean)
      .join('\n')

    body.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@hackmate`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${event.startDate.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${[
        nextDay.getFullYear(),
        pad(nextDay.getMonth() + 1),
        pad(nextDay.getDate()),
      ].join('')}`,
      `SUMMARY:${escape(event.name)}`,
      `DESCRIPTION:${escape(details)}`,
      event.location ? `LOCATION:${escape(event.location)}` : '',
      'END:VEVENT',
    )

    body.push(
      'BEGIN:VEVENT',
      `UID:${event.id}-deadline@hackmate`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${event.deadline.replace(/-/g, '')}`,
      `SUMMARY:${escape(`Deadline — ${event.name}`)}`,
      `DESCRIPTION:${escape('Registration / submission closes.')}`,
      'END:VEVENT',
    )

  }

  body.push('END:VCALENDAR')
  return zip(body.filter((line) => line !== '').join('\r\n'))
}

export function downloadICS(events: Hackathon[]): void {
  const blob = new Blob([buildICS(events)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'hackmate-season.ics'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
