import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, Compass, MapPin, Navigation, Plus, Sparkles, X } from 'lucide-react'
import type { Hackathon } from '../types'
import type { CatalogEntry } from '../lib/catalog'
import { addDays, formatRange, toISODate } from '../lib/date'
import { cityPresets, distanceKm, rankNearby, type Place } from '../lib/finder'
import { sources } from '../lib/catalog'
import type { LiveEvent } from '../lib/live'

type Props = {
  events: Hackathon[]
  onAddSuggestion: (entry: CatalogEntry) => void
  onOpen: (event: Hackathon) => void
}

const LOCATION_KEY = 'hackmate.place.v1'

const readPlace = (): Place | null => {
  try {
    const raw = window.localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Place
    return typeof parsed?.lat === 'number' ? parsed : null
  } catch {
    return null
  }
}

const offset = (days: number) => toISODate(addDays(new Date(), days))

export function FinderView({ events, onAddSuggestion, onOpen }: Props) {
  const [place, setPlace] = useState<Place | null>(readPlace)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [live, setLive] = useState<LiveEvent[]>([])
  const [liveAt, setLiveAt] = useState<string>('')

  const save = (next: Place) => {
    setPlace(next)
    setError(null)
    try {
      window.localStorage.setItem(LOCATION_KEY, JSON.stringify(next))
    } catch {
      // Location is a convenience; failing to persist it is harmless.
    }
  }

  const detect = () => {
    if (!('geolocation' in navigator)) {
      setError('This browser cannot share a location. Pick a city instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        const origin = {
          label: 'Your location',
          country: '',
          lat: Number(position.coords.latitude.toFixed(4)),
          lng: Number(position.coords.longitude.toFixed(4)),
        }
        const nearest = [...cityPresets].sort(
          (a, b) => distanceKm(origin, a) - distanceKm(origin, b),
        )[0]
        save({ ...nearest, label: `Near ${nearest.label}`, lat: origin.lat, lng: origin.lng })
      },
      () => {
        setLocating(false)
        setError('Location was blocked or unavailable. Pick a city instead.')
      },
      { timeout: 8000, maximumAge: 600000 },
    )
  }

  useEffect(() => {
    let cancelled = false
    fetch('/live-hackathons.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { generatedAt?: string; events?: LiveEvent[] } | null) => {
        if (cancelled || !payload?.events) return
        setLive(payload.events)
        setLiveAt(payload.generatedAt ?? '')
      })
      .catch(() => {
        // Live data is optional; the curated shelf still works.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const liveVisible = place
    ? live.filter((entry) => (place.country === 'IN' ? true : entry.mode === 'Online'))
    : []

  const results = place ? rankNearby(events, place) : []

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
            Ranked from where you are, against the calendar you already keep — Indian
            cities show Indian events, and online ones travel anywhere.
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
        {place && (
          <button
            className="icon-button finder-locator__clear"
            aria-label="Forget location"
            onClick={() => {
              setPlace(null)
              window.localStorage.removeItem(LOCATION_KEY)
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
            Share your location or pick a city, and every hackathon gets a distance, a
            verdict, and the reason behind it.
          </p>
          <div className="finder-empty-actions">
            <button className="btn btn-primary" onClick={detect}>
              <Navigation size={16} /> Use my location
            </button>
          </div>
        </div>
      ) : (
        <div className="finder-list">
          {results.map(({ entry, km, verdict, headline, reasons }) => (
            <article className={`finder-row finder-row--${verdict}`} key={entry.id}>
              <span className={`verdict verdict--${verdict}`}>
                {verdict === 'go' ? 'Go' : verdict === 'maybe' ? 'Maybe' : 'Skip'}
              </span>

              <div className="finder-row__main">
                <div className="finder-row__title">
                  <h3>{entry.name}</h3>
                  <span className="finder-row__meta">
                    {entry.mode === 'Online' ? 'Online' : entry.mode} ·{' '}
                    {formatRange(offset(entry.start), offset(entry.end))}
                    {km !== null && <> · {km} km</>}
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
                  href={entry.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apply
                </a>
                <button className="btn btn-secondary btn--compact" onClick={() => onAddSuggestion(entry)}>
                  <Plus size={14} /> Track it
                </button>
                <button
                  className="text-link"
                  onClick={() => {
                    const tracked = events.find((event) => event.name === entry.name)
                    if (tracked) onOpen(tracked)
                  }}
                  disabled={!events.some((event) => event.name === entry.name)}
                >
                  Open <ArrowUpRight size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {liveVisible.length > 0 && (
        <section className="live-card">
          <div className="live-card__head">
            <span className="eyebrow eyebrow--small">
              <Sparkles size={12} /> Live right now
            </span>
            <h3>Real listings, pulled from Unstop</h3>
            <p>
              {liveAt
                ? `As of ${new Date(liveAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })} — refresh with npm run fetch:hackathons.`
                : 'Refresh with npm run fetch:hackathons.'}
            </p>
          </div>
          <div className="live-list">
            {liveVisible.slice(0, 12).map((entry) => (
              <article className="live-row" key={entry.id}>
                <div className="live-row__main">
                  <strong>{entry.name}</strong>
                  <small>
                    {entry.organizer} · {entry.mode}
                    {entry.startDate ? ` · ${formatRange(entry.startDate, entry.endDate || entry.startDate)}` : ''}
                  </small>
                </div>
                <a
                  className="btn btn-secondary btn--compact"
                  href={entry.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apply <ArrowUpRight size={13} />
                </a>
              </article>
            ))}
          </div>
          {liveVisible.length > 12 && (
            <p className="live-more">+{liveVisible.length - 12} more in the JSON — increase PAGES to see them.</p>
          )}
        </section>
      )}

      <section className="sources-card">
        <div className="sources-card__head">
          <span className="eyebrow eyebrow--small">
            <Compass size={12} /> Real listings
          </span>
          <h3>Where India actually posts them</h3>
          <p>Live search pages, opened in your browser — the app itself never scrapes them.</p>
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
        Distances are straight-line estimates against a curated set of events, not a live
        directory. Always check the organizer&apos;s own page before booking travel.
      </p>
    </div>
  )
}
