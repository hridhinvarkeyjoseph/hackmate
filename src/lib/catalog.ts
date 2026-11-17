import type { Hackathon } from '../types'

export type CatalogEntry = {
  id: string
  name: string
  organizer: string
  mode: Hackathon['mode']
  location: string
  themes: string[]
  prize: string
  blurb: string
  website: string
  country: string
  applyUrl: string
  start: number
  end: number
  deadline: number
}

/** India-first shelf of representative events. Proposals, not live listings. */
export const catalog: CatalogEntry[] = []

export type Suggestion = { entry: CatalogEntry; score: number; reason: string }

export function suggestHackathons(events: Hackathon[], limit = 4): Suggestion[] {
  if (events.length === 0) {
    return catalog.slice(0, limit).map((entry) => ({
      entry,
      score: 0,
      reason: 'A good place to start your season.',
    }))
  }

  const themeCounts = new Map<string, number>()
  const modeCounts = new Map<string, number>()
  for (const event of events) {
    for (const theme of event.themes) themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1)
    modeCounts.set(event.mode, (modeCounts.get(event.mode) ?? 0) + 1)
  }

  const favouriteMode = [...modeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const trackedNames = new Set(events.map((event) => event.name.toLowerCase()))

  return catalog
    .filter((entry) => !trackedNames.has(entry.name.toLowerCase()))
    .map((entry) => {
      const matched = entry.themes.filter((theme) => themeCounts.has(theme))
      const score =
        matched.reduce((total, theme) => total + (themeCounts.get(theme) ?? 0) * 3, 0) +
        (entry.mode === favouriteMode ? 2 : 0)
      const reason =
        matched.length > 0
          ? `Because you keep choosing ${matched.slice(0, 2).join(' and ')}`
          : entry.mode === favouriteMode
            ? `Another ${entry.mode.toLowerCase()} one, like most of your picks`
            : 'Something a little different from your usual'
      return { entry, score, reason }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export type NextStep = {
  id: string
  title: string
  body: string
  eventId?: string
  tone: 'urgent' | 'calm' | 'win'
}

export function nextSteps(events: Hackathon[], today = new Date()): NextStep[] {
  const steps: NextStep[] = []
  const day = 86_400_000

  for (const event of events) {
    const deadline = new Date(`${event.deadline}T12:00:00`)
    const days = Math.round((deadline.getTime() - today.getTime()) / day)
    const openTasks = event.tasks.filter((task) => !task.done)
    const missingLinks =
      event.status === 'Submitted' &&
      !event.submission.repo &&
      !event.submission.demo &&
      !event.submission.video

    if (days >= 0 && days <= 7 && !['Won', 'Completed'].includes(event.status)) {
      steps.push({
        id: `${event.id}-deadline`,
        title: days === 0 ? `${event.name} closes today` : `${event.name} closes in ${days} days`,
        body: 'Indian deadlines often close at midnight IST — check the exact time on the listing.',
        eventId: event.id,
        tone: 'urgent',
      })
    }
    if (openTasks.length > 0) {
      steps.push({
        id: `${event.id}-tasks`,
        title: `${openTasks.length} ${openTasks.length === 1 ? 'task' : 'tasks'} left on ${event.name}`,
        body: `Next up: ${openTasks[0].label}.`,
        eventId: event.id,
        tone: 'calm',
      })
    }
    if (missingLinks) {
      steps.push({
        id: `${event.id}-links`,
        title: `Add your submission links for ${event.name}`,
        body: 'Keep the repo, demo and video together so judging day is easy.',
        eventId: event.id,
        tone: 'calm',
      })
    }
    if (event.team.length === 0 && event.teamSize > 1 && !['Won', 'Completed'].includes(event.status)) {
      steps.push({
        id: `${event.id}-team`,
        title: `Name your crew for ${event.name}`,
        body: `You planned for ${event.teamSize} people — add them so you know who is doing what.`,
        eventId: event.id,
        tone: 'calm',
      })
    }
    if (event.status === 'Won') {
      steps.push({
        id: `${event.id}-win`,
        title: `${event.name} is a win worth writing down`,
        body: 'One paragraph on what worked now is a shortcut later.',
        eventId: event.id,
        tone: 'win',
      })
    }
  }

  return steps.slice(0, 6)
}

/** Real, India-first listing pages to browse in the browser. */
export const sources = [
  { name: 'Unstop', url: 'https://unstop.com/hackathons', note: 'The biggest Indian listing board' },
  { name: 'Devfolio', url: 'https://devfolio.co/hackathons', note: 'Crypto and product hackathons' },
  { name: 'HackerEarth', url: 'https://www.hackerearth.com/challenges/hackathon/', note: 'Hiring challenges and contests' },
  { name: 'Smart India Hackathon', url: 'https://sih.gov.in', note: 'Government problem statements' },
  { name: 'Devpost', url: 'https://devpost.com/hackathons', note: 'Global, with India-friendly online events' },
  { name: 'MLH', url: 'https://mlh.io/events', note: 'Major League Hacking season calendar' },
]
