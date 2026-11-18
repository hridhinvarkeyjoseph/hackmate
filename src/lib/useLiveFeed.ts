import { useEffect, useMemo, useState } from 'react'
import { openListings, parseFeed, type LiveFeed, type LiveEvent } from './live'
import { isNativeApp, PUBLIC_APP_URL } from './platform'

const EMPTY: LiveFeed = { generatedAt: '', events: [] }
const FEED_FILE = 'live-hackathons.json'

async function loadFeed(url: string): Promise<LiveFeed> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Feed request failed: ${response.status}`)
  const feed = parseFeed(await response.json())
  if (feed.events.length === 0) throw new Error('Feed was empty')
  return feed
}

/**
 * Loads the listings. The Android app ships with a copy that ages, so it tries
 * the live site first and falls back to that copy when offline.
 */
export function useLiveFeed(): { listings: LiveEvent[]; generatedAt: string } {
  const [feed, setFeed] = useState<LiveFeed>(EMPTY)

  useEffect(() => {
    let cancelled = false
    const bundled = `${import.meta.env.BASE_URL}${FEED_FILE}`
    const request = isNativeApp()
      ? loadFeed(`${PUBLIC_APP_URL}${FEED_FILE}`).catch(() => loadFeed(bundled))
      : loadFeed(bundled)

    request
      .then((next) => {
        if (!cancelled) setFeed(next)
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
