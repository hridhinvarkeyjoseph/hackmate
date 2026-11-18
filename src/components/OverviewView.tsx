import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  Clock3,
  MapPin,
  Plus,
  Rocket,
  Sparkles,
  Trophy,
} from 'lucide-react'
import type { Hackathon, ViewName } from '../types'
import type { LiveEvent } from '../lib/live'
import {
  countdown,
  daysUntil,
  formatDate,
  formatRange,
  parseDate,
  startOfDay,
  timeGreeting,
} from '../lib/date'
import { HackathonCard } from './HackathonCard'
import { firstName, loadPlace } from '../lib/profile'
import { rankListings } from '../lib/finder'
import { todaysFocus } from '../lib/today'

type Props = {
  events: Hackathon[]
  listings: LiveEvent[]
  interests: string[]
  userName: string
  onOpen: (event: Hackathon) => void
  onAdd: () => void
  onToggleFavorite: (id: string) => void
  onToggleTask: (eventId: string, taskId: string) => void
  onNavigate: (view: ViewName) => void
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  note,
  tone,
}: {
  icon: typeof CalendarRange
  label: string
  value: string | number
  unit?: string
  note: string
  tone: 'mint' | 'cream' | 'lilac' | 'sky'
}) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__head">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__icon">
          <Icon size={18} strokeWidth={1.9} />
        </span>
      </div>
      <div className="stat-card__value">
        {value}
        {unit && <span>{unit}</span>}
      </div>
      <p className="stat-card__note">{note}</p>
    </div>
  )
}

