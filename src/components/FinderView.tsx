import { useMemo, useState } from 'react'
import { ArrowUpRight, Check, Compass, MapPin, Navigation, Plus, Search, X } from 'lucide-react'
import type { Hackathon } from '../types'
import { daysBetween, formatDate, formatRange, toISODate } from '../lib/date'
import {
  cityPresets,
  distanceKm,
  filterRanked,
  rankListings,
  type Place,
  type Verdict,
} from '../lib/finder'
import { sources } from '../lib/catalog'
import { forgetPlace, loadPlace, savePlace } from '../lib/profile'
import { deadlineIsEstimated, type LiveEvent } from '../lib/live'

type Props = {
  events: Hackathon[]
  listings: LiveEvent[]
  listingsAt: string
  interests: string[]
  onTrack: (listing: LiveEvent) => void
}

type Filter = 'all' | Verdict

const PAGE_SIZE = 12
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'go', label: 'Go' },
  { id: 'maybe', label: 'Maybe' },
  { id: 'skip', label: 'Skip' },
]

function freshness(generatedAt: string): string {
  if (!generatedAt) return ''
  const updated = new Date(generatedAt)
  if (Number.isNaN(updated.getTime())) return ''
  const days = daysBetween(updated, new Date())
  if (days <= 0) return 'Listings updated today.'
  return `Listings updated ${days} day${days === 1 ? '' : 's'} ago.`
}

