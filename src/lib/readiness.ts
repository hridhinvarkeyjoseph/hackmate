import type { Hackathon } from '../types'

export type Readiness = {
  score: number
  label: string
  missing: string[]
}

/** Scores how ready a project is to submit, and names what would help most. */
export function assessReadiness(event: Hackathon): Readiness {
  const taskShare =
    event.tasks.length === 0
      ? 0
      : event.tasks.filter((task) => task.done).length / event.tasks.length
  const teamReady = event.teamSize <= 1 || event.team.length > 0

  const checks: Array<{ points: number; earned: number; fix: string }> = [
    { points: 30, earned: taskShare, fix: 'Finish the tasks on your plan' },
    { points: 20, earned: event.submission.repo ? 1 : 0, fix: 'Add your repo link' },
    { points: 15, earned: event.submission.demo ? 1 : 0, fix: 'Add a live demo link' },
    { points: 15, earned: event.submission.video ? 1 : 0, fix: 'Add your demo video' },
    { points: 10, earned: teamReady ? 1 : 0, fix: 'Name your team' },
    { points: 5, earned: event.tasks.length > 0 ? 1 : 0, fix: 'Make a plan' },
    { points: 5, earned: event.notes.trim() ? 1 : 0, fix: 'Write down your idea' },
  ]

  const score = Math.round(checks.reduce((total, check) => total + check.points * check.earned, 0))
  const label =
    score === 100
      ? 'Ready to submit'
      : score >= 75
        ? 'Almost there'
        : score >= 40
          ? 'Taking shape'
          : 'Just getting started'

  return {
    score,
    label,
    missing: checks
      .filter((check) => check.earned < 1)
      .sort((a, b) => b.points * (1 - b.earned) - a.points * (1 - a.earned))
      .slice(0, 3)
      .map((check) => check.fix),
  }
}
