import { useState, type FormEvent } from 'react'
import {
  CalendarDays,
  Check,
  Globe,
  Link2,
  MapPin,
  Plus,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react'
import type { Hackathon, Mode, Status, Task, TeamMember } from '../types'
import { MODES, STATUSES } from '../types'
import { addDays, toISODate } from '../lib/date'
import { makeId } from '../lib/storage'
import { Drawer } from './Drawer'

type Props = {
  initial: Hackathon | null
  onClose: () => void
  onSave: (event: Hackathon) => void
}

type FormState = {
  name: string
  organizer: string
  website: string
  location: string
  mode: Mode
  startDate: string
  endDate: string
  deadline: string
  status: Status
  prize: string
  teamSize: number
  themesText: string
  notes: string
  team: TeamMember[]
  tasks: Task[]
  repo: string
  demo: string
  video: string
}

const modeIcons = {
  Online: Globe,
  'In person': MapPin,
  Hybrid: Shuffle,
}

function buildInitial(initial: Hackathon | null): FormState {
  if (initial) {
    return {
      name: initial.name,
      organizer: initial.organizer,
      website: initial.website,
      location: initial.location,
      mode: initial.mode,
      startDate: initial.startDate,
      endDate: initial.endDate,
      deadline: initial.deadline,
      status: initial.status,
      prize: initial.prize,
      teamSize: initial.teamSize,
      themesText: initial.themes.join(', '),
      notes: initial.notes,
      team: initial.team,
      tasks: initial.tasks,
      repo: initial.submission.repo,
      demo: initial.submission.demo,
      video: initial.submission.video,
    }
  }

  return {
    name: '',
    organizer: '',
    website: '',
    location: '',
    mode: 'Online',
    startDate: toISODate(addDays(new Date(), 14)),
    endDate: toISODate(addDays(new Date(), 16)),
    deadline: toISODate(addDays(new Date(), 7)),
    status: 'Registered',
    prize: '',
    teamSize: 4,
    themesText: '',
    notes: '',
    team: [],
    tasks: [],
    repo: '',
    demo: '',
    video: '',
  }
}

export function EditorDrawer({ initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(() => buildInitial(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isEditing = Boolean(initial)
  const themes = form.themesText
    .split(',')
    .map((theme) => theme.trim())
    .filter(Boolean)

  const update = <K extends keyof FormState,>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    if (errors[key as string]) {
      setErrors((previous) => {
        const next = { ...previous }
        delete next[key as string]
        return next
      })
    }
  }

  const addMember = () =>
    update('team', [...form.team, { id: makeId('member'), name: '', role: '' }])
  const patchMember = (id: string, patch: Partial<TeamMember>) =>
    update('team', form.team.map((member) => (member.id === id ? { ...member, ...patch } : member)))
  const removeMember = (id: string) =>
    update('team', form.team.filter((member) => member.id !== id))

  const addTask = () =>
    update('tasks', [...form.tasks, { id: makeId('task'), label: '', done: false }])
  const patchTask = (id: string, patch: Partial<Task>) =>
    update('tasks', form.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)))
  const removeTask = (id: string) =>
    update('tasks', form.tasks.filter((task) => task.id !== id))

  const handleSubmit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault()
    const nextErrors: Record<string, string> = {}

    if (!form.name.trim()) nextErrors.name = 'Give your hackathon a name.'
    if (!form.startDate) nextErrors.startDate = 'Pick a start date.'
    if (!form.endDate) nextErrors.endDate = 'Pick an end date.'
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.dates = 'The end date needs to come after the start date.'
    }
    if (form.deadline && form.endDate && form.deadline > form.endDate) {
      nextErrors.deadline = 'The deadline can not fall after the event ends.'
    }
    const size = Number(form.teamSize)
    if (!Number.isFinite(size) || size < 1) nextErrors.teamSize = 'A team needs at least one person.'
    else if (size > 20) nextErrors.teamSize = 'Keep the team at 20 people or fewer.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      // Take the person to the first problem instead of leaving focus on Save.
      const order = ['name', 'startDate', 'endDate', 'dates', 'deadline', 'teamSize']
      const first = order.find((key) => nextErrors[key])
      const fieldName = first === 'dates' ? 'endDate' : first
      const formEl = submitEvent.currentTarget as HTMLFormElement | null
      // After React renders the error messages.
      window.setTimeout(() => {
        const target = formEl?.querySelector<HTMLElement>(`[name="${fieldName}"]`)
        target?.focus({ preventScroll: true })
        target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 0)
      return
    }

    const website = form.website.trim()
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      favorite: initial?.favorite ?? false,
      name: form.name.trim(),
      organizer: form.organizer.trim() || 'Independent event',
      website:
        website && !/^https?:\/\//i.test(website) ? `https://${website}` : website,
      location: form.location.trim(),
      mode: form.mode,
      startDate: form.startDate,
      endDate: form.endDate,
      deadline: form.deadline || form.startDate,
      status: form.status,
      prize: form.prize.trim(),
      teamSize: Number(form.teamSize),
      themes: Array.from(new Set(themes)),
      notes: form.notes.trim(),
      team: form.team.filter((member) => member.name.trim() !== ''),
      tasks: form.tasks.filter((task) => task.label.trim() !== ''),
      submission: {
        repo: form.repo.trim(),
        demo: form.demo.trim(),
        video: form.video.trim(),
      },
    })
  }

  return (
    <Drawer
      onClose={onClose}
      label={isEditing ? 'Edit hackathon' : 'Add a hackathon'}
    >
      <form className="editor-form" onSubmit={handleSubmit} noValidate>
        <header className="editor-header">
          <span className="eyebrow">
            <Sparkles size={13} /> {isEditing ? 'A little refresh' : 'A new adventure'}
          </span>
          <h2>{isEditing ? 'Edit your hackathon' : 'Add a hackathon'}</h2>
          <p>
            {isEditing
              ? 'Keep the details honest and the excitement high.'
              : 'Just the essentials for now — you can always add the rest later.'}
          </p>
        </header>

        {Object.keys(errors).length > 0 && (
          <div className="form-alert" role="alert">
            A couple of details need a second look before we save this.
          </div>
        )}

        <section className="form-section">
          <div className="form-section__head">
            <span className="form-step">01</span>
            <div>
              <h3>The basics</h3>
              <p>What are you making time for?</p>
            </div>
          </div>

          <label className="field">
            <span className="field__label">
              Hackathon name <em>*</em>
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="e.g. Minty Build Weekend"
              className={errors.name ? 'has-error' : ''}
              name="name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? 'err-name' : undefined}
              autoFocus
            />
            {errors.name && <small className="field__error" id="err-name">{errors.name}</small>}
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Organizer</span>
              <input
                type="text"
                value={form.organizer}
                onChange={(event) => update('organizer', event.target.value)}
                placeholder="Who's hosting?"
              />
            </label>
            <label className="field">
              <span className="field__label">Website</span>
              <input
                type="text"
                value={form.website}
                onChange={(event) => update('website', event.target.value)}
                placeholder="hackathon.com"
              />
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section__head">
            <span className="form-step">02</span>
            <div>
              <h3>When &amp; where</h3>
              <p>Block out the good kind of busy.</p>
            </div>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field__label">
                Start date <em>*</em>
              </span>
              <div className="date-input">
                <CalendarDays size={15} />
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => update('startDate', event.target.value)}
                  className={errors.startDate ? 'has-error' : ''}
                  name="startDate"
                  aria-invalid={errors.startDate ? true : undefined}
                  aria-describedby={errors.startDate ? 'err-startDate' : undefined}
                />
              </div>
              {errors.startDate && <small className="field__error" id="err-startDate">{errors.startDate}</small>}
            </label>
            <label className="field">
              <span className="field__label">
                End date <em>*</em>
              </span>
              <div className="date-input">
                <CalendarDays size={15} />
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(event) => update('endDate', event.target.value)}
                  className={errors.endDate || errors.dates ? 'has-error' : ''}
                  name="endDate"
                  aria-invalid={errors.endDate || errors.dates ? true : undefined}
                  aria-describedby={errors.endDate ? 'err-endDate' : errors.dates ? 'err-dates' : undefined}
                />
              </div>
              {errors.endDate && <small className="field__error" id="err-endDate">{errors.endDate}</small>}
            </label>
          </div>
          {errors.dates && <small className="field__error field__error--block" id="err-dates">{errors.dates}</small>}

          <label className="field">
            <span className="field__label">Registration deadline</span>
            <div className="date-input">
              <CalendarDays size={15} />
              <input
                type="date"
                value={form.deadline}
                max={form.endDate || undefined}
                onChange={(event) => update('deadline', event.target.value)}
                className={errors.deadline ? 'has-error' : ''}
                name="deadline"
                aria-invalid={errors.deadline ? true : undefined}
                aria-describedby={errors.deadline ? 'err-deadline' : undefined}
              />
            </div>
            {errors.deadline && <small className="field__error" id="err-deadline">{errors.deadline}</small>}
          </label>

          <div className="field">
            <span className="field__label">Format</span>
            <div className="segmented" role="group" aria-label="Event format">
              {MODES.map((mode) => {
                const Icon = modeIcons[mode]
                return (
                  <button
                    key={mode}
                    type="button"
                    className={`segment ${form.mode === mode ? 'is-active' : ''}`}
                    onClick={() => update('mode', mode)}
                  >
                    <Icon size={15} />
                    {mode}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="field">
            <span className="field__label">Location</span>
            <input
              type="text"
              value={form.location}
              onChange={(event) => update('location', event.target.value)}
              placeholder={form.mode === 'Online' ? 'e.g. Everywhere' : 'e.g. Berlin, DE'}
            />
          </label>
        </section>

        <section className="form-section">
          <div className="form-section__head">
            <span className="form-step">03</span>
            <div>
              <h3>The details</h3>
              <p>The bits that make it yours.</p>
            </div>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Status</span>
              <select
                value={form.status}
                onChange={(event) => update('status', event.target.value as Status)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Prize pool</span>
              <input
                type="text"
                value={form.prize}
                onChange={(event) => update('prize', event.target.value)}
                placeholder="e.g. $5,000"
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Team size</span>
            <input
              type="number"
              min={1}
              max={20}
              value={form.teamSize}
              onChange={(event) => update('teamSize', Number(event.target.value))}
              className={errors.teamSize ? 'has-error' : ''}
              name="teamSize"
              aria-invalid={errors.teamSize ? true : undefined}
              aria-describedby={errors.teamSize ? 'err-teamSize' : undefined}
            />
            {errors.teamSize && <small className="field__error" id="err-teamSize">{errors.teamSize}</small>}
          </label>

          <label className="field">
            <span className="field__label">Themes</span>
            <input
              type="text"
              value={form.themesText}
              onChange={(event) => update('themesText', event.target.value)}
              placeholder="AI, climate, design…"
            />
            <small className="field__hint">Separate themes with a comma.</small>
            {themes.length > 0 && (
              <div className="tag-row field__tags">
                {themes.map((theme) => (
                  <span className="tag" key={theme}>
                    {theme}
                  </span>
                ))}
              </div>
            )}
          </label>

          <label className="field">
            <span className="field__label">Field notes</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="Team plans, wild ideas, things not to forget…"
            />
          </label>
        </section>

        <section className="form-section">
          <div className="form-section__head">
            <span className="form-step">04</span>
            <div>
              <h3>Your crew</h3>
              <p>Who is building this with you?</p>
            </div>
          </div>

          <div className="repeater">
            {form.team.map((member) => (
              <div className="repeater__row" key={member.id}>
                <input
                  type="text"
                  value={member.name}
                  placeholder="Name"
                  aria-label="Team member name"
                  onChange={(event) => patchMember(member.id, { name: event.target.value })}
                />
                <input
                  type="text"
                  value={member.role}
                  placeholder="Role"
                  aria-label="Team member role"
                  onChange={(event) => patchMember(member.id, { role: event.target.value })}
                />
                <button
                  type="button"
                  className="icon-button icon-button--danger repeater__remove"
                  onClick={() => removeMember(member.id)}
                  aria-label="Remove team member"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button type="button" className="repeater__add" onClick={addMember}>
              <Plus size={14} /> Add a person
            </button>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section__head">
            <span className="form-step">05</span>
            <div>
              <h3>Plan of attack</h3>
              <p>The handful of things between here and demo day.</p>
            </div>
          </div>

          <div className="repeater">
            {form.tasks.map((task) => (
              <div className="repeater__row repeater__row--task" key={task.id}>
                <button
                  type="button"
                  className={`task-check ${task.done ? 'is-done' : ''}`}
                  onClick={() => patchTask(task.id, { done: !task.done })}
                  aria-label={task.done ? 'Mark task open' : 'Mark task done'}
                >
                  {task.done && <Check size={13} strokeWidth={3} />}
                </button>
                <input
                  type="text"
                  value={task.label}
                  placeholder="e.g. Submit the registration form"
                  aria-label="Task"
                  onChange={(event) => patchTask(task.id, { label: event.target.value })}
                />
                <button
                  type="button"
                  className="icon-button icon-button--danger repeater__remove"
                  onClick={() => removeTask(task.id)}
                  aria-label="Remove task"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button type="button" className="repeater__add" onClick={addTask}>
              <Plus size={14} /> Add a task
            </button>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section__head">
            <span className="form-step">06</span>
            <div>
              <h3>Submission links</h3>
              <p>Where the judges will find your work.</p>
            </div>
          </div>

          <label className="field">
            <span className="field__label">
              <Link2 size={13} /> Repository
            </span>
            <input
              type="text"
              value={form.repo}
              placeholder="github.com/you/project"
              onChange={(event) => update('repo', event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">
              <Link2 size={13} /> Live demo
            </span>
            <input
              type="text"
              value={form.demo}
              placeholder="project.vercel.app"
              onChange={(event) => update('demo', event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">
              <Link2 size={13} /> Demo video
            </span>
            <input
              type="text"
              value={form.video}
              placeholder="youtu.be/…"
              onChange={(event) => update('video', event.target.value)}
            />
          </label>
        </section>

        <footer className="editor-footer">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Check size={16} strokeWidth={2.5} />
            {isEditing ? 'Save changes' : 'Create hackathon'}
          </button>
        </footer>
      </form>
    </Drawer>
  )
}
