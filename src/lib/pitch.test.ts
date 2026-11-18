import { describe, expect, it } from 'vitest'
import { sampleHackathons } from '../data'
import { normalizeEvents } from './storage'
import { buildPitchScript, emptyPitch, pitchProgress, speakingSeconds } from './pitch'

const event = { ...sampleHackathons[0], name: 'Build Week' }

describe('pitch builder', () => {
  it('measures how much is written', () => {
    expect(pitchProgress(undefined)).toBe(0)
    expect(pitchProgress({ ...emptyPitch(), project: 'App', problem: ' ' })).toBeCloseTo(1 / 6)
  })

  it('builds a script in speaking order', () => {
    const script = buildPitchScript(event, {
      project: 'Hackmate',
      problem: 'Students miss hackathons',
      audience: 'first-years',
      solution: 'it ranks them',
      demo: 'I pick a city',
      impact: 'More students ship!',
    })
    expect(script).toBe(
      'Students miss hackathons. This hits first-years hardest. For Build Week, we built Hackmate: it ranks them. Here is the demo: I pick a city. More students ship!',
    )
  })

  it('leaves out unanswered parts', () => {
    expect(buildPitchScript(event, emptyPitch())).toBe('')
    expect(buildPitchScript(event, { ...emptyPitch(), project: 'App' })).toBe(
      'For Build Week, we built App.',
    )
  })

  it('estimates speaking time', () => {
    expect(speakingSeconds(Array(144).fill('word').join(' '))).toBe(60)
  })

  it('survives saving and rejects bad pitch data', () => {
    const [kept] = normalizeEvents([{ name: 'A', pitch: { project: 'App', problem: 5 } }])
    expect(kept.pitch).toEqual({ ...emptyPitch(), project: 'App' })
    expect(normalizeEvents([{ name: 'A', pitch: 'x' }])[0].pitch).toBeUndefined()
  })
})
