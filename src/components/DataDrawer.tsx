import { useRef, useState } from 'react'
import { Bell, BellOff, CalendarPlus, Database, Download, RotateCcw, ShieldCheck, Upload } from 'lucide-react'
import type { Hackathon } from '../types'
import { downloadEvents, parseImport } from '../lib/storage'
import { downloadICS } from '../lib/ics'
import { disableReminders, enableReminders, getReminderState } from '../lib/reminders'
import { Drawer } from './Drawer'

type Props = {
  events: Hackathon[]
  userName: string
  onNameChange: (name: string) => void
  onClose: () => void
  onImport: (events: Hackathon[]) => void
  onReset: () => void
}

export function DataDrawer({ events, userName, onNameChange, onClose, onImport, onReset }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [remindersOn, setRemindersOn] = useState(() => getReminderState().enabled)

  const handleFile = async (file: File) => {
    try {
      const text = await file.text()
      const imported = parseImport(text)
      if (!imported) {
        setError('That file does not look like a Hackmate backup. Pick a .json export.')
        return
      }
      setError(null)
      setFileName(file.name)
      onImport(imported)
    } catch {
      setError('That file could not be read. Try exporting again and picking the new file.')
    }
  }

  return (
    <Drawer onClose={onClose} label="Your data">
      <div className="drawer-topline">
        <span className="drawer-eyebrow">Your data</span>
      </div>

      <div className="data-hero">
        <span className="data-hero__icon">
          <Database size={20} />
        </span>
        <div>
          <h2>Kept on this device</h2>
          <p>
            {events.length} {events.length === 1 ? 'hackathon' : 'hackathons'} live in this
            browser. Nothing leaves your machine unless you export it.
          </p>
        </div>
      </div>

      <label className="field data-name">
        <span className="field__label">Your name</span>
        <input
          type="text"
          value={userName}
          maxLength={40}
          autoComplete="name"
          placeholder="Shown in the greeting and sidebar"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>

      <div className="data-list">
        <section className="data-row">
          <span className="data-row__icon data-row__icon--mint">
            <Download size={17} />
          </span>
          <div className="data-row__copy">
            <strong>Export a backup</strong>
            <small>Download every hackathon as a JSON file.</small>
          </div>
          <button
            className="btn btn-secondary btn--compact"
            onClick={() => void downloadEvents(events).catch(() => setError('The backup was not saved.'))}
          >
            Export
          </button>
        </section>

        <section className="data-row">
          <span className="data-row__icon data-row__icon--sky">
            <Upload size={17} />
          </span>
          <div className="data-row__copy">
            <strong>Import a backup</strong>
            <small>Replaces what is here with the file you choose.</small>
          </div>
          <button
            className="btn btn-secondary btn--compact"
            onClick={() => fileRef.current?.click()}
          >
            Choose file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
              event.target.value = ''
            }}
          />
        </section>

        <section className="data-row">
          <span className="data-row__icon data-row__icon--mint">
            <CalendarPlus size={17} />
          </span>
          <div className="data-row__copy">
            <strong>Send dates to your calendar</strong>
            <small>Downloads an .ics with every event and deadline.</small>
          </div>
          <button
            className="btn btn-secondary btn--compact"
            onClick={() => void downloadICS(events).catch(() => setError('The calendar file was not saved.'))}
          >
            Export .ics
          </button>
        </section>

        <section className="data-row">
          <span className="data-row__icon data-row__icon--sky">
            {remindersOn ? <Bell size={17} /> : <BellOff size={17} />}
          </span>
          <div className="data-row__copy">
            <strong>Deadline reminders</strong>
            <small>
              {remindersOn
                ? 'On — you will hear about deadlines two days out.'
                : 'Get a nudge before a deadline slips past.'}
            </small>
          </div>
          <button
            className="btn btn-secondary btn--compact"
            onClick={async () => {
              if (remindersOn) {
                disableReminders()
                setRemindersOn(false)
                return
              }
              const granted = await enableReminders()
              setRemindersOn(granted)
              if (!granted) {
                setError('Notifications are blocked. Allow them in your settings to use reminders.')
              }
            }}
          >
            {remindersOn ? 'Turn off' : 'Turn on'}
          </button>
        </section>

        <section className="data-row data-row--danger">
          <span className="data-row__icon data-row__icon--rose">
            <RotateCcw size={17} />
          </span>
          <div className="data-row__copy">
            <strong>Start over</strong>
            <small>Brings back the sample season and clears your changes.</small>
          </div>
          {confirmReset ? (
            <span className="data-confirm">
              <button className="btn btn-danger btn--compact" onClick={onReset}>
                Yes, reset
              </button>
              <button
                className="btn btn-quiet btn--compact"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              className="btn btn-quiet btn--compact"
              onClick={() => setConfirmReset(true)}
            >
              Reset
            </button>
          )}
        </section>
      </div>

      {error && (
        <p className="data-note data-note--error" role="alert">
          {error}
        </p>
      )}
      {fileName && !error && (
        <p className="data-note">Imported from {fileName}.</p>
      )}

      <div className="data-foot">
        <ShieldCheck size={15} />
        <span>
          Hackmate stores everything in <code>localStorage</code> under{' '}
          <code>hackmate.events.v1</code>. Clearing site data removes it too.
        </span>
      </div>
    </Drawer>
  )
}
