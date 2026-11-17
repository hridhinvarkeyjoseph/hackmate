import { useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import type { Hackathon, SortOption, ViewName } from '../types'
import { daysUntil, parseDate, startOfDay } from '../lib/date'
import { HackathonCard } from './HackathonCard'

type Filter = 'All' | 'Upcoming' | 'Happening' | 'Completed' | 'Saved'

type Props = {
  events: Hackathon[]
  search: string
  onSearch: (value: string) => void
  onOpen: (event: Hackathon) => void
  onAdd: () => void
  onToggleFavorite: (id: string) => void
  onNavigate: (view: ViewName) => void
}

export function HackathonsView({
  events,
  search,
  onSearch,
  onOpen,
  onAdd,
  onToggleFavorite,
  onNavigate,
}: Props) {
  const [filter, setFilter] = useState<Filter>('All')
  const [sort, setSort] = useState<SortOption>('soonest')

  const today = startOfDay(new Date())
  const categoryOf = (event: Hackathon): Exclude<Filter, 'All' | 'Saved'> => {
    if (['Won', 'Completed', 'Submitted'].includes(event.status)) return 'Completed'
    if (
      event.status === 'In progress' ||
      (startOfDay(parseDate(event.startDate)) <= today &&
        startOfDay(parseDate(event.endDate)) >= today)
    ) {
      return 'Happening'
    }
    return 'Upcoming'
  }

  const counts: Record<Filter, number> = {
    All: events.length,
    Upcoming: events.filter((event) => categoryOf(event) === 'Upcoming').length,
    Happening: events.filter((event) => categoryOf(event) === 'Happening').length,
    Completed: events.filter((event) => categoryOf(event) === 'Completed').length,
    Saved: events.filter((event) => event.favorite).length,
  }

  const query = search.trim().toLowerCase()
  const visible = events
    .filter((event) => {
      if (filter === 'Saved') return event.favorite
      if (filter !== 'All') return categoryOf(event) === filter
      return true
    })
    .filter((event) => {
      if (!query) return true
      return [
        event.name,
        event.organizer,
        event.location,
        event.mode,
        event.notes,
        ...event.themes,
        ...event.team.map((member) => `${member.name} ${member.role}`),
        event.submission.repo,
        event.submission.demo,
        event.submission.video,
      ].join(' ')
        .toLowerCase()
        .includes(query)
    })
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'deadline') {
        const aDays = daysUntil(a.deadline)
        const bDays = daysUntil(b.deadline)
        if (aDays < 0 && bDays >= 0) return 1
        if (bDays < 0 && aDays >= 0) return -1
        return aDays - bDays
      }
      if (sort === 'recent') return b.startDate.localeCompare(a.startDate)
      const aFuture = daysUntil(a.startDate) >= 0
      const bFuture = daysUntil(b.startDate) >= 0
      if (aFuture !== bFuture) return aFuture ? -1 : 1
      return aFuture
        ? daysUntil(a.startDate) - daysUntil(b.startDate)
        : daysUntil(b.startDate) - daysUntil(a.startDate)
    })

  const tabs: Filter[] = ['All', 'Upcoming', 'Happening', 'Completed', 'Saved']

  return (
    <div className="view view--hackathons">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} /> Your collection
          </span>
          <h1>
            Every hackathon, <em>one home.</em>
          </h1>
          <p>From the first spark of an idea to the final demo — it all lives here.</p>
        </div>
        <div className="page-heading__actions">
          <button className="btn btn-secondary" onClick={() => onNavigate('calendar')}>
            <CalendarDays size={17} /> Calendar
          </button>
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={17} strokeWidth={2.4} /> Add hackathon
          </button>
        </div>
      </section>

      <section className="collection-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter hackathons">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={filter === tab}
              className={`filter-tab ${filter === tab ? 'is-active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
              <span>{counts[tab]}</span>
            </button>
          ))}
        </div>

        <div className="collection-tools">
          <label className="inline-search">
            <Search size={15} />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Find a hackathon"
              aria-label="Find a hackathon"
            />
            {search && (
              <button type="button" onClick={() => onSearch('')} aria-label="Clear search">
                ×
              </button>
            )}
          </label>
          <label className="select-wrap">
            <SlidersHorizontal size={15} />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              aria-label="Sort hackathons"
            >
              <option value="soonest">Soonest first</option>
              <option value="deadline">Deadline first</option>
              <option value="name">Name A–Z</option>
              <option value="recent">Most recent</option>
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </label>
        </div>
      </section>

      <div className="result-count">
        <span>
          Showing <strong>{visible.length}</strong> of {events.length} hackathons
        </span>
        {filter === 'Saved' && <span className="saved-note">Your little shortlist</span>}
      </div>

      {visible.length > 0 ? (
        <div className="hack-grid">
          {visible.map((event) => (
            <HackathonCard
              key={event.id}
              event={event}
              onOpen={onOpen}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
          <button className="new-hack-tile" onClick={onAdd}>
            <span className="new-hack-tile__icon">
              <Plus size={22} />
            </span>
            <strong>Start something new</strong>
            <small>There&apos;s always room for one more good idea.</small>
            <span className="new-hack-tile__arrow">
              <ArrowRight size={16} />
            </span>
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-panel empty-panel--large">
          <span className="empty-panel__icon">
            <Sparkles size={26} />
          </span>
          <h3>Your first hackathon is waiting</h3>
          <p>
            Add an event you&apos;re excited about. We&apos;ll keep the dates, the details, and
            the momentum in one place.
          </p>
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={16} /> Add a hackathon
          </button>
        </div>
      ) : (
        <div className="empty-panel">
          <span className="empty-panel__icon">
            <Search size={24} />
          </span>
          <h3>No hackathons found</h3>
          <p>Try another search, or loosen up those filters a little.</p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              onSearch('')
              setFilter('All')
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
