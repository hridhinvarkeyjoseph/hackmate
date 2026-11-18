import type { ViewName } from '../types'

const ROUTES: Record<ViewName, { path: string; title: string }> = {
  overview: { path: '', title: 'Overview' },
  hackathons: { path: 'hackathons', title: 'My hackathons' },
  calendar: { path: 'calendar', title: 'Calendar' },
  insights: { path: 'insights', title: 'Insights' },
  suggest: { path: 'ideas', title: 'Ideas' },
  nearby: { path: 'near-me', title: 'Near me' },
}

export function viewFromHash(hash: string): ViewName {
  const path = hash.replace(/^#\/?/, '')
  const match = (Object.keys(ROUTES) as ViewName[]).find((view) => ROUTES[view].path === path)
  return match ?? 'overview'
}

export const hashForView = (view: ViewName): string =>
  ROUTES[view].path ? `#/${ROUTES[view].path}` : ''

export const pageTitle = (view: ViewName): string => `${ROUTES[view].title} · Hackmate`
