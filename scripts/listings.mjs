/** Turns raw Unstop and Devfolio rows into the listings the app reads. */

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
  'Arts, Commerce, Sciences & Others',
  'Medical',
  'Law',
])

const CURRENCY = {
  'fa-rupee': '₹',
  'fa-inr': '₹',
  'fa-dollar': '$',
  'fa-usd': '$',
  'fa-eur': '€',
  'fa-gbp': '£',
}

export function prizeLabel(prize) {
  if (!prize) return ''
  if (typeof prize.cash === 'number' && prize.cash > 0) {
    return `${CURRENCY[prize.currency] ?? ''}${prize.cash.toLocaleString('en-IN')}`
  }
  return prize.name ?? ''
}

// Devfolio sends theme objects, Unstop sends strings. The app only wants names.
const themeNames = (themes) =>
  (Array.isArray(themes) ? themes : [])
    .map((theme) => (typeof theme === 'string' ? theme : theme?.name))
    .filter((name) => typeof name === 'string' && name && name !== 'No Restrictions')
    .slice(0, 3)

export function fromUnstop(row) {
  const themes = [
    ...(Array.isArray(row.filters) ? row.filters.map((filter) => filter.name) : []),
    ...(Array.isArray(row.tags) ? row.tags.map((tag) => tag.name ?? tag) : []),
  ]
    .filter((theme) => typeof theme === 'string' && theme && !AUDIENCE.has(theme))
    .slice(0, 3)

  return {
    id: `unstop-${row.id}`,
    name: row.title,
    organizer: row.organisation?.name ?? '',
    mode: mode(row.region),
    location: row.locations?.[0]?.name ?? (row.region === 'online' ? 'Online' : 'India'),
    themes,
    prize: prizeLabel(row.prizes?.[0]),
    applyUrl: `https://unstop.com/${row.public_url}`,
    startDate: iso(row.start_date),
    endDate: iso(row.end_date),
    deadline: iso(row.regn_end_date ?? row.start_date),
    region: row.region,
    open: row.regn_open === 1,
    source: 'unstop',
  }
}

/** Returns null for drafts and private events. */
export function fromDevfolio(row, index = 0) {
  if (row?.status && row.status !== 'publish') return null
  if (row?.private === true) return null

  const slug = pick(row, ['slug'])
  const online = row?.isOnline === true || row?.is_online === true || row?.online === true
  const startDate = pick(row, ['startsAt', 'starts_at', 'startDate', 'start_date']).slice(0, 10)
  return {
    id: `devfolio-${pick(row, ['uuid', 'id'], String(index))}`,
    name: pick(row, ['name', 'title'], 'Devfolio hackathon'),
    organizer: pick(row, ['organizerName', 'organizer']),
    mode: online ? 'Online' : 'In person',
    location: pick(row, ['city', 'location'], online ? 'Online' : 'India'),
    themes: themeNames(row?.themes),
    prize: pick(row, ['prize', 'prizePool']),
    applyUrl: slug ? `https://devfolio.co/${slug}` : 'https://devfolio.co/hackathons',
    startDate,
    endDate: pick(row, ['endsAt', 'ends_at', 'endDate', 'end_date']).slice(0, 10),
    // Devfolio exposes no sign-up cutoff, so the start date stands in for one.
    deadline: startDate,
    region: online ? 'online' : 'offline',
    open: true,
    source: 'devfolio',
  }
}

/** Devfolio returns its whole history, so keep what is running or upcoming. */
export function selectUpcoming(events, today) {
  return events
    .filter((event) => (event.endDate || event.startDate) >= today)
    .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
}