export function FinderView({ events, listings, listingsAt, interests, onTrack }: Props) {
  const [place, setPlace] = useState<Place | null>(loadPlace)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [changingCity, setChangingCity] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [query, setQuery] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [closingSoon, setClosingSoon] = useState(false)

  const save = (next: Place) => {
    setPlace(next)
    setError(null)
    setVisible(PAGE_SIZE)
    setChangingCity(false)
    savePlace(next)
  }

  const detect = () => {
    if (!('geolocation' in navigator)) {
      setError('This device cannot share a location. Pick a city instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        const origin = {
          lat: Number(position.coords.latitude.toFixed(4)),
          lng: Number(position.coords.longitude.toFixed(4)),
        }
        const nearest = [...cityPresets].sort(
          (a, b) => distanceKm(origin, a) - distanceKm(origin, b),
        )[0]
        save({ ...nearest, ...origin, label: `Near ${nearest.label}` })
      },
      () => {
        setLocating(false)
        setError('Location was blocked or unavailable. Pick a city instead.')
      },
      { timeout: 8000, maximumAge: 600000 },
    )
  }

  const ranked = useMemo(
    () => (place ? rankListings(listings, events, place, undefined, interests) : []),
    [listings, events, place, interests],
  )
  const results = useMemo(
    () => filterRanked(ranked, { query, onlineOnly, closingSoon }),
    [ranked, query, onlineOnly, closingSoon],
  )
  const counts = useMemo(() => {
    const totals: Record<Filter, number> = { all: results.length, go: 0, maybe: 0, skip: 0 }
    for (const result of results) totals[result.verdict] += 1
    return totals
  }, [results])
  const filtered = filter === 'all' ? results : results.filter((result) => result.verdict === filter)
  const today = toISODate(new Date())

  return (
    <div className="view view--finder">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <MapPin size={14} /> Near you
          </span>
          <h1>
            Worth the trip, <em>or not?</em>
          </h1>
          <p>
            Real hackathons you can still join, judged by distance, your themes and the
            dates already on your board.
          </p>
        </div>
        <div className="page-heading__actions">
          <button className="btn btn-primary" onClick={detect} disabled={locating}>
            <Navigation size={16} /> {locating ? 'Finding you…' : 'Use my location'}
          </button>
        </div>
      </section>

      <div className="finder-locator">
        <div className="finder-locator__copy">
          <span className="finder-locator__label">Searching from</span>
          <strong>{place ? place.label : 'No location yet'}</strong>
          {place && (
            <small>
              {place.lat.toFixed(2)}, {place.lng.toFixed(2)}
            </small>
          )}
        </div>
        {place && !changingCity ? (
          <button className="btn btn-quiet btn--compact" onClick={() => setChangingCity(true)}>
            Change city
          </button>
        ) : (
          <div className="finder-locator__cities">
            {cityPresets.map((city) => (
              <button
                key={city.label}
                className={`city-chip ${place?.label === city.label ? 'is-active' : ''}`}
                onClick={() => save(city)}
              >
                {city.label}
                {place?.label === city.label && <Check size={12} strokeWidth={3} />}
              </button>
            ))}
          </div>
        )}
        {place && (
          <button
            className="icon-button finder-locator__clear"
            aria-label="Forget location"
            onClick={() => {
              setPlace(null)
              setChangingCity(false)
              forgetPlace()
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {error && (
        <p className="finder-error" role="alert">
          {error}
        </p>
      )}

      {!place ? (
        <div className="empty-panel empty-panel--large">
          <span className="empty-panel__icon">
            <MapPin size={26} />
          </span>
          <h3>Where are you building from?</h3>
          <p>
            Share your location or pick a city, and every open hackathon gets a verdict and
            the reason behind it.
          </p>
          <div className="finder-empty-actions">
            <button className="btn btn-primary" onClick={detect}>
              <Navigation size={16} /> Use my location
            </button>
          </div>
        </div>
      ) : ranked.length === 0 ? (
        <div className="empty-panel">
          <span className="empty-panel__icon">
            <Compass size={24} />
          </span>
          <h3>No open listings here right now</h3>
          <p>Try another city, or browse the boards below.</p>
        </div>
      ) : (
        <>
          <div className="finder-tools">
            <label className="finder-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                value={query}
                placeholder="Search name, city or theme"
                aria-label="Search hackathons"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setVisible(PAGE_SIZE)
                }}
              />
            </label>
            <button
              className={`city-chip ${onlineOnly ? 'is-active' : ''}`}
              aria-pressed={onlineOnly}
              onClick={() => {
                setOnlineOnly((value) => !value)
                setVisible(PAGE_SIZE)
              }}
            >
              Online only
            </button>
            <button
              className={`city-chip ${closingSoon ? 'is-active' : ''}`}
              aria-pressed={closingSoon}
              onClick={() => {
                setClosingSoon((value) => !value)
                setVisible(PAGE_SIZE)
              }}
            >
              This week
            </button>
          </div>

          <div className="finder-filters" role="group" aria-label="Filter by verdict">
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                className={`city-chip ${filter === id ? 'is-active' : ''}`}
                aria-pressed={filter === id}
                onClick={() => {
                  setFilter(id)
                  setVisible(PAGE_SIZE)
                }}
              >
                {label} · {counts[id]}
              </button>
            ))}
          </div>

          <div className="finder-list">
            {filtered.slice(0, visible).map(({ listing, km, verdict, headline, reasons }) => (
              <article className={`finder-row finder-row--${verdict}`} key={listing.id}>
                <span className={`verdict verdict--${verdict}`}>
                  {verdict === 'go' ? 'Go' : verdict === 'maybe' ? 'Maybe' : 'Skip'}
                </span>

                <div className="finder-row__main">
                  <div className="finder-row__title">
                    <h3>{listing.name}</h3>
                    <span className="finder-row__meta">
                      {listing.mode}
                      {listing.startDate && <> · {formatRange(listing.startDate, listing.endDate)}</>}
                      {km !== null && km > 0 && <> · {km} km</>}
                      {' · '}
                      {deadlineIsEstimated(listing) ? 'Starts' : 'Apply by'}{' '}
                      {listing.deadline === today ? 'today' : formatDate(listing.deadline)}
                      {listing.prize && <> · {listing.prize}</>}
                    </span>
                  </div>
                  <p className="finder-row__headline">{headline}</p>
                  <ul className="finder-row__reasons">
                    {reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="finder-row__actions">
                  <a
                    className="btn btn-quiet btn--compact"
                    href={listing.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apply <ArrowUpRight size={13} />
                  </a>
                  <button className="btn btn-secondary btn--compact" onClick={() => onTrack(listing)}>
                    <Plus size={14} /> Track it
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="finder-none" role="status">
              Nothing matches these filters. Try removing one.
            </p>
          )}

          {filtered.length > visible && (
            <button
              className="btn btn-quiet finder-more"
              onClick={() => setVisible((count) => count + PAGE_SIZE)}
            >
              Show more ({filtered.length - visible} left)
            </button>
          )}
        </>
      )}

      <section className="sources-card">
        <div className="sources-card__head">
          <span className="eyebrow eyebrow--small">
            <Compass size={12} /> Keep looking
          </span>
          <h3>Where India actually posts them</h3>
          <p>These boards open in your browser.</p>
        </div>
        <div className="sources-grid">
          {sources.map((source) => (
            <a key={source.name} href={source.url} target="_blank" rel="noreferrer">
              <strong>{source.name}</strong>
              <small>{source.note}</small>
              <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      </section>

      <p className="finder-note">
        {freshness(listingsAt)} Distances are straight-line estimates. Always check the
        organizer&apos;s page before booking travel.
      </p>
    </div>
  )
}
