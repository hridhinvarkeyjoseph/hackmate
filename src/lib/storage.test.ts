import { afterEach, describe, expect, it, vi } from 'vitest'
import { sampleHackathons } from '../data'
import { backupDue, normalizeEvents, safeUrl } from './storage'

const mine = { ...sampleHackathons[0], id: 'mine' }

const withLastBackup = (value: string | null) =>
  vi.stubGlobal('window', { localStorage: { getItem: () => value } })

afterEach(() => vi.unstubAllGlobals())

describe('backupDue', () => {
  it('stays quiet for the sample season', () => {
    withLastBackup(null)
    expect(backupDue(sampleHackathons)).toBe(false)
  })

  it('asks once the user has their own data', () => {
    withLastBackup(null)
    expect(backupDue([mine])).toBe(true)
  })

  it('stays quiet after a recent backup', () => {
    withLastBackup(String(Date.now()))
    expect(backupDue([mine])).toBe(false)
  })
})

describe('safeUrl', () => {
  it('keeps web links', () => {
    expect(safeUrl('https://example.com')).toBe('https://example.com')
    expect(safeUrl('github.com/me/app')).toBe('github.com/me/app')
  })

  it('removes links that could run code', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('')
    expect(safeUrl(' JavaScript:alert(1)')).toBe('')
    expect(safeUrl('data:text/html,hi')).toBe('')
  })

  it('cleans links in imported hackathons', () => {
    const [event] = normalizeEvents([
      { name: 'Bad', website: 'javascript:x', submission: { repo: 'javascript:y' } },
    ])
    expect(event.website).toBe('')
    expect(event.submission.repo).toBe('')
  })
})
