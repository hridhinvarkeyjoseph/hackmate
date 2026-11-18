import { ArrowRight, ArrowUpRight, Compass, ExternalLink, Plus, Sparkles, Wand2 } from 'lucide-react'
import type { Hackathon } from '../types'
import { formatRange } from '../lib/date'
import { nextSteps, suggestListings } from '../lib/catalog'
import type { LiveEvent } from '../lib/live'

type Props = {
  events: Hackathon[]
  listings: LiveEvent[]
  onTrack: (listing: LiveEvent) => void
  onOpen: (event: Hackathon) => void
  onAdd: () => void
}

export function SuggestView({ events, listings, onTrack, onOpen, onAdd }: Props) {
  const suggestions = suggestListings(listings, events)
  const steps = nextSteps(events)
  const themes = [...new Set(events.flatMap((event) => event.themes))].slice(0, 6)

  return (
    <div className="view view--suggest">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Compass size={14} /> A little curation
          </span>
          <h1>
            What could be <em>next.</em>
          </h1>
          <p>
            Recommendations shaped by the themes you keep choosing, plus the small
            things worth doing on what you already have.
          </p>
        </div>
        <div className="page-heading__actions">
          <button className="btn btn-secondary" onClick={onAdd}>
            <Plus size={16} /> Add one yourself
          </button>
        </div>
      </section>

      {themes.length > 0 && (
        <div className="suggest-traits">
          <span>Your taste so far</span>
          {themes.map((theme) => (
            <span className="tag" key={theme}>
              {theme}
            </span>
          ))}
        </div>
      )}

      <div className="suggest-layout">
        <section className="suggest-main">
          <div className="section-heading section-heading--tight">
            <div>
              <div className="section-heading__row">
                <h2>Worth a look</h2>
                <span className="count-chip count-chip--soft">{suggestions.length}</span>
              </div>
              <p>Open right now and chosen from what you already enter.</p>
            </div>
          </div>

          {suggestions.length === 0 ? (
            <div className="empty-panel">
              <span className="empty-panel__icon">
                <Compass size={24} />
              </span>
              <h3>No open listings to suggest</h3>
              <p>You are tracking everything on the list, or the listings could not load.</p>
            </div>
          ) : (
          <div className="suggest-grid">
            {suggestions.map(({ listing: entry, reason }) => (
              <article className="suggest-card" key={entry.id}>
                <div className="suggest-card__top">
                  <span className={`mode-pill mode-pill--${entry.mode.toLowerCase().replace(' ', '-')}`}>
                    {entry.mode}
                  </span>
                  <span className="suggest-card__prize">{entry.prize}</span>
                </div>
                <h3>{entry.name}</h3>
                <p className="suggest-card__organizer">{entry.organizer}</p>
                <p className="suggest-card__blurb">{entry.location}</p>
                <div className="tag-row">
                  {entry.themes.slice(0, 3).map((theme) => (
                    <span className="tag" key={theme}>
                      {theme}
                    </span>
                  ))}
                </div>
                <p className="suggest-card__dates">
                  {formatRange(entry.startDate, entry.endDate)}
                </p>
                <p className="suggest-card__reason">
                  <Sparkles size={13} /> {reason}
                </p>
                <div className="suggest-card__actions">
                  <button className="btn btn-secondary" onClick={() => onTrack(entry)}>
                    <Plus size={15} /> Add to my board
                  </button>
                  <a
                    className="btn btn-quiet"
                    href={entry.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apply <ExternalLink size={13} />
                  </a>
                </div>
              </article>
            ))}
          </div>
          )}
        </section>

        <aside className="suggest-side">
          <div className="next-steps-card">
            <div className="next-steps-card__head">
              <span className="eyebrow eyebrow--small">
                <Wand2 size={12} /> Suggestions
              </span>
              <h3>Next steps</h3>
            </div>

            {steps.length > 0 ? (
              <ul className="next-steps">
                {steps.map((step) => {
                  const event = step.eventId ? events.find((item) => item.id === step.eventId) : null
                  return (
                    <li key={step.id} className={`next-step next-step--${step.tone}`}>
                      <span className="next-step__dot" />
                      <div>
                        <strong>{step.title}</strong>
                        <p>{step.body}</p>
                        {event && (
                          <button className="text-link" onClick={() => onOpen(event)}>
                            Open hackathon <ArrowUpRight size={13} />
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="next-steps-empty">
                Nothing needs you right now. Add a hackathon to get suggestions.
              </p>
            )}
          </div>

          <button className="suggest-browse" onClick={() => onAdd()}>
            <span>
              <strong>Something else in mind?</strong>
              <small>Add any hackathon by hand.</small>
            </span>
            <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    </div>
  )
}
