#!/usr/bin/env node
/**
 * Pulls live hackathons from Unstop's public search endpoint (the same JSON
 * their site uses) and writes public/live-hackathons.json.
 *
 * Runs in Node, so no CORS. Unofficial and best-effort: if the shape changes,
 * the previous file is kept and the app keeps working on stale data.
 */
import { writeFile, readFile } from 'node:fs/promises'

const PAGES = Number(process.env.PAGES || 3)
const OUT = new URL('../public/live-hackathons.json', import.meta.url)
const UNSTOP = 'https://unstop.com/api/public/opportunity/search-new?opportunity=hackathons&page='
const DEVFOLIO = 'https://api.devfolio.co/api/hackathons?page='

const pick = (obj, keys, fallback = '') => {
  for (const key of keys) {
    const value = obj?.[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return fallback
}

const iso = (value) => (typeof value === 'string' && value.slice(0, 10)) || ''
const mode = (region) =>
  region === 'online' ? 'Online' : region === 'hybrid' ? 'Hybrid' : 'In person'

// Unstop mixes audience tags into its filters. They say who can join, not the topic.
const AUDIENCE = new Set([
  'All',
  'Engineering Students',
  'Undergraduate',
  'Postgraduate',
  'Fresher',
  'Management',
  'Experienced Professionals',
  'School Students',
  'Others',
])

// Devfolio sends theme objects, Unstop sends strings. The app only wants names.
const themeNames = (themes) =>
  (Array.isArray(themes) ? themes : [])
    .map((theme) => (typeof theme === 'string' ? theme : theme?.name))
    .filter((name) => typeof name === 'string' && name && name !== 'No Restrictions')
    .slice(0, 3)

function toEvent(row) {
  const org = row.organisation?.name ?? 'Unstop host'
  const location = row.locations?.[0]?.name ?? (row.region === 'online' ? 'Online' : 'India')
  const prize = row.prizes?.[0]?.cash ?? row.prizes?.[0]?.name ?? ''
  const themes = [
    ...(Array.isArray(row.filters) ? row.filters.map((f) => f.name) : []),
    ...(Array.isArray(row.tags) ? row.tags.map((t) => t.name ?? t) : []),
  ]
    .filter((t) => typeof t === 'string' && t && !AUDIENCE.has(t))
    .slice(0, 3)

  return {
    id: `unstop-${row.id}`,
    name: row.title,
    organizer: org,
    mode: mode(row.region),
    location,
    themes,
    prize: prize ? String(prize) : '',
    applyUrl: `https://unstop.com/${row.public_url}`,
    startDate: iso(row.start_date),
    endDate: iso(row.end_date),
    deadline: iso(row.regn_end_date ?? row.start_date),
    region: row.region,
    open: row.regn_open === 1,
    source: 'unstop',
  }
}

async function fetchDevfolio() {
  const out = []
  for (let page = 1; page <= PAGES; page += 1) {
    try {
      const res = await fetch(DEVFOLIO + page, {
        headers: { 'user-agent': 'Mozilla/5.0 (Hackmate local ingest)' },
      })
      if (!res.ok) break
      const json = await res.json()
      const rows = json?.result ?? json?.hackathons ?? []
      if (!Array.isArray(rows) || rows.length === 0) break
      for (const row of rows) {
        // Devfolio exposes no "registration open" flag — only publish state and privacy.
        if (row?.status && row.status !== 'publish') continue
        if (row?.private === true) continue
        const slug = pick(row, ['slug'])
        const online = row?.isOnline === true || row?.is_online === true || row?.online === true
        out.push({
          id: `devfolio-${pick(row, ['uuid', 'id'], String(out.length))}`,
          name: pick(row, ['name', 'title'], 'Devfolio hackathon'),
          organizer: pick(row, ['organizerName', 'organizer'], 'Devfolio host'),
          mode: online ? 'Online' : 'In person',
          location: pick(row, ['city', 'location'], online ? 'Online' : 'India'),
          themes: themeNames(row?.themes),
          prize: pick(row, ['prize', 'prizePool']),
          applyUrl: slug ? `https://devfolio.co/${slug}` : 'https://devfolio.co/hackathons',
          startDate: pick(row, ['startsAt', 'starts_at', 'startDate', 'start_date']).slice(0, 10),
          endDate: pick(row, ['endsAt', 'ends_at', 'endDate', 'end_date']).slice(0, 10),
          deadline: pick(row, ['startsAt', 'starts_at', 'startDate', 'start_date']).slice(0, 10),
          region: online ? 'online' : 'offline',
          open: true,
          source: 'devfolio',
        })
      }
      if (page < PAGES) await new Promise((r) => setTimeout(r, 500))
    } catch (error) {
      console.warn(`devfolio page ${page} failed: ${error.message}`)
      break
    }
  }
  return out
}

async function main() {
  const events = []
  for (let page = 1; page <= PAGES; page += 1) {
    const res = await fetch(UNSTOP + page, {
      headers: { 'user-agent': 'Mozilla/5.0 (Hackmate local ingest)' },
    })
    if (!res.ok) throw new Error(`Unstop page ${page}: HTTP ${res.status}`)
    const json = await res.json()
    const rows = json?.data?.data
    if (!Array.isArray(rows) || rows.length === 0) break
    events.push(...rows.map(toEvent))
    if (page < PAGES) await new Promise((r) => setTimeout(r, 600))
  }

  const devfolio = await fetchDevfolio()
  events.push(...devfolio)

  // Devfolio returns its whole history; keep only what is still running or upcoming.
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = events
    .filter((event) => (event.endDate || event.startDate) >= today)
    .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))

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
