import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import type { Hackathon } from '../types'
import { decodePlan, encodePlan, readSharedPlan, shareLink } from './share'

const event: Hackathon = {
  ...sampleHackathons[0],
  name: 'हैक Week ✨',
  notes: 'Private idea',
  website: 'https://example.com',
  team: [{ id: 't', name: 'Asha', role: 'Dev' }],
  tasks: [{ id: 'a', label: 'Build it', done: true, dueDate: '2026-12-01' }],
  submission: { repo: 'https://secret.dev', demo: '', video: '' },
}

const encodeRaw = (value: unknown) => btoa(JSON.stringify(value))

describe('share links', () => {
  it('round-trips a plan, including non-English text', () => {
    const result = decodePlan(encodePlan(event))
    expect(result?.name).toBe(event.name)
    expect(result?.deadline).toBe(event.deadline)
    expect(result?.tasks.map((task) => task.label)).toEqual(['Build it'])
  })

  it('keeps task due dates', () => {
    expect(decodePlan(encodePlan(event))?.tasks[0].dueDate).toBe('2026-12-01')
  })

  it('still opens older links with plain task names', () => {
    const result = decodePlan(encodeRaw({ name: 'Old', tasks: ['Build it'] }))
    expect(result?.tasks[0].label).toBe('Build it')
  })

  it('gives the teammate a fresh copy', () => {
    const result = decodePlan(encodePlan(event))
    expect(result?.id).not.toBe(event.id)
    expect(result?.tasks[0].done).toBe(false)
  })

  it('keeps private details out of the link', () => {
    const link = shareLink(event, 'https://app.test/')
    const decoded = atob(
      link.split('#join=')[1].replace(/-/g, '+').replace(/_/g, '/'),
    )
    expect(decoded).not.toContain('Private idea')
    expect(decoded).not.toContain('Asha')
    expect(decoded).not.toContain('secret.dev')
  })

  it('removes unsafe links', () => {
    expect(decodePlan(encodeRaw({ name: 'Bad', website: 'javascript:x' }))?.website).toBe('')
  })

  it('rejects damaged or oversized links', () => {
    expect(decodePlan('%%%')).toBeNull()
    expect(decodePlan('a'.repeat(12_001))).toBeNull()
    expect(decodePlan(encodeRaw({ tasks: [] }))).toBeNull()
  })

  it('only reads the join hash', () => {
    expect(readSharedPlan('#other')).toBeNull()
    expect(readSharedPlan(`#join=${encodePlan(event)}`)?.name).toBe(event.name)
  })
})
