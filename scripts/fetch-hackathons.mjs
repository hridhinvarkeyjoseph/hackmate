#!/usr/bin/env node
/**
 * Pulls hackathons from the public Unstop and Devfolio endpoints and writes
 * public/live-hackathons.json. These endpoints are unofficial, so if the
 * format changes the previous file is kept and the app keeps working.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fromDevfolio, fromUnstop, selectUpcoming } from './listings.mjs'

const PAGES = Number(process.env.PAGES || 3)
const OUT = new URL('../public/live-hackathons.json', import.meta.url)
const UNSTOP = 'https://unstop.com/api/public/opportunity/search-new?opportunity=hackathons&page='
const DEVFOLIO = 'https://api.devfolio.co/api/hackathons?page='
const HEADERS = { 'user-agent': 'Mozilla/5.0 (Hackmate local ingest)' }

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchUnstop() {
  const events = []
  for (let page = 1; page <= PAGES; page += 1) {
    const res = await fetch(UNSTOP + page, { headers: HEADERS })
    if (!res.ok) throw new Error(`Unstop page ${page}: HTTP ${res.status}`)
    const json = await res.json()
    const rows = json?.data?.data
    if (!Array.isArray(rows) || rows.length === 0) break
    events.push(...rows.map(fromUnstop))
    if (page < PAGES) await pause(600)
  }
  return events
}

async function fetchDevfolio() {
  const events = []
  for (let page = 1; page <= PAGES; page += 1) {
    try {
      const res = await fetch(DEVFOLIO + page, { headers: HEADERS })
      if (!res.ok) break
      const json = await res.json()
      const rows = json?.result ?? json?.hackathons ?? []
      if (!Array.isArray(rows) || rows.length === 0) break
      events.push(...rows.map(fromDevfolio).filter(Boolean))
      if (page < PAGES) await pause(500)
    } catch (error) {
      console.warn(`devfolio page ${page} failed: ${error.message}`)
      break
    }
  }
  return events
}

async function main() {
  const events = [...(await fetchUnstop()), ...(await fetchDevfolio())]
  const upcoming = selectUpcoming(events, new Date().toISOString().slice(0, 10))

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'unstop+devfolio',
    count: upcoming.length,
    events: upcoming,
  }
  await writeFile(OUT, JSON.stringify(payload, null, 2))
  const bySource = events.reduce((acc, e) => ({ ...acc, [e.source]: (acc[e.source] ?? 0) + 1 }), {})
  console.log(`wrote ${upcoming.length} upcoming hackathons (${JSON.stringify(bySource)})`)
}

main().catch(async (error) => {
  console.warn('fetch failed:', error.message)
  try {
    const previous = JSON.parse(await readFile(OUT, 'utf8'))
    console.warn(`kept previous file from ${previous.generatedAt} (${previous.count} events)`)
  } catch {
    console.warn('no previous file to keep')
  }
  process.exitCode = 1
})
