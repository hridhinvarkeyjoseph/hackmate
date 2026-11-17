import { useState } from 'react'
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  Globe,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  Github,
  MonitorPlay,
  Video,
  ListChecks,
  UserRound,
} from 'lucide-react'
import type { Hackathon } from '../types'
import { daysUntil, deadlineLabel, formatDate, formatRange, parseDate, startOfDay } from '../lib/date'
import { StatusBadge } from './StatusBadge'
import { Drawer } from './Drawer'

type Props = {
  event: Hackathon
  onClose: () => void
  onEdit: (event: Hackathon) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onToggleTask: (eventId: string, taskId: string) => void
}

export function DetailDrawer({
  event,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleTask,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const today = startOfDay(new Date())
  const starts = startOfDay(parseDate(event.startDate))
  const ends = startOfDay(parseDate(event.endDate))
  const isLive = starts <= today && ends >= today
  const isFuture = starts > today
  const startIn = daysUntil(event.startDate)
  const endIn = daysUntil(event.endDate)

  const highlight = (() => {
    if (event.status === 'Won') {
      return (
        <div className="detail-highlight detail-highlight--win">
          <span className="detail-highlight__eyebrow">
            <Trophy size={14} /> Podium finish
          </span>
          <strong>{event.prize || 'A well-earned win'}</strong>
          <p>{event.notes || 'A weekend to remember.'}</p>
        </div>
      )
    }
    if (event.status === 'Submitted') {
      return (
        <div className="detail-highlight detail-highlight--judging">
          <span className="detail-highlight__eyebrow">
            <Sparkles size={14} /> With the judges
          </span>
          <strong>{endIn < 0 ? `Submitted ${Math.abs(endIn)} days ago` : 'Submitted & waiting'}</strong>
          <p>Deep breaths. The results will find their way to you.</p>
        </div>
      )
    }
    if (isLive) {
      return (
        <div className="detail-highlight detail-highlight--live">
          <span className="detail-highlight__eyebrow">
            <span className="live-dot" /> Happening now
          </span>
          <strong>
            {endIn <= 0 ? 'Final day' : `${endIn} ${endIn === 1 ? 'day' : 'days'} to go`}
          </strong>
          <p>Make the most of it — then get some sleep.</p>
        </div>
      )
    }
    if (isFuture) {
      return (
        <div className="detail-highlight detail-highlight--upcoming">
          <span className="detail-highlight__eyebrow">
            <CalendarDays size={14} /> Kickoff countdown
          </span>
          <strong>
            {startIn} {startIn === 1 ? 'day' : 'days'} to go
          </strong>
          <p>{formatDate(event.startDate, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      )
    }
    return (
      <div className="detail-highlight detail-highlight--past">
        <span className="detail-highlight__eyebrow">
          <Sparkles size={14} /> In the books
        </span>
        <strong>{event.status === 'Completed' ? 'One for the memory file' : 'Wrapped up'}</strong>
        <p>{formatRange(event.startDate, event.endDate)}</p>
      </div>
    )
  })()

  return (
    <Drawer onClose={onClose} label={`${event.name} details`}>
      <div className="drawer-topline">
        <span className="drawer-eyebrow">Hackathon details</span>
        <button
          className={`icon-button icon-button--soft ${event.favorite ? 'is-favorite' : ''}`}
          onClick={() => onToggleFavorite(event.id)}
          aria-label={event.favorite ? 'Remove from saved' : 'Save hackathon'}
        >
          <Bookmark size={17} fill={event.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="detail-hero">
        <StatusBadge status={event.status} />
        <h2>{event.name}</h2>
        <p className="detail-hero__organizer">
          {event.organizer || 'Independent event'}
          <span className="mini-dot" />
          {event.mode}
        </p>
        {event.themes.length > 0 && (
          <div className="tag-row">
            {event.themes.map((theme) => (
              <span className="tag" key={theme}>
                {theme}
              </span>
            ))}
          </div>
        )}
      </div>

      {highlight}

      {event.tasks.length > 0 && (
        <section className="detail-progress">
          <div className="detail-progress__head">
            <span>
              <ListChecks size={15} /> Plan of attack
            </span>
            <strong>
              {event.tasks.filter((task) => task.done).length}/{event.tasks.length}
            </strong>
          </div>
          <ul className="detail-tasks">
            {event.tasks.map((task) => (
              <li key={task.id}>
                <button
                  className={`task-check ${task.done ? 'is-done' : ''}`}
                  onClick={() => onToggleTask(event.id, task.id)}
                  aria-label={task.done ? 'Mark task open' : 'Mark task done'}
                >
                  {task.done && <Check size={13} strokeWidth={3} />}
                </button>
                <span className={task.done ? 'is-done' : ''}>{task.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-item__icon">
            <CalendarDays size={16} />
          </span>
          <span>
            <small>Event dates</small>
            <strong>{formatRange(event.startDate, event.endDate)}</strong>
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-item__icon">
            <Clock3 size={16} />
          </span>
          <span>
            <small>Registration closes</small>
            <strong>{formatDate(event.deadline, { month: 'long', day: 'numeric' })}</strong>
            <em>{deadlineLabel(event.deadline)}</em>
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-item__icon">
            <MapPin size={16} />
          </span>
          <span>
            <small>Location</small>
            <strong>{event.location || 'Somewhere lovely'}</strong>
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-item__icon">
            <Globe size={16} />
          </span>
          <span>
            <small>Format</small>
            <strong>{event.mode}</strong>
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-item__icon">
            <Trophy size={16} />
          </span>
          <span>
            <small>Prize pool</small>
            <strong>{event.prize || 'Glory & good snacks'}</strong>
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-item__icon">
            <Users size={16} />
          </span>
          <span>
            <small>Team size</small>
            <strong>
              {event.teamSize} {event.teamSize === 1 ? 'person' : 'people'}
            </strong>
          </span>
        </div>
      </div>

      {event.team.length > 0 && (
        <section className="detail-team">
          <span className="detail-notes__label">
            <UserRound size={13} /> The crew
          </span>
          <div className="team-list">
            {event.team.map((member) => (
              <span className="team-chip" key={member.id}>
                <strong>{member.name}</strong>
                {member.role && <small>{member.role}</small>}
              </span>
            ))}
          </div>
        </section>
      )}

      {(event.submission.repo || event.submission.demo || event.submission.video) && (
        <section className="detail-links">
          <span className="detail-notes__label">Submission</span>
          <div className="link-row">
            {event.submission.repo && (
              <a href={event.submission.repo} target="_blank" rel="noreferrer">
                <Github size={15} /> Repo
              </a>
            )}
            {event.submission.demo && (
              <a href={event.submission.demo} target="_blank" rel="noreferrer">
                <MonitorPlay size={15} /> Demo
              </a>
            )}
            {event.submission.video && (
              <a href={event.submission.video} target="_blank" rel="noreferrer">
                <Video size={15} /> Video
              </a>
            )}
          </div>
        </section>
      )}

      <div className="detail-notes">
        <span className="detail-notes__label">Field notes</span>
        <p>{event.notes || 'No notes yet. A little context now saves a lot of memory later.'}</p>
      </div>

      {event.website && (
        <a className="detail-website" href={event.website} target="_blank" rel="noreferrer">
          <span className="detail-website__icon">
            <ExternalLink size={16} />
          </span>
          <span>
            <small>Event website</small>
            <strong>{event.website.replace(/^https?:\/\//, '')}</strong>
          </span>
          <ArrowUpRight size={16} />
        </a>
      )}

      <div className="detail-actions">
        {confirmDelete ? (
          <div className="delete-confirm">
            <p>Remove <strong>{event.name}</strong>? This can&apos;t be undone.</p>
            <div>
              <button className="btn btn-danger btn--compact" onClick={() => onDelete(event.id)}>
                Yes, remove it
              </button>
              <button
                className="btn btn-quiet btn--compact"
                onClick={() => setConfirmDelete(false)}
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <>
            <button className="btn btn-primary detail-edit" onClick={() => onEdit(event)}>
              <Pencil size={16} /> Edit hackathon
            </button>
            <button
              className="icon-button icon-button--danger"
              aria-label="Delete hackathon"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={17} />
            </button>
          </>
        )}
      </div>
    </Drawer>
  )
}
