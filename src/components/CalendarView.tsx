import { useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Sparkles,
} from 'lucide-react'
import type { Hackathon } from '../types'
import {
  dateInRange,
  daysUntil,
  formatDate,
  formatRange,
  getMonthGrid,
  isSameDay,
  parseDate,
  startOfDay,
  statusSlug,
} from '../lib/date'
import { StatusBadge } from './StatusBadge'

type Props = {
  events: Hackathon[]
  onOpen: (event: Hackathon) => void
  onAdd: () => void
}

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarView({ events, onOpen, onAdd }: Props) {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1, 12)
  })

  const today = startOfDay(new Date())
  const days = getMonthGrid(month.getFullYear(), month.getMonth())
  const monthName = month.toLocaleDateString('en-US', { month: 'long' })
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const monthIndex = month.getMonth()
  const year = month.getFullYear()

  const monthEvents = events.filter((event) => {
    const start = parseDate(event.startDate)
    const end = parseDate(event.endDate)
    const monthStart = new Date(year, monthIndex, 1)
    const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59)
    return start <= monthEnd && end >= monthStart
  })

  const monthDeadlines = events.filter((event) => {
    const deadline = parseDate(event.deadline)
    return deadline.getMonth() === monthIndex && deadline.getFullYear() === year
  })

  const monthWins = monthEvents.filter((event) => event.status === 'Won').length

  const horizon = [...events]
    .filter(
      (event) =>
        daysUntil(event.endDate) >= 0 &&
        !['Won', 'Completed'].includes(event.status),
    )
    .sort((a, b) => daysUntil(a.startDate) - daysUntil(b.startDate))
    .slice(0, 4)

  const goMonth = (offset: number) => {
    setMonth(new Date(year, monthIndex + offset, 1, 12))
  }

  const goToday = () => {
    const now = new Date()
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12))
  }

  return (
    <div className="view view--calendar">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} /> Season view
          </span>
          <h1>
            Your months, <em>at a glance.</em>
          </h1>
          <p>A softer way to see the weekends you&apos;re giving to good ideas.</p>
        </div>
        <div className="page-heading__actions">
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={17} strokeWidth={2.4} /> Add hackathon
          </button>
        </div>
      </section>

      <div className="calendar-layout">
        <section className="calendar-card">
          <header className="calendar-card__head">
            <div>
              <h2>
                {monthName} <span>{year}</span>
              </h2>
              <p>
                {monthEvents.length} {monthEvents.length === 1 ? 'hackathon' : 'hackathons'} ·{' '}
                {monthDeadlines.length}{' '}
                {monthDeadlines.length === 1 ? 'deadline' : 'deadlines'}
                {monthWins > 0 ? ` · ${monthWins} win${monthWins > 1 ? 's' : ''}` : ''}
              </p>
            </div>
            <div className="calendar-controls">
              <button
                className="icon-button"
                onClick={() => goMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <button className="btn btn-quiet btn--compact" onClick={goToday}>
                Today
              </button>
              <button
                className="icon-button"
                onClick={() => goMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </header>

          <div className="calendar-weekdays">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((day) => {
              const dayEvents = events.filter((event) =>
                dateInRange(day, event.startDate, event.endDate),
              )
              const inMonth = day.getMonth() === monthIndex
              const weekend = day.getDay() === 0 || day.getDay() === 6
              const isToday = isSameDay(day, today)

              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-cell ${inMonth ? '' : 'is-outside'} ${
                    weekend ? 'is-weekend' : ''
                  } ${isToday ? 'is-today' : ''}`}
                >
                  <div className="calendar-cell__date">
                    <span>{day.getDate()}</span>
                    {isToday && <small>today</small>}
                  </div>
                  <div className="calendar-cell__events">
                    {dayEvents.slice(0, 2).map((event) => (
                      <button
                        key={`${event.id}-${day.toISOString()}`}
                        className={`calendar-event calendar-event--${statusSlug(event.status)}`}
                        onClick={() => onOpen(event)}
                        title={`${event.name} · ${formatRange(event.startDate, event.endDate)}`}
                      >
                        <span className="calendar-event__dot" />
                        <span className="calendar-event__name">{event.name}</span>
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="calendar-more">+{dayEvents.length - 2} more</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <footer className="calendar-card__footer">
            <span className="calendar-legend">
              <span className="legend-dot legend-dot--idea" /> Idea
              <span className="legend-dot legend-dot--registered" /> Registered
              <span className="legend-dot legend-dot--in-progress" /> In progress
              <span className="legend-dot legend-dot--submitted" /> Submitted
              <span className="legend-dot legend-dot--won" /> Won
              <span className="legend-dot legend-dot--completed" /> Completed
            </span>
            <span className="calendar-footer-note">
              <Clock3 size={13} /> Click any event to open it
            </span>
          </footer>
        </section>

        <aside className="calendar-side">
          <div className="month-snapshot">
            <div className="month-snapshot__rings" aria-hidden="true" />
            <span className="eyebrow eyebrow--light">
              <CalendarDays size={13} /> {monthLabel}
            </span>
            <h3>
              {monthEvents.length > 0
                ? `${monthEvents.length} moments, ${monthDeadlines.length} dates to keep.`
                : 'A clear month. A fresh page.'}
            </h3>
            <p>
              {monthEvents.length > 0
                ? 'The best seasons are built one weekend at a time.'
                : 'Nothing on the calendar yet — maybe the perfect time to start something.'}
            </p>
            <div className="month-snapshot__stats">
              <span>
                <strong>{monthEvents.length}</strong>
                events
              </span>
              <span>
                <strong>{monthDeadlines.length}</strong>
                deadlines
              </span>
              <span>
                <strong>{monthWins}</strong>
                wins
              </span>
            </div>
          </div>

          <div className="horizon-card">
            <div className="horizon-card__head">
              <div>
                <span className="eyebrow eyebrow--small">
                  <Sparkles size={12} /> What&apos;s next
                </span>
                <h3>On the horizon</h3>
              </div>
              <span className="count-chip">{horizon.length}</span>
            </div>

            <div className="horizon-list">
              {horizon.length > 0 ? (
                horizon.map((event) => (
                  <button key={event.id} className="horizon-item" onClick={() => onOpen(event)}>
                    <span className="date-tile date-tile--small">
                      <strong>{formatDate(event.startDate, { day: 'numeric' })}</strong>
                      <small>{formatDate(event.startDate, { month: 'short' })}</small>
                    </span>
                    <span className="horizon-item__copy">
                      <strong>{event.name}</strong>
                      <small>{formatRange(event.startDate, event.endDate)}</small>
                    </span>
                    <ArrowRight size={14} />
                  </button>
                ))
              ) : (
                <p className="calendar-side-empty">Nothing ahead. Enjoy the breathing room.</p>
              )}
            </div>

            <div className="horizon-card__statuses">
              {(['Registered', 'In progress', 'Won'] as const).map((status) => (
                <span key={status}>
                  <StatusBadge status={status} />
                </span>
              ))}
            </div>
          </div>

          <button className="btn btn-secondary btn--block" onClick={onAdd}>
            <Plus size={16} /> Put something on the calendar
          </button>
        </aside>
      </div>
    </div>
  )
}
