/** Shape written by scripts/fetch-hackathons.mjs. */
export type LiveEvent = {
  id: string
  name: string
  organizer: string
  mode: 'Online' | 'In person' | 'Hybrid'
  location: string
  themes: string[]
  prize: string
  applyUrl: string
  startDate: string
  endDate: string
  deadline: string
  region: string
  open: boolean
  source: string
}
