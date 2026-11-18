import { afterEach, describe, expect, it, vi } from 'vitest'
import { sampleHackathons } from '../data'
import { backupDue } from './storage'

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
