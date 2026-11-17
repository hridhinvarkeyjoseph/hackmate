import {
  ArrowUpRight,
  CalendarRange,
  CheckCircle2,
  Globe,
  MapPin,
  Medal,
  Shuffle,
  Sparkles,
  Trophy,
} from 'lucide-react'
import type { Hackathon, Status } from '../types'
import { formatDate, formatRange, parseDate, statusSlug } from '../lib/date'
import { StatusBadge } from './StatusBadge'

type Props = {
  events: Hackathon[]
  onOpen: (event: Hackathon) => void
}

const statusColors: Record<Status, string> = {
  Idea: '#F2D89C',
  Registered: '#8FE5C0',
  'In progress': '#9FD7F0',
  Submitted: '#C7BDF1',
  Won: '#F1C876',
  Completed: '#CFDDD7',
}

const modeMeta = {
  Online: { icon: Globe, className: 'online' },
  'In person': { icon: MapPin, className: 'in-person' },
  Hybrid: { icon: Shuffle, className: 'hybrid' },
} as const

export function InsightsView({ events, onOpen }: Props) {
  const total = events.length
  const wins = events.filter((event) => event.status === 'Won').length
  const submitted = events.filter((event) => event.status === 'Submitted').length
  const completed = events.filter((event) => event.status === 'Completed').length
  const shipped = wins + submitted + completed
  const finals = wins + completed
  const winRate = finals > 0 ? Math.round((wins / finals) * 100) : 0
  const uniqueThemes = Array.from(new Set(events.flatMap((event) => event.themes))).length
  const activeMonths = new Set(
    events.map((event) => {
      const date = parseDate(event.startDate)
      return `${date.getFullYear()}-${date.getMonth()}`
    }),
  ).size

  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const count = events.filter((event) => {
      const eventDate = parseDate(event.startDate)
      return (
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    }).length
    return {
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      longLabel: date.toLocaleDateString('en-US', { month: 'long' }),
      count,
      current: index === 5,
    }
  })
  const maxMonthly = Math.max(1, ...months.map((month) => month.count))
  // On a tie, the most recent month wins.
  const busiest = [...months].reverse().sort((a, b) => b.count - a.count)[0]

  const statusCounts = (Object.keys(statusColors) as Status[])
    .map((status) => ({
      status,
      count: events.filter((event) => event.status === status).length,
    }))
    .filter((entry) => entry.count > 0)

  let donutCursor = 0
  const donutStops = statusCounts.map((entry) => {
    const start = donutCursor
    const slice = (entry.count / Math.max(1, total)) * 100
    donutCursor += slice
    return `${statusColors[entry.status]} ${start}% ${donutCursor}%`
  })

  const modes = (['Online', 'In person', 'Hybrid'] as const).map((mode) => ({
    mode,
    count: events.filter((event) => event.mode === mode).length,
  }))

  const themeCounts = Object.entries(
    events.flatMap((event) => event.themes).reduce<Record<string, number>>((acc, theme) => {
      acc[theme] = (acc[theme] ?? 0) + 1
      return acc
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const highlightEvents = events
    .filter((event) => ['Won', 'Submitted', 'Completed'].includes(event.status))
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
    .slice(0, 4)

  return (
    <div className="view view--insights">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} /> Patterns &amp; progress
          </span>
          <h1>
            Your season, <em>in numbers.</em>
          </h1>
          <p>The quiet proof of all the weekends you turned into something.</p>
        </div>
        <div className="page-heading__actions">
          <span className="insight-season-chip">
            <CalendarRange size={15} /> {activeMonths} months in play
          </span>
        </div>
      </section>

      <section className="insight-stats">
        <div className="insight-stat">
          <span className="insight-stat__icon insight-stat__icon--gold">
            <Trophy size={18} />
          </span>
          <div>
            <span className="insight-stat__label">Win rate</span>
            <strong>{winRate}%</strong>
            <small>{finals > 0
                ? `${wins} of ${finals} finished ${finals === 1 ? 'hackathon' : 'hackathons'} won`
                : 'Nothing finished yet'}</small>
          </div>
        </div>
        <div className="insight-stat">
          <span className="insight-stat__icon insight-stat__icon--mint">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <span className="insight-stat__label">Projects shipped</span>
            <strong>{shipped}</strong>
            <small>{submitted > 0 ? `${submitted} still in judging` : 'Every one a story'}</small>
          </div>
        </div>
        <div className="insight-stat">
          <span className="insight-stat__icon insight-stat__icon--lilac">
            <Sparkles size={18} />
          </span>
          <div>
            <span className="insight-stat__label">Themes explored</span>
            <strong>{uniqueThemes}</strong>
            <small>Curiosity, wide open</small>
          </div>
        </div>
        <div className="insight-stat">
          <span className="insight-stat__icon insight-stat__icon--sky">
            <CalendarRange size={18} />
          </span>
          <div>
            <span className="insight-stat__label">Months in play</span>
            <strong>{activeMonths}</strong>
            <small>Across {total} {total === 1 ? 'hackathon' : 'hackathons'}</small>
          </div>
        </div>
      </section>

      <div className="insights-layout">
        <section className="insight-card flow-card">
          <div className="insight-card__head">
            <div>
              <span className="eyebrow eyebrow--small">
                <CalendarRange size={12} /> The last six months
              </span>
              <h2>Hackathon flow</h2>
            </div>
            <span className="insight-caption">
              {busiest && busiest.count > 0
                ? busiest.current
                  ? `${busiest.longLabel} is your busiest month`
                  : `${busiest.longLabel} was your busiest month`
                : 'A fresh start'}
            </span>
          </div>

          <div className="flow-chart">
            <div className="flow-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="flow-bars">
              {months.map((month) => (
                <div className="flow-bar-group" key={`${month.label}-${month.current}`}>
                  <div className="flow-bar-track">
                    <span
                      className={`flow-bar ${month.current ? 'is-current' : ''} ${
                        month.count === 0 ? 'is-empty' : ''
                      }`}
                      style={{
                        height:
                          month.count > 0
                            ? `${Math.max(16, (month.count / maxMonthly) * 100)}%`
                            : '4px',
                      }}
                      title={`${month.longLabel}: ${month.count} hackathons`}
                    >
                      {month.count > 0 && (
                        <em className="flow-bar-value">{month.count}</em>
                      )}
                    </span>
                  </div>
                  <span className={`flow-label ${month.current ? 'is-current' : ''}`}>
                    {month.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="flow-note">
            A little busy is a good sign. <strong>{total > 0 ? 'Keep the momentum gentle.' : 'Your first bar is waiting to be made.'}</strong>
          </p>
        </section>

        <section className="insight-card donut-card">
          <div className="insight-card__head">
            <div>
              <span className="eyebrow eyebrow--small">Your mix</span>
              <h2>Where things stand</h2>
            </div>
          </div>

          <div className="donut-wrap">
            <div
              className="donut"
              style={{
                background:
                  donutStops.length > 0
                    ? `conic-gradient(${donutStops.join(', ')})`
                    : '#EEF6F1',
              }}
              role="img"
              aria-label="Status breakdown of your hackathons"
            >
              <div className="donut__center">
                <strong>{total}</strong>
                <span>events</span>
              </div>
            </div>

            <div className="donut-legend">
              {statusCounts.length > 0 ? (
                statusCounts.map((entry) => (
                  <div className="donut-legend__row" key={entry.status}>
                    <span
                      className="legend-dot"
                      style={{ background: statusColors[entry.status] }}
                    />
                    <span>{entry.status}</span>
                    <strong>{entry.count}</strong>
                  </div>
                ))
              ) : (
                <p className="insight-empty-copy">Add a hackathon to see your mix.</p>
              )}
            </div>
          </div>
        </section>

        <section className="insight-card modes-card">
          <div className="insight-card__head">
            <div>
              <span className="eyebrow eyebrow--small">Your habitat</span>
              <h2>Where you build</h2>
            </div>
          </div>

          <div className="mode-list">
            {modes.map(({ mode, count }) => {
              const meta = modeMeta[mode]
              const Icon = meta.icon
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div className="mode-row" key={mode}>
                  <span className={`mode-icon mode-icon--${meta.className}`}>
                    <Icon size={16} />
                  </span>
                  <span className="mode-row__name">{mode}</span>
                  <div className="mode-bar">
                    <span
                      className={`mode-bar__fill mode-bar__fill--${meta.className}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              )
            })}
          </div>

          <p className="mode-note">
            {modes[0].count >= modes[1].count && modes[0].count >= modes[2].count
              ? 'The internet is your favourite venue.'
              : 'You do your best work in good company.'}
          </p>
        </section>

        <section className="insight-card themes-card">
          <div className="insight-card__head">
            <div>
              <span className="eyebrow eyebrow--small">The things you return to</span>
              <h2>Theme cloud</h2>
            </div>
            <span className="count-chip">{uniqueThemes}</span>
          </div>

          {themeCounts.length > 0 ? (
            <div className="theme-cloud">
              {themeCounts.map(([theme, count], index) => (
                <span
                  className={`theme-bubble theme-bubble--${(index % 4) + 1}`}
                  key={theme}
                >
                  {theme}
                  {count > 1 && <em>{count}</em>}
                </span>
              ))}
            </div>
          ) : (
            <p className="insight-empty-copy">
              Add a few themes to your hackathons and watch your curiosity take shape.
            </p>
          )}
        </section>
      </div>

      <section className="hall-card">
        <div className="hall-card__head">
          <div>
            <span className="eyebrow eyebrow--small">
              <Trophy size={12} /> The highlight reel
            </span>
            <h2>Little wins, worth keeping</h2>
          </div>
          <span className="insight-caption">{highlightEvents.length} moments</span>
        </div>

        {highlightEvents.length > 0 ? (
          <div className="hall-list">
            {highlightEvents.map((event) => (
              <button key={event.id} className="hall-row" onClick={() => onOpen(event)}>
                <span className={`hall-row__icon hall-row__icon--${statusSlug(event.status)}`}>
                  {event.status === 'Won' ? (
                    <Trophy size={17} />
                  ) : event.status === 'Submitted' ? (
                    <Medal size={17} />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                </span>
                <span className="hall-row__copy">
                  <strong>{event.name}</strong>
                  <small>
                    {event.organizer} · {formatDate(event.startDate, { month: 'short', year: 'numeric' })}
                  </small>
                </span>
                <span className="hall-row__prize">{event.prize || formatRange(event.startDate, event.endDate)}</span>
                <StatusBadge status={event.status} />
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <div className="hall-empty">
            <Sparkles size={20} />
            <p>Your highlight reel is still blank. The next hackathon could be the first frame.</p>
          </div>
        )}
      </section>
    </div>
  )
}
