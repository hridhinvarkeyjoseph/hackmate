import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Sparkles } from 'lucide-react'
import type { Hackathon, Theme, ViewName } from './types'
import { sampleHackathons } from './data'
import { daysUntil } from './lib/date'
import { backupDue, isSampleBoard, loadEvents, makeId, saveEvents } from './lib/storage'
import { runReminders } from './lib/reminders'
import { hasOnboarded, loadProfile, markOnboarded, savePlace, saveProfile } from './lib/profile'
import { rememberTrigger } from './lib/focus'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { OverviewView } from './components/OverviewView'
import { HackathonsView } from './components/HackathonsView'
import { CalendarView } from './components/CalendarView'
import { InsightsView } from './components/InsightsView'
import { DetailDrawer } from './components/DetailDrawer'
import { EditorDrawer } from './components/EditorDrawer'
import { DataDrawer } from './components/DataDrawer'
import { SuggestView } from './components/SuggestView'
import { FinderView } from './components/FinderView'
import { TimerWidget } from './components/TimerWidget'
import { JoinPlanDrawer } from './components/JoinPlanDrawer'
import { WelcomeDrawer, type WelcomeChoices } from './components/WelcomeDrawer'
import { useLiveFeed } from './lib/useLiveFeed'
import { planSprint } from './lib/planner'
import { readSharedPlan, sharePlan } from './lib/share'
import { listingKey } from './lib/live'
import { listingToHackathon, type LiveEvent } from './lib/live'

