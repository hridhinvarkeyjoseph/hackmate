import { Check } from 'lucide-react'
import { INTEREST_OPTIONS } from '../lib/profile'

type Props = {
  selected: string[]
  onChange: (interests: string[]) => void
}

export function InterestPicker({ selected, onChange }: Props) {
  return (
    <div className="interest-picker" role="group" aria-label="Interests">
      {INTEREST_OPTIONS.map((interest) => {
        const active = selected.includes(interest)
        return (
          <button
            key={interest}
            type="button"
            className={`city-chip ${active ? 'is-active' : ''}`}
            aria-pressed={active}
            onClick={() =>
              onChange(
                active ? selected.filter((item) => item !== interest) : [...selected, interest],
              )
            }
          >
            {interest}
            {active && <Check size={12} strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}
