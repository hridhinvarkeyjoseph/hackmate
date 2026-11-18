import { notifyTimerDone } from '../lib/reminders'
import { useEffect, useRef, useState } from 'react'
import { AlarmClock, Pause, Play, RotateCcw, X } from 'lucide-react'

const KEY = 'hackmate.timer.v1'
const PRESETS = [15, 25, 45, 60]

type Saved = { endAt: number; total: number }

const load = (): Saved | null => {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Saved
    return typeof parsed?.endAt === 'number' ? parsed : null
  } catch {
    return null
  }
}

const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerWidget() {
  const saved = load()
  const [open, setOpen] = useState(false)
  const [total, setTotal] = useState(saved?.total ?? 25 * 60_000)
  const [endAt, setEndAt] = useState<number | null>(saved?.endAt ?? null)
  const [remaining, setRemaining] = useState(() =>
    saved?.endAt ? Math.max(0, saved.endAt - Date.now()) : (saved?.total ?? 25 * 60_000),
  )
  const [ringing, setRinging] = useState(false)
  const audio = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!endAt) return
    const tick = () => {
      const left = endAt - Date.now()
      setRemaining(Math.max(0, left))
      if (left <= 0) {
        setEndAt(null)
        setRinging(true)
        try {
          window.localStorage.removeItem(KEY)
        } catch {
          /* ignore */
        }
        const ctx = audio.current
        if (ctx) {
          for (let i = 0; i < 3; i += 1) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.frequency.value = 880
            gain.gain.value = 0.0001
            osc.connect(gain).connect(ctx.destination)
            const start = ctx.currentTime + i * 0.55
            gain.gain.setValueAtTime(0.0001, start)
            gain.gain.exponentialRampToValueAtTime(0.25, start + 0.03)
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32)
            osc.start(start)
            osc.stop(start + 0.35)
          }
        }
        notifyTimerDone()
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [endAt])

  const start = (minutes = total / 60_000) => {
    const span = minutes * 60_000
    setTotal(span)
    setRinging(false)
    setRemaining(span)
    const target = Date.now() + span
    setEndAt(target)
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ endAt: target, total: span }))
    } catch {
      /* ignore */
    }
    if (!audio.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor) audio.current = new Ctor()
    }
    void audio.current?.resume()
  }

  const pause = () => {
    setEndAt(null)
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  }

  const reset = () => {
    setEndAt(null)
    setRinging(false)
    setRemaining(total)
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`timer ${open ? 'is-open' : ''}`}>
      <button
        className={`timer__fab ${endAt ? 'is-running' : ''} ${ringing ? 'is-ringing' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close timer' : 'Open alarm timer'}
        aria-expanded={open}
      >
        {open ? <X size={18} /> : <AlarmClock size={19} />}
        {!open && (endAt || ringing) && <span className="timer__badge">{ringing ? '00:00' : clock(remaining)}</span>}
      </button>

      {open && (
        <div className="timer__panel">
          <span className="timer__eyebrow">Alarm clock</span>
          <div className={`timer__display ${ringing ? 'is-ringing' : ''}`}>{ringing ? 'Time’s up' : clock(remaining)}</div>

          <div className="timer__presets">
            {PRESETS.map((minutes) => (
              <button
                key={minutes}
                className={`timer__preset ${total === minutes * 60_000 ? 'is-active' : ''}`}
                onClick={() => {
                  pause()
                  setRinging(false)
                  setTotal(minutes * 60_000)
                  setRemaining(minutes * 60_000)
                }}
              >
                {minutes}m
              </button>
            ))}
          </div>

          <div className="timer__actions">
            {endAt ? (
              <button className="btn btn-secondary btn--compact" onClick={pause}>
                <Pause size={14} /> Pause
              </button>
            ) : (
              <button className="btn btn-primary btn--compact" onClick={() => start()}>
                <Play size={14} /> {ringing ? 'Again' : 'Start'}
              </button>
            )}
            <button className="btn btn-quiet btn--compact" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <p className="timer__note">Runs in this tab. The alarm rings with a tone and a notification.</p>
        </div>
      )}
    </div>
  )
}
