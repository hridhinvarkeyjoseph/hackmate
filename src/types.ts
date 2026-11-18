export const STATUSES = [
  'Idea',
  'Registered',
  'In progress',
  'Submitted',
  'Won',
  'Completed',
] as const

export type Status = (typeof STATUSES)[number]

export const MODES = ['Online', 'In person', 'Hybrid'] as const

export type Mode = (typeof MODES)[number]

export type TeamMember = {
  id: string
  name: string
  role: string
}

export type Task = {
  id: string
  label: string
  done: boolean
  dueDate?: string
}

export type Submission = {
  repo: string
  demo: string
  video: string
}

export type Pitch = {
  project: string
  problem: string
  audience: string
  solution: string
  demo: string
  impact: string
}

export type Hackathon = {
  id: string
  name: string
  organizer: string
  mode: Mode
  location: string
  startDate: string
  endDate: string
  deadline: string
  status: Status
  prize: string
  teamSize: number
  themes: string[]
  notes: string
  website: string
  favorite: boolean
  createdAt: string
  team: TeamMember[]
  tasks: Task[]
  submission: Submission
  pitch?: Pitch
}

export type ViewName = 'overview' | 'hackathons' | 'calendar' | 'insights' | 'suggest'
  | 'nearby'

export type SortOption = 'soonest' | 'deadline' | 'name' | 'recent'

export type Theme = 'light' | 'dark'
