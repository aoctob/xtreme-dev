'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

/**
 * One delegated listener for declarative events: any element with
 * data-track="event" (plus data-track-* properties) and outbound social links.
 */
export function Analytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-track], [data-social]')
      if (!el) return
      if (el.dataset.social) {
        track('social_click', { network: el.dataset.social })
        return
      }
      const { track: event, ...rest } = el.dataset
      if (!event) return
      const props: Record<string, string> = {}
      for (const [k, v] of Object.entries(rest)) {
        if (k.startsWith('track') && v) props[k.slice(5).toLowerCase()] = v
      }
      track(event, props)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}

/** Fires one event when mounted, e.g. player_profile_view. */
export function TrackView({ event, props }: { event: string; props?: Record<string, string> }) {
  useEffect(() => {
    track(event, props)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])
  return null
}