export default function App() {
  const [events, setEvents] = useState<Hackathon[]>(loadEvents)
  const { listings, generatedAt } = useLiveFeed()
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = window.localStorage.getItem('hackmate.theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      // Fall through to the system preference.
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [userName, setUserName] = useState(() => loadProfile().name)
  const [interests, setInterests] = useState(() => loadProfile().interests)
  const [sharedPlan, setSharedPlan] = useState(() => readSharedPlan(window.location.hash))
  const [welcomeOpen, setWelcomeOpen] = useState(
    () => !sharedPlan && !hasOnboarded() && isSampleBoard(events),
  )
  const [view, setView] = useState<ViewName>('overview')
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [dataOpen, setDataOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [toastTone, setToastTone] = useState<'success' | 'warning'>('success')
  const [undo, setUndo] = useState<{ event: Hackathon; index: number } | null>(null)
  const toastTimer = useRef<number | null>(null)
  const saveFailed = useRef(false)

  useEffect(() => {
    if (saveEvents(events)) {
      saveFailed.current = false
      return
    }
    if (!saveFailed.current) {
      saveFailed.current = true
      setToastTone('warning')
      setToast('This browser would not save your changes. Export a backup to be safe.')
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setToast(null), 6000)
    }
  }, [events])

  const notify = useCallback((message: string, tone: 'success' | 'warning' = 'success') => {
    setToastTone(tone)
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => {
      setToast(null)
      setUndo(null)
    }, 5200)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // Native controls (date pickers, scrollbars) follow the app theme.
    document.documentElement.style.colorScheme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0c1815' : '#f4f8f4')
    try {
      window.localStorage.setItem('hackmate.theme', theme)
    } catch {
      // A blocked write just means the choice is not remembered.
    }
  }, [theme])

  useEffect(() => {
    if (backupDue(events)) {
      notify('No backup in the last week — your data lives only on this device.', 'warning')
    }
    // Runs once on open; later edits should not nag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    runReminders(events)
    const timer = window.setInterval(() => runReminders(events), 60_000)
    return () => window.clearInterval(timer)
  }, [events])

  const handleNameChange = useCallback((name: string) => {
    setUserName(name)
    saveProfile({ ...loadProfile(), name: name.trim() })
  }, [])

  const handleInterestsChange = useCallback((next: string[]) => {
    setInterests(next)
    saveProfile({ ...loadProfile(), interests: next })
  }, [])

  const skipWelcome = useCallback(() => {
    markOnboarded()
    setWelcomeOpen(false)
  }, [])

  const finishWelcome = useCallback((choices: WelcomeChoices) => {
    markOnboarded()
    saveProfile({ name: choices.name, interests: choices.interests })
    setUserName(choices.name)
    setInterests(choices.interests)
    if (choices.place) savePlace(choices.place)
    setEvents([])
    setWelcomeOpen(false)
    setView('nearby')
  }, [])

  const navigate = useCallback((nextView: ViewName) => {
    setView(nextView)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const openNew = useCallback(() => {
    rememberTrigger()
    setDetailId(null)
    setDataOpen(false)
    setEditingId(null)
    setEditorOpen(true)
  }, [])

  const openEvent = useCallback((event: Hackathon) => {
    rememberTrigger()
    setEditorOpen(false)
    setDataOpen(false)
    setDetailId(event.id)
  }, [])

  const openData = useCallback(() => {
    rememberTrigger()
    setDetailId(null)
    setEditorOpen(false)
    setEditingId(null)
    setSidebarOpen(false)
    setDataOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDetailId(null)
    setEditorOpen(false)
    setDataOpen(false)
    setEditingId(null)
  }, [])

  const openEdit = useCallback((event: Hackathon) => {
    rememberTrigger()
    setDetailId(null)
    setDataOpen(false)
    setEditingId(event.id)
    setEditorOpen(true)
  }, [])

  const handleSave = useCallback(
    (saved: Hackathon) => {
      const exists = events.some((event) => event.id === saved.id)
      setEvents((previous) =>
        exists
          ? previous.map((event) => (event.id === saved.id ? saved : event))
          : [saved, ...previous],
      )
      setEditorOpen(false)
      setEditingId(null)
      setDetailId(saved.id)
      notify(exists ? 'Hackathon updated. Looking good.' : 'A new adventure is on the board.')
    },
    [events, notify],
  )

  const handleDelete = useCallback(
    (id: string) => {
      const index = events.findIndex((event) => event.id === id)
      if (index >= 0) setUndo({ event: events[index], index })
      setEvents((previous) => previous.filter((event) => event.id !== id))
      setDetailId(null)
      setEditorOpen(false)
      notify('Hackathon removed. Undo is here if that was a slip.')
    },
    [events, notify],
  )

  const restoreDeleted = useCallback(() => {
    if (!undo) return
    setEvents((previous) => {
      const next = [...previous]
      next.splice(Math.min(undo.index, next.length), 0, undo.event)
      return next
    })
    setUndo(null)
    notify('Back on the board.')
  }, [notify, undo])

  const handleImport = useCallback(
    (imported: Hackathon[]) => {
      setEvents(imported)
      setDataOpen(false)
      setView('hackathons')
      notify(
        imported.length === 0
          ? 'Backup was empty. Your board is clear.'
          : `Imported ${imported.length} ${imported.length === 1 ? 'hackathon' : 'hackathons'}.`,
      )
    },
    [notify],
  )

  const handleReset = useCallback(() => {
    setEvents(sampleHackathons)
    setDataOpen(false)
    setView('overview')
    notify('A fresh sample season, ready to explore.')
  }, [notify])

  const closeSharedPlan = useCallback(() => {
    setSharedPlan(null)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

  const joinSharedPlan = useCallback(() => {
    if (!sharedPlan) return
    markOnboarded()
    const existing = events.find((event) => listingKey(event.name) === listingKey(sharedPlan.name))
    if (existing) {
      setDetailId(existing.id)
      notify('This hackathon is already on your board.')
    } else {
      // A teammate's first visit starts with their real board, not the samples.
      setEvents((previous) => [sharedPlan, ...(isSampleBoard(previous) ? [] : previous)])
      setDetailId(sharedPlan.id)
      notify(`${sharedPlan.name} is on your board.`)
    }
    closeSharedPlan()
  }, [closeSharedPlan, events, notify, sharedPlan])

  const handleSharePlan = useCallback(
    (event: Hackathon) => {
      sharePlan(event)
        .then((result) => {
          if (result === 'copied') notify('Link copied. Send it to your team.')
        })
        .catch((error: unknown) => {
          if ((error as Error)?.name !== 'AbortError') {
            notify('That link could not be shared.', 'warning')
          }
        })
    },
    [notify],
  )

  const handleClear = useCallback(() => {
    setEvents([])
    setDataOpen(false)
    notify('Your board is clear.')
  }, [notify])

  const handleTrackListing = useCallback(
    (listing: LiveEvent) => {
      const saved = listingToHackathon(listing, makeId('hm'), new Date().toISOString())
      setEvents((previous) => [saved, ...previous])
      setDetailId(saved.id)
      notify(`${listing.name} is on your board.`)
    },
    [notify],
  )

  const toggleTask = useCallback((eventId: string, taskId: string) => {
    setEvents((previous) =>
      previous.map((event) =>
        event.id === eventId
          ? {
              ...event,
              tasks: event.tasks.map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task,
              ),
            }
          : event,
      ),
    )
  }, [])

  const handlePlanSprint = useCallback(
    (eventId: string) => {
      const event = events.find((item) => item.id === eventId)
      if (!event) return
      const added = planSprint(event, new Date(), () => makeId('task'))
      setEvents((previous) =>
        previous.map((item) =>
          item.id === eventId ? { ...item, tasks: [...item.tasks, ...added] } : item,
        ),
      )
      notify(`${added.length} steps added to your plan.`)
    },
    [events, notify],
  )

  const toggleFavorite = useCallback((id: string) => {
    setEvents((previous) =>
      previous.map((event) =>
        event.id === id ? { ...event, favorite: !event.favorite } : event,
      ),
    )
  }, [])

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value)
      if (value && view !== 'hackathons') navigate('hackathons')
    },
    [navigate, view],
  )

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      if (isTyping || detailId || editorOpen || dataOpen || sidebarOpen) return

      if (event.key === '/') {
        event.preventDefault()
        document.getElementById('global-search')?.focus()
      }

      if (event.key.toLowerCase() === 'n' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        openNew()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [detailId, editorOpen, dataOpen, sidebarOpen, openNew])

  const selectedEvent = detailId
    ? events.find((event) => event.id === detailId) ?? null
    : null
  const editingEvent = editingId
    ? events.find((event) => event.id === editingId) ?? null
    : null

  const upcomingDeadlines = [...events]
    .filter(
      (event) =>
        daysUntil(event.deadline) >= 0 && !['Won', 'Completed'].includes(event.status),
    )
    .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
  const nextDeadline = upcomingDeadlines[0] ?? null
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        eventCount={events.length}
        nextDeadline={nextDeadline}
        isOpen={sidebarOpen}
        onNavigate={navigate}
        onAdd={openNew}
        onOpenEvent={openEvent}
        onOpenData={openData}
        userName={userName}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-shell">
        <Topbar
          dateLabel={dateLabel}
          eventCount={events.length}
          search={search}
          deadlines={upcomingDeadlines}
          onSearch={handleSearch}
          onMenuOpen={() => setSidebarOpen(true)}
          onOpenEvent={openEvent}
          onOpenCalendar={() => navigate('calendar')}
          theme={theme}
          userName={userName}
          onOpenProfile={openData}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        />

        <main className="main-content">
          {view === 'overview' && (
            <OverviewView
              events={events}
              listings={listings}
              userName={userName}
              onOpen={openEvent}
              onAdd={openNew}
              onToggleFavorite={toggleFavorite}
              onNavigate={navigate}
            />
          )}
          {view === 'hackathons' && (
            <HackathonsView
              events={events}
              search={search}
              onSearch={setSearch}
              onOpen={openEvent}
              onAdd={openNew}
              onToggleFavorite={toggleFavorite}
              onNavigate={navigate}
            />
          )}
          {view === 'calendar' && (
            <CalendarView events={events} onOpen={openEvent} onAdd={openNew} />
          )}
          {view === 'insights' && <InsightsView events={events} onOpen={openEvent} />}
          {view === 'nearby' && (
            <FinderView
              events={events}
              listings={listings}
              listingsAt={generatedAt}
              interests={interests}
              onTrack={handleTrackListing}
            />
          )}
          {view === 'suggest' && (
            <SuggestView
              events={events}
              listings={listings}
              interests={interests}
              onTrack={handleTrackListing}
              onOpen={openEvent}
              onAdd={openNew}
            />
          )}
        </main>

        <footer className="app-footer">
          <span>
            <Sparkles size={13} /> Made for good ideas and slightly ambitious weekends.
          </span>
          <span>Saved quietly on this device.</span>
        </footer>
      </div>

      {sharedPlan ? (
        <JoinPlanDrawer plan={sharedPlan} onJoin={joinSharedPlan} onClose={closeSharedPlan} />
      ) : welcomeOpen ? (
        <WelcomeDrawer initialName={userName} onFinish={finishWelcome} onSkip={skipWelcome} />
      ) : editorOpen ? (
        <EditorDrawer
          key={editingId ?? 'new'}
          initial={editingEvent}
          onClose={closeDrawer}
          onSave={handleSave}
        />
      ) : dataOpen ? (
        <DataDrawer
          events={events}
          userName={userName}
          interests={interests}
          onNameChange={handleNameChange}
          onInterestsChange={handleInterestsChange}
          onClear={handleClear}
          onClose={closeDrawer}
          onImport={handleImport}
          onReset={handleReset}
        />
      ) : selectedEvent ? (
        <DetailDrawer
          event={selectedEvent}
          onClose={closeDrawer}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggleFavorite={toggleFavorite}
          onToggleTask={toggleTask}
          onPlanSprint={handlePlanSprint}
          onShare={handleSharePlan}
        />
      ) : null}

      <TimerWidget />

      {toast && (
        <div className={`toast toast--${toastTone}`} role="status" aria-live="polite">
          <span className="toast__icon" aria-hidden="true">
            {toastTone === 'warning' ? (
              <AlertTriangle size={13} strokeWidth={2.6} />
            ) : (
              <Check size={14} strokeWidth={3} />
            )}
          </span>
          {toast}
          {undo && (
            <button className="toast__action" onClick={restoreDeleted}>
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
