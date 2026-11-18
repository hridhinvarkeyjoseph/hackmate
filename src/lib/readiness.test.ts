import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import type { Hackathon } from '../types'
import { assessReadiness } from './readiness'

const blank: Hackathon = {
  ...sampleHackathons[0],
  teamSize: 3,
  team: [],
  tasks: [],
  notes: '',
  submission: { repo: '', demo: '', video: '' },
}

describe('assessReadiness', () => {
  it('starts at zero and points at the biggest gap', () => {
    const result = assessReadiness(blank)
    expect(result.score).toBe(0)
    expect(result.missing[0]).toBe('Finish the tasks on your plan')
    expect(result.missing).toHaveLength(3)
  })

  it('counts a solo builder as having a team', () => {
    expect(assessReadiness({ ...blank, teamSize: 1 }).score).toBe(10)
  })

  it('gives partial credit for partly done tasks', () => {
    const tasks = [
      { id: 'a', label: 'One', done: true },
      { id: 'b', label: 'Two', done: false },
    ]
    expect(assessReadiness({ ...blank, tasks }).score).toBe(20)
  })

  it('reaches 100 when everything is in place', () => {
    const result = assessReadiness({
      ...blank,
      pitch: { project: 'a', problem: 'b', audience: 'c', solution: 'd', demo: 'e', impact: 'f' },
      team: [{ id: 'a', name: 'Asha', role: 'Dev' }],
      tasks: [{ id: 'a', label: 'One', done: true }],
      submission: { repo: 'r', demo: 'd', video: 'v' },
    })
    expect(result).toEqual({ score: 100, label: 'Ready to submit', missing: [] })
  })
})
