import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  Compass,
  Database,
  LayoutDashboard,
  MapPin,
  Plus,
  Rocket,
  Sparkles,
  X,
} from 'lucide-react'
import type { Hackathon, ViewName } from '../types'
import { daysUntil, formatDate } from '../lib/date'
import { Logo } from './Logo'
import { initials } from '../lib/profile'

type Props = {
  view: ViewName
  eventCount: number
  nextDeadline: Hackathon | null
  isOpen: boolean
  onNavigate: (view: ViewName) => void
  onAdd: () => void
  onOpenEvent: (event: Hackathon) => void
  onOpenData: () => void
  userName: string
  onClose: () => void
}

const navItems = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
  { id: 'hackathons' as const, label: 'My hackathons', icon: Rocket },
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  { id: 'insights' as const, label: 'Insights', icon: BarChart3 },
  { id: 'suggest' as const, label: 'Ideas', icon: Compass },
  { id: 'nearby' as const, label: 'Near me', icon: MapPin },
]

export function Sidebar({
  view,
  eventCount,
  nextDeadline,
  isOpen,
  onNavigate,
  onAdd,
  onOpenEvent,
  onOpenData,
  userName,
  onClose,
}: Props) {
  const navigate = (nextView: ViewName) => {
    onNavigate(nextView)
    onClose()
  }

  return (
    <>
      <div
        className={`sidebar-scrim ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar__brand-row">
          <button className="brand-button" onClick={() => navigate('overview')} aria-label="Go to overview">
            <Logo />
          </button>
          <button className="icon-button sidebar__close" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <button className="btn btn-primary btn--block sidebar__add" onClick={onAdd}>
          <Plus size={17} strokeWidth={2.4} />
          New hackathon
          <span className="key-hint">N</span>
        </button>

        <nav className="sidebar__nav" aria-label="Main navigation">
          <span className="sidebar__label">Workspace</span>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${view === item.id ? 'is-active' : ''}`}
                onClick={() => navigate(item.id)}
                aria-current={view === item.id ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.label}</span>
                {item.id === 'hackathons' && <span className="nav-count">{eventCount}</span>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar__spacer" />

        <div className="sidebar-deadline">
          <div className="sidebar-deadline__heading">
            <span className="pulse-dot" />
            Next deadline
          </div>
          {nextDeadline ? (
            <>
              <p className="sidebar-deadline__name">{nextDeadline.name}</p>
              <p className="sidebar-deadline__date">
                {formatDate(nextDeadline.deadline, { month: 'short', day: 'numeric' })}
                <span>·</span>
                <strong>
                  {daysUntil(nextDeadline.deadline) === 0
                    ? 'today'
                    : `in ${daysUntil(nextDeadline.deadline)} days`}
                </strong>
              </p>
              <button
                className="sidebar-deadline__link"
                onClick={() => {
                  onOpenEvent(nextDeadline)
                  onClose()
                }}
              >
                Take a look <ArrowUpRight size={14} />
              </button>
            </>
          ) : (
            <p className="sidebar-deadline__name">No deadlines ahead. Enjoy the quiet.</p>
          )}
          <Sparkles className="sidebar-deadline__sparkle" size={42} strokeWidth={1} />
        </div>

        <button className="sidebar__data" onClick={onOpenData}>
          <Database size={15} />
          <span className="sidebar__data-copy">
            <strong>Your data</strong>
            <small>Backup · restore · reset</small>
          </span>
        </button>

        <div className="sidebar__profile">
          <span className="avatar avatar--profile">{userName ? initials(userName) : '·'}</span>
          <span className="sidebar__profile-copy">
            {userName ? (
              <strong>{userName}</strong>
            ) : (
              <button type="button" className="sidebar__name-link" onClick={onOpenData}>
                Add your name
              </button>
            )}
            <small>Personal workspace</small>
          </span>
          <span className="saved-indicator" title="Saved on this device">
            <Check size={12} strokeWidth={3} />
          </span>
        </div>
      </aside>
    </>
  )
}
