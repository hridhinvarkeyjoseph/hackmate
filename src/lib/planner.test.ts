import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import type { Hackathon } from '../types'
import { planSprint } from './planner'

const event = (overrides: Partial<Hackathon> = {}): Hackathon => ({
  ...sampleHackathons[0],
  startDate: '2026-12-01',
  endDate: '2026-12-11',
  tasks: [],
  ...overrides,
})

const now = new Date(2026, 10, 18, 12)
let next = 0
const id = () => `task-${next++}`

describe('planSprint', () => {
  it('runs from the start date to the end date', () => {
    const plan = planSprint(event(), now, id)
    expect(plan[0].label).toBe('Dec 1: Read the rules and judging criteria')
    expect(plan.at(-1)?.label).toBe('Dec 10: Submit early and check every link')
  })

  it('compresses into the time left once the event is running', () => {
    const plan = planSprint(event({ startDate: '2026-11-01', endDate: '2026-11-18' }), now, id)
    expect(plan.every((task) => task.label.startsWith('Nov 18:'))).toBe(true)
  })

  it('does not plan a finished event', () => {
    expect(planSprint(event({ endDate: '2026-11-17' }), now, id)).toEqual([])
  })

  it('does not repeat steps already on the plan', () => {
    const first = planSprint(event(), now, id)
    expect(planSprint(event({ tasks: first }), now, id)).toEqual([])
  })
})
