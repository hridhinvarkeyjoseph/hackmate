import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Clock3,
  ListChecks,
  MapPin,
  Trophy,
} from 'lucide-react'
import type { Hackathon } from '../types'
import { deadlineLabel, daysUntil, formatRange, statusSlug } from '../lib/date'
import { StatusBadge } from './StatusBadge'

type Props = {
  event: Hackathon
  onOpen: (event: Hackathon) => void
  onToggleFavorite: (id: string) => void
}

export function HackathonCard({ event, onOpen, onToggleFavorite }: Props) {
  const remaining = daysUntil(event.deadline)
  const urgency = remaining < 0 ? 'past' : remaining <= 7 ? 'soon' : 'calm'
  const isLive = daysUntil(event.startDate) <= 0 && daysUntil(event.endDate) >= 0
  const endsIn = daysUntil(event.endDate)
  const label =
    remaining < 0 && ['Submitted', 'Won', 'Completed'].includes(event.status)
      ? event.status === 'Submitted'
        ? 'In judging'
        : event.status
      : remaining < 0 && isLive
        ? endsIn === 0
          ? 'Live · ends today'
          : `Live · ends in ${endsIn}d`
        : remaining < 0 && daysUntil(event.endDate) < 0
          ? 'Ended'
          : deadlineLabel(event.deadline)

  return (
    <article
      className={`hack-card status-${statusSlug(event.status)}`}
      // Mouse clicks anywhere on the card open it; keyboard and screen reader
      // users get the real button below, so no interactive element is nested
      // inside another.
      onClick={() => onOpen(event)}
    >
      <button
        type="button"
        className="hack-card__open"
        aria-label={`Open ${event.name}`}
        onClick={(e) => {
          e.stopPropagation()
          onOpen(event)
        }}
      />
      <div className="hack-card__top">
        <StatusBadge status={event.status} />
        <button
          type="button"
          className={`icon-button icon-button--soft favorite-button ${event.favorite ? 'is-favorite' : ''}`}
          aria-label={event.favorite ? 'Remove from saved' : 'Save hackathon'}
          title={event.favorite ? 'Remove from saved' : 'Save hackathon'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(event.id)
          }}
        >
          <Bookmark size={16} strokeWidth={2.1} fill={event.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="hack-card__body">
        <div>
          <h3>{event.name}</h3>
          <p className="hack-card__organizer">{event.organizer || 'Independent event'}</p>
        </div>

        <div className="hack-card__meta">
          <span>
            <CalendarDays size={15} />
            {formatRange(event.startDate, event.endDate)}
          </span>
          <span>
            <MapPin size={15} />
            {event.location || 'Somewhere lovely'} · {event.mode}
          </span>
        </div>

        {event.themes.length > 0 && (
          <div className="tag-row">
            {event.themes.slice(0, 2).map((theme) => (
              <span className="tag" key={theme}>
                {theme}
              </span>
            ))}
            {event.themes.length > 2 && (
              <span className="tag tag--muted">+{event.themes.length - 2}</span>
            )}
          </div>
        )}
      </div>

      <div className="hack-card__footer">
        <span className={`deadline-note deadline-note--${remaining < 0 && isLive ? 'calm' : urgency}`}>
          <Clock3 size={14} />
          {label}
        </span>
        {event.tasks.length > 0 && (
          <span className="hack-card__tasks">
            <ListChecks size={13} />
            {event.tasks.filter((task) => task.done).length}/{event.tasks.length}
          </span>
        )}
        <span className="hack-card__prize">
          <Trophy size={14} />
          {event.prize || 'Glory'}
        </span>
        <span className="hack-card__arrow" aria-hidden="true">
          <ArrowUpRight size={17} />
        </span>
      </div>
    </article>
  )
}
