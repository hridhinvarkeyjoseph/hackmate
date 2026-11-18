import type { Hackathon, Pitch } from '../types'

export const PITCH_FIELDS: Array<{ key: keyof Pitch; label: string; placeholder: string }> = [
  { key: 'project', label: 'Project name', placeholder: 'Hackmate' },
  {
    key: 'problem',
    label: 'What problem are you solving?',
    placeholder: 'Students miss great hackathons because listings are scattered',
  },
  { key: 'audience', label: 'Who has this problem?', placeholder: 'first-year students' },
  {
    key: 'solution',
    label: 'What does your project do?',
    placeholder: 'it ranks open hackathons and builds a plan for the one you pick',
  },
  {
    key: 'demo',
    label: 'What will you show in the demo?',
    placeholder: 'I pick my city and get a plan in under a minute',
  },
  {
    key: 'impact',
    label: 'Why does it matter?',
    placeholder: 'More students show up prepared and actually ship',
  },
]

export const MAX_PITCH_FIELD = 400
const WORDS_PER_SECOND = 2.4

export const emptyPitch = (): Pitch => ({
  project: '',
  problem: '',
  audience: '',
  solution: '',
  demo: '',
  impact: '',
})

/** The share of the pitch that has been written, from 0 to 1. */
export function pitchProgress(pitch: Pitch | undefined): number {
  if (!pitch) return 0
  return PITCH_FIELDS.filter(({ key }) => pitch[key].trim()).length / PITCH_FIELDS.length
}

const sentence = (value: string) => {
  const text = value.trim()
  return /[.!?]$/.test(text) ? text : `${text}.`
}

/** Turns the answers into a script, using only the parts that are filled in. */
export function buildPitchScript(event: Hackathon, pitch: Pitch): string {
  const project = pitch.project.trim() || 'our project'
  const solution = pitch.solution.trim()
  return [
    pitch.problem.trim() && sentence(pitch.problem),
    pitch.audience.trim() && sentence(`This hits ${pitch.audience.trim()} hardest`),
    solution
      ? sentence(`For ${event.name}, we built ${project}: ${solution}`)
      : pitch.project.trim() && sentence(`For ${event.name}, we built ${project}`),
    pitch.demo.trim() && sentence(`Here is the demo: ${pitch.demo.trim()}`),
    pitch.impact.trim() && sentence(pitch.impact),
  ]
    .filter(Boolean)
    .join(' ')
}

export function speakingSeconds(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length
  return Math.round(words / WORDS_PER_SECOND)
}
