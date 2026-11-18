import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import type { Hackathon, Task } from '../types'
import { todaysFocus } from './today'

const now = new Date(2026, 10, 18, 12)
const task = (id: string, dueDate?: string, done = false): Task => ({
  id,
  label: `Nov 18: Step ${id}`,
  done,
  dueDate,
})
const event = (tasks: Task[], overrides: Partial<Hackathon> = {}): Hackathon => ({
  ...sampleHackathons[0],
  status: 'Registered',
  endDate: '2026-12-01',
  tasks,
  ...overrides,
})

describe('todaysFocus', () => {
  it('puts overdue work first and hides the date in the title', () => {
    const items = todaysFocus([event([task('b', '2026-11-18'), task('a', '2026-11-16')])], now)
    expect(items.map((item) => item.when)).toEqual(['2 days late', 'Today'])
    expect(items[1].title).toBe('Step b')
  })

  it('leaves future steps out while something is due', () => {
    expect(todaysFocus([event([task('a', '2026-11-18'), task('b', '2026-11-25')])], now)).toHaveLength(1)
  })

  it('shows what is next when today is clear', () => {
    const [item] = todaysFocus([event([task('a', '2026-11-25')])], now)
    expect(item).toMatchObject({ when: 'Nov 25', tone: 'next' })
  })

  it('ignores finished tasks, undated tasks and finished events', () => {
    expect(todaysFocus([event([task('a', '2026-11-18', true), task('b')])], now)).toEqual([])
    expect(todaysFocus([event([task('a', '2026-11-18')], { status: 'Won' })], now)).toEqual([])
    expect(todaysFocus([event([task('a', '2026-11-01')], { endDate: '2026-11-10' })], now)).toEqual([])
  })
})
