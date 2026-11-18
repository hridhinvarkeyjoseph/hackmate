import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { cityPresets, type Place } from '../lib/finder'
import { Drawer } from './Drawer'
import { InterestPicker } from './InterestPicker'

export type WelcomeChoices = {
  name: string
  place: Place | null
  interests: string[]
}

type Props = {
  initialName: string
  onFinish: (choices: WelcomeChoices) => void
  onSkip: () => void
}

export function WelcomeDrawer({ initialName, onFinish, onSkip }: Props) {
  const [name, setName] = useState(initialName)
  const [place, setPlace] = useState<Place | null>(null)
  const [interests, setInterests] = useState<string[]>([])

  return (
    <Drawer onClose={onSkip} label="Welcome to Hackmate">
      <div className="welcome">
        <span className="drawer-eyebrow">Welcome</span>
        <h2>Find your next hackathon</h2>
        <p>Tell Hackmate a little about you. Everything stays on this device.</p>

        <label className="field welcome__group">
          <span className="field__label">Your name</span>
          <input
            type="text"
            value={name}
            maxLength={40}
            autoComplete="name"
            placeholder="Optional"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="welcome__group">
          <span className="field__label">Where do you build from?</span>
          <div className="interest-picker" role="group" aria-label="City">
            {cityPresets.map((city) => {
              const active = place?.label === city.label
              return (
                <button
                  key={city.label}
                  type="button"
                  className={`city-chip ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setPlace(active ? null : city)}
                >
                  {city.label}
                  {active && <Check size={12} strokeWidth={3} />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="welcome__group">
          <span className="field__label">What do you like building?</span>
          <InterestPicker selected={interests} onChange={setInterests} />
        </div>

        <div className="welcome__actions">
          <button
            className="btn btn-primary"
            onClick={() => onFinish({ name: name.trim(), place, interests })}
          >
            Show my hackathons <ArrowRight size={16} />
          </button>
          <button className="btn btn-quiet" onClick={onSkip}>
            Explore with sample data
          </button>
        </div>
      </div>
    </Drawer>
  )
}
