import { useEffect, useMemo, useState } from 'react'
import { openListings, parseFeed, type LiveFeed, type LiveEvent } from './live'

const EMPTY: LiveFeed = { generatedAt: '', events: [] }

/** Loads the bundled listings file. The app works normally if it is missing. */
export function useLiveFeed(): { listings: LiveEvent[]; generatedAt: string } {
  const [feed, setFeed] = useState<LiveFeed>(EMPTY)

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}live-hackathons.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (!cancelled) setFeed(parseFeed(payload))
      })
      .catch(() => {
        // Listings are optional; everything else keeps working offline.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const listings = useMemo(() => openListings(feed.events), [feed.events])
  return { listings, generatedAt: feed.generatedAt }
}
