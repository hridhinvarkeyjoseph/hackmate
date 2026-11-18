import { useState } from 'react'
import { Check, Copy, Mic } from 'lucide-react'
import type { Hackathon, Pitch } from '../types'
import {
  buildPitchScript,
  emptyPitch,
  MAX_PITCH_FIELD,
  PITCH_FIELDS,
  speakingSeconds,
} from '../lib/pitch'
import { Drawer } from './Drawer'

type Props = {
  event: Hackathon
  onChange: (pitch: Pitch) => void
  onClose: () => void
}

const TARGET_SECONDS = 60
const TOLERANCE_SECONDS = 15

export function PitchDrawer({ event, onChange, onClose }: Props) {
  const pitch = event.pitch ?? emptyPitch()
  const [copied, setCopied] = useState(false)
  const script = buildPitchScript(event, pitch)
  const seconds = speakingSeconds(script)
  const advice =
    seconds > TARGET_SECONDS + TOLERANCE_SECONDS
      ? 'A little long. Try trimming it to about a minute.'
      : seconds >= TARGET_SECONDS - TOLERANCE_SECONDS
        ? 'A good length for a one-minute pitch.'
        : 'You have room to add detail.'

  return (
    <Drawer onClose={onClose} label={`Pitch for ${event.name}`}>
      <div className="welcome pitch">
        <span className="drawer-eyebrow">Pitch builder</span>
        <h2>Say it in a minute</h2>
        <p>Answer simply. Your script updates as you type and saves by itself.</p>

        {PITCH_FIELDS.map(({ key, label, placeholder }) => (
          <label className="field welcome__group" key={key}>
            <span className="field__label">{label}</span>
            <textarea
              rows={key === 'project' || key === 'audience' ? 1 : 2}
              maxLength={MAX_PITCH_FIELD}
              value={pitch[key]}
              placeholder={placeholder}
              onChange={(change) => {
                setCopied(false)
                onChange({ ...pitch, [key]: change.target.value })
              }}
            />
          </label>
        ))}

        <section className="pitch__script" aria-label="Your pitch script">
          <span className="detail-progress__head">
            <span>
              <Mic size={15} /> Your script
            </span>
            {script && <strong>About {seconds} sec</strong>}
          </span>
          <p>{script || 'Your script will appear here.'}</p>
          {script && <small>{advice}</small>}
          <button
            className="btn btn-secondary"
            disabled={!script}
            onClick={() => {
              void navigator.clipboard.writeText(script).then(() => setCopied(true))
            }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy script'}
          </button>
        </section>
      </div>
    </Drawer>
  )
}
