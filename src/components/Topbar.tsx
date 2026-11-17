import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bell, CalendarDays, Moon, Search, Sparkles, Sun, UserRound } from 'lucide-react'
import type { Hackathon } from '../types'
import { daysUntil, formatDate } from '../lib/date'
import { initials } from '../lib/profile'

type Props = {
  dateLabel: string
  eventCount: number
  search: string
  deadlines: Hackathon[]
  onSearch: (value: string) => void
  onMenuOpen: () => void
  onOpenEvent: (event: Hackathon) => void
  onOpenCalendar: () => void
  theme: 'light' | 'dark'
  userName: string
  onOpenProfile: () => void
  onToggleTheme: () => void
}

export function Topbar({
  dateLabel,
  eventCount,
  search,
  deadlines,
  onSearch,
  onMenuOpen,
  onOpenEvent,
  onOpenCalendar,
  theme,
  userName,
  onOpenProfile,
  onToggleTheme,
}: Props) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false)
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="icon-button topbar__menu" onClick={onMenuOpen} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
        <div className="topbar__context">
          <span className="topbar__date">
            <CalendarDays size={15} />
            {dateLabel}
          </span>
          <span className="topbar__divider" />
          <span className="topbar__count">{eventCount} events in your orbit</span>
        </div>
      </div>

      <div className="topbar__actions">
        <label className="global-search">
          <Search size={16} />
          <input
            id="global-search"
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search hackathons"
            aria-label="Search hackathons"
          />
          <kbd>/</kbd>
        </label>

        <div className="notifications" ref={notificationsRef}>
          <button
            type="button"
            className={`icon-button notification-button ${notificationsOpen ? 'is-active' : ''}`}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={18} />
            {deadlines.length > 0 && <span className="notification-dot" />}
          </button>

          {notificationsOpen && (
            <div className="notifications-popover">
              <div className="notifications-popover__head">
                <div>
                  <span className="eyebrow eyebrow--small">
                    <Sparkles size={12} /> On the horizon
                  </span>
                  <h3>Upcoming deadlines</h3>
                </div>
                <span className="count-chip">{deadlines.length}</span>
              </div>

              {deadlines.length > 0 ? (
                <div className="notifications-list">
                  {deadlines.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      className="notification-item"
                      onClick={() => {
                        onOpenEvent(event)
                        setNotificationsOpen(false)
                      }}
                    >
                      <span className="date-tile">
                        <strong>{formatDate(event.deadline, { day: 'numeric' })}</strong>
                        <small>{formatDate(event.deadline, { month: 'short' })}</small>
                      </span>
                      <span className="notification-item__copy">
                        <strong>{event.name}</strong>
                        <small>
                          {daysUntil(event.deadline) <= 0
                            ? 'Deadline today'
                            : daysUntil(event.deadline) === 1
                              ? 'Deadline tomorrow'
                              : `Deadline in ${daysUntil(event.deadline)} days`}
                        </small>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="notifications-empty">
                  <span>🌿</span>
                  <p>No deadlines ahead. Breathe easy.</p>
                </div>
              )}

              <button
                className="notifications-popover__footer"
                onClick={() => {
                  onOpenCalendar()
                  setNotificationsOpen(false)
                }}
              >
                Open calendar <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-button theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={17} />}
        </button>

        <button
          type="button"
          className="topbar__avatar"
          onClick={onOpenProfile}
          aria-label={userName ? `${userName} — profile and data` : 'Add your name'}
          title={userName ? `${userName} — profile and data` : 'Add your name'}
        >
          {userName ? <span>{initials(userName)}</span> : <UserRound size={17} />}
          <i />
        </button>
      </div>
    </header>
  )
}