export function OverviewView({ events, listings, interests, userName, onOpen, onAdd, onToggleFavorite, onToggleTask, onNavigate }: Props) {
  const [now, setNow] = useState(() => new Date())

  const focus = todaysFocus(events, now)
  const place = loadPlace()
  const city = place ? place.label.replace(/^Near /, '').split(',')[0].trim() : ''
  const nearbyLive = (
    place
      ? rankListings(listings, events, place, undefined, interests)
          .filter((result) => result.verdict === 'go')
          .map((result) => result.listing)
      : listings.filter((entry) => entry.mode === 'Online')
  ).slice(0, 6)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const today = startOfDay(now)
  const activeEvents = events.filter(
    (event) =>
      startOfDay(parseDate(event.endDate)) >= today &&
      !['Completed', 'Won'].includes(event.status),
  )
  const liveEvents = activeEvents.filter(
    (event) =>
      startOfDay(parseDate(event.startDate)) <= today &&
      startOfDay(parseDate(event.endDate)) >= today,
  )
  const futureDeadlines = events
    .filter(
      (event) =>
        daysUntil(event.deadline) >= 0 && !['Completed', 'Won'].includes(event.status),
    )
    .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
  const nextDeadline = futureDeadlines[0] ?? null

  const nextEvent =
    activeEvents
      .filter((event) => daysUntil(event.startDate) >= 0)
      .sort((a, b) => daysUntil(a.startDate) - daysUntil(b.startDate))[0] ??
    liveEvents[0] ??
    null

  const shipped = events.filter((event) =>
    ['Submitted', 'Won', 'Completed'].includes(event.status),
  ).length
  const submitted = events.filter((event) => event.status === 'Submitted').length
  const wins = events.filter((event) => event.status === 'Won')
  const showcase = [...activeEvents]
    .sort((a, b) => daysUntil(a.startDate) - daysUntil(b.startDate))
    .concat(
      events
        .filter((event) => !activeEvents.includes(event))
        .sort((a, b) => daysUntil(b.endDate) - daysUntil(a.endDate)),
    )
    .slice(0, 4)

  const isLive = nextEvent
    ? daysUntil(nextEvent.startDate) <= 0 && daysUntil(nextEvent.endDate) >= 0
    : false
  const countdownTarget = nextEvent
    ? isLive
      ? nextEvent.endDate
      : nextEvent.startDate
    : ''
  const remaining = countdownTarget ? countdown(countdownTarget, isLive ? 'end' : 'start') : null

  const nextDeadlineDays = nextDeadline ? daysUntil(nextDeadline.deadline) : null

  return (
    <div className="view view--overview">
      <section className="overview-heading">
        <div className="overview-heading__copy">
          <span className="eyebrow">
            <Sparkles size={14} />
            {timeGreeting()}
            {userName ? `, ${firstName(userName)}` : ''}
          </span>
          <h1>
            Big ideas, <em>neatly kept.</em>
          </h1>
          <p>
            Every hackathon, deadline, and small win — gathered in one calm little
            corner.
          </p>
        </div>
        <div className="overview-heading__actions">
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={17} strokeWidth={2.4} />
            Add hackathon
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('calendar')}>
            <CalendarDays size={17} />
            See your season
          </button>
        </div>
      </section>

      <section className="stats-grid" aria-label="Hackathon stats">
        <StatCard
          icon={CalendarRange}
          label="In motion"
          value={activeEvents.length}
          note={
            liveEvents.length > 0
              ? `${liveEvents.length} happening right now`
              : 'Everything steady for now'
          }
          tone="mint"
        />
        <StatCard
          icon={Clock3}
          label="Next deadline"
          value={nextDeadlineDays === null ? '—' : nextDeadlineDays}
          unit={nextDeadlineDays === null ? undefined : 'days'}
          note={
            nextDeadline
              ? `${nextDeadline.name} · ${formatDate(nextDeadline.deadline, {
                  month: 'short',
                  day: 'numeric',
                })}`
              : 'No dates pressing in'
          }
          tone="cream"
        />
        <StatCard
          icon={Rocket}
          label="Projects shipped"
          value={shipped}
          note={submitted > 0 ? `${submitted} still in judging` : 'Ready for the next one'}
          tone="sky"
        />
        <StatCard
          icon={Trophy}
          label="Podium finishes"
          value={wins.length}
          note={wins.length > 0 ? 'A very good reason to celebrate' : 'The next win is out there'}
          tone="lilac"
        />
      </section>

      {focus.length > 0 && (
        <section className="today-focus" aria-label="Today's focus">
          <div className="section-heading section-heading--tight">
            <div>
              <h2>Today&apos;s focus</h2>
              <p>The next steps from your sprint plans.</p>
            </div>
          </div>
          <ul className="today-focus__list">
            {focus.map(({ event, task, title, when, tone }) => (
              <li key={task.id}>
                <button
                  className="task-check"
                  aria-label={`Mark done: ${title}`}
                  onClick={() => onToggleTask(event.id, task.id)}
                />
                <div>
                  <strong>{title}</strong>
                  <button className="today-focus__event" onClick={() => onOpen(event)}>
                    {event.name}
                  </button>
                </div>
                <span className={`today-focus__when today-focus__when--${tone}`}>{when}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {nearbyLive.length > 0 && (
        <section className="nearby-strip">
          <div className="section-heading section-heading--tight">
            <div>
              <div className="section-heading__row">
                <h2>{city ? `Worth it from ${city}` : 'Open right now'}</h2>
                <span className="count-chip count-chip--soft">{nearbyLive.length}</span>
              </div>
              <p>
                {city
                  ? 'Hackathons with a Go verdict for you right now.'
                  : 'Real online listings you can join from anywhere. Set your city in Near me for local ones.'}
              </p>
            </div>
            <button className="text-link" onClick={() => onNavigate('nearby')}>
              See all nearby
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="nearby-list">
            {nearbyLive.map((entry) => (
              <article className="live-row" key={entry.id}>
                <div className="live-row__main">
                  <strong>{entry.name}</strong>
                  <small>
                    {entry.organizer} · {entry.mode}
                    {entry.startDate
                      ? ` · ${formatRange(entry.startDate, entry.endDate || entry.startDate)}`
                      : ''}
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
        </section>
      )}

      <section className="dashboard-feature-grid">
        <article className={`next-up ${nextEvent ? '' : 'next-up--empty'}`}>
          <div className="next-up__glow" aria-hidden="true" />
          <div className="next-up__orbit next-up__orbit--one" aria-hidden="true" />
          <div className="next-up__orbit next-up__orbit--two" aria-hidden="true" />
          <div className="next-up__grid-pattern" aria-hidden="true" />

          {nextEvent ? (
            <>
              <div className="next-up__top">
                <span className="next-up__eyebrow">
                  <span className={isLive ? 'live-dot' : 'soon-dot'} />
                  {isLive ? 'Happening now' : 'Next on your radar'}
                </span>
                <span className="next-up__mode">{nextEvent.mode}</span>
              </div>

              <div className="next-up__body">
                <h2>{nextEvent.name}</h2>
                <div className="next-up__meta">
                  <span>{nextEvent.organizer}</span>
                  <span className="mini-dot" />
                  <span>
                    <MapPin size={14} /> {nextEvent.location}
                  </span>
                  <span className="mini-dot" />
                  <span>{formatRange(nextEvent.startDate, nextEvent.endDate)}</span>
                </div>
                <div className="next-up__tags">
                  {nextEvent.themes.slice(0, 3).map((theme) => (
                    <span key={theme}>{theme}</span>
                  ))}
                </div>
              </div>

              <div className="next-up__bottom">
                <div className="countdown-block" aria-label="Time remaining">
                  <span className="countdown-block__label">
                    {isLive ? 'Wraps up in' : 'Begins in'}
                  </span>
                  <div className="countdown-block__numbers">
                    <div>
                      <strong>{String(remaining?.days ?? 0).padStart(2, '0')}</strong>
                      <small>days</small>
                    </div>
                    <span>:</span>
                    <div>
                      <strong>{String(remaining?.hours ?? 0).padStart(2, '0')}</strong>
                      <small>hrs</small>
                    </div>
                    <span>:</span>
                    <div>
                      <strong>{String(remaining?.minutes ?? 0).padStart(2, '0')}</strong>
                      <small>min</small>
                    </div>
                  </div>
                </div>

                <div className="next-up__actions">
                  <button className="btn btn-cream" onClick={() => onOpen(nextEvent)}>
                    View hackathon
                    <ArrowUpRight size={16} />
                  </button>
                  <span className="next-up__date-note">
                    <CalendarDays size={14} />
                    {formatDate(nextEvent.startDate, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="next-up__empty-state">
              <span className="next-up__eyebrow">
                <Sparkles size={13} /> A little room to dream
              </span>
              <h2>Your next adventure is waiting.</h2>
              <p>Pick one you can still join, and we&apos;ll keep the dates and plan in order.</p>
              <button className="btn btn-cream" onClick={() => onNavigate('nearby')}>
                <MapPin size={16} /> Find hackathons for me
              </button>
            </div>
          )}
        </article>

        <aside className="deadline-card">
          <div className="deadline-card__head">
            <div>
              <span className="eyebrow eyebrow--small">
                <Clock3 size={12} /> Keep an eye on
              </span>
              <h3>Deadline radar</h3>
            </div>
            <span className="count-chip">{futureDeadlines.length}</span>
          </div>

          <div className="deadline-list">
            {futureDeadlines.length > 0 ? (
              futureDeadlines.slice(0, 3).map((event) => {
                const days = daysUntil(event.deadline)
                return (
                  <button
                    key={event.id}
                    className="deadline-row"
                    onClick={() => onOpen(event)}
                  >
                    <span className="date-tile">
                      <strong>{formatDate(event.deadline, { day: 'numeric' })}</strong>
                      <small>{formatDate(event.deadline, { month: 'short' })}</small>
                    </span>
                    <span className="deadline-row__copy">
                      <strong>{event.name}</strong>
                      <small>Deadline</small>
                    </span>
                    <span className={`days-chip ${days <= 7 ? 'days-chip--urgent' : ''}`}>
                      {days === 0 ? 'today' : `${days}d`}
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="deadline-empty">
                <span>🌱</span>
                <p>No deadlines on the horizon. A rare and beautiful thing.</p>
              </div>
            )}
          </div>

          <button className="text-link deadline-card__footer" onClick={() => onNavigate('calendar')}>
            See the full calendar
            <ArrowRight size={15} />
          </button>
        </aside>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <div className="section-heading__row">
              <h2>In your orbit</h2>
              <span className="count-chip count-chip--soft">{events.length}</span>
            </div>
            <p>The hackathons, ideas, and good trouble you&apos;re keeping track of.</p>
          </div>
          <button className="text-link" onClick={() => onNavigate('hackathons')}>
            View all hackathons
            <ArrowRight size={15} />
          </button>
        </div>

        {showcase.length > 0 ? (
          <div className="hack-grid hack-grid--overview">
            {showcase.map((event) => (
              <HackathonCard
                key={event.id}
                event={event}
                onOpen={onOpen}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <span className="empty-panel__icon">
              <Rocket size={24} />
            </span>
            <h3>Your orbit is quiet for now</h3>
            <p>Add a hackathon, a half-formed idea — anything you want to make space for.</p>
            <button className="btn btn-primary" onClick={onAdd}>
              <Plus size={16} /> Add a hackathon
            </button>
          </div>
        )}
      </section>

      {wins.length > 0 && (
        <section className="win-strip">
          <div className="win-strip__confetti" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="win-strip__icon">
            <Trophy size={22} />
          </div>
          <div className="win-strip__copy">
            <span>From the highlight reel</span>
            <h3>
              {wins[0].name}
              <em>{wins[0].prize ? ` · ${wins[0].prize}` : ' · A podium finish'}</em>
            </h3>
            <p>{wins[0].notes || 'A weekend well spent, and a story worth keeping.'}</p>
          </div>
          <button className="btn btn-cream-dark" onClick={() => onOpen(wins[0])}>
            Relive it
            <ArrowUpRight size={16} />
          </button>
        </section>
      )}
    </div>
  )
}
