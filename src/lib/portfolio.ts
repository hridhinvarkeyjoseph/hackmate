import type { Hackathon } from '../types'
import { formatDate } from './date'

const SHOWN = ['Submitted', 'Won', 'Completed']

const clean = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()

/** Writes the user's finished hackathons as Markdown for a profile or resume. */
export function buildPortfolio(events: Hackathon[], name: string): string {
  const shipped = events
    .filter((event) => SHOWN.includes(event.status))
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
  const wins = shipped.filter((event) => event.status === 'Won').length
  const themes = [...new Set(shipped.flatMap((event) => event.themes))].slice(0, 8)

  const lines = [
    `# ${clean(name) ? `${clean(name)}'s hackathons` : 'My hackathons'}`,
    '',
    `${shipped.length} shipped · ${wins} ${wins === 1 ? 'win' : 'wins'}`,
  ]
  if (themes.length > 0) lines.push('', `Themes: ${themes.map(clean).join(', ')}`)

  for (const event of shipped) {
    const year = event.endDate.slice(0, 4)
    lines.push('', `## ${clean(event.name)}${event.status === 'Won' ? ' (Winner)' : ''}`, '')
    lines.push(
      [clean(event.organizer), `${formatDate(event.endDate)}, ${year}`, event.mode]
        .filter(Boolean)
        .join(' · '),
    )
    if (event.status === 'Won' && event.prize) lines.push('', `Prize: ${clean(event.prize)}`)
    if (event.notes.trim()) lines.push('', clean(event.notes))
    const links = [
      ['Code', event.submission.repo],
      ['Demo', event.submission.demo],
      ['Video', event.submission.video],
    ].filter(([, url]) => url)
    if (links.length > 0) {
      lines.push('', links.map(([label, url]) => `[${label}](${url})`).join(' · '))
    }
  }

  return `${lines.join('\n')}\n`
}
