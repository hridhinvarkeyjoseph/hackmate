import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import type { Hackathon } from '../types'
import { reminderSchedule } from './reminders'

const event = (overrides: Partial<Hackathon>): Hackathon => ({
  ...sampleHackathons[0],
  id: 'one',
  name: 'Build Week',
  status: 'Registered',
  deadline: '2026-11-25',
  ...overrides,
})

const now = new Date(2026, 10, 18, 12)

describe('reminderSchedule', () => {
  it('plans a nudge two days ahead and on the day, at 9 AM', () => {
    const [first, second] = reminderSchedule([event({})], now)
    expect(first.title).toBe('Build Week closes in 2 days')
    expect(first.at).toEqual(new Date(2026, 10, 23, 9))
    expect(second.title).toBe('Build Week closes today')
    expect(second.at).toEqual(new Date(2026, 10, 25, 9))
  })

  it('drops times already past', () => {
    expect(reminderSchedule([event({ deadline: '2026-11-19' })], now)).toHaveLength(1)
  })

  it('ignores finished hackathons', () => {
    expect(reminderSchedule([event({ status: 'Won' })], now)).toEqual([])
  })

  it('gives each reminder its own id', () => {
    const ids = reminderSchedule([event({}), event({ id: 'two' })], now).map((item) => item.id)
    expect(new Set(ids).size).toBe(4)
  })
})
