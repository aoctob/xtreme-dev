'use client'

import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/format'

const WEEK = 7 * 24 * 3600_000

/**
 * Kickoff countdown, computed in the browser so cached pages stay correct (PRD §J.4).
 * Shown only within 7 days; updates once a minute; the visual numerals are hidden
 * from assistive tech and a plain-text version is provided instead (US-01 #4).
 */
export function Countdown({ kickoffUtc }: { kickoffUtc: string }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => {
      if (!document.hidden) setNow(Date.now())
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  const kickoff = new Date(kickoffUtc).getTime()
  const diff = now === null ? null : kickoff - now

  if (diff === null || diff > WEEK || diff <= 0) {
    return (
      <div className="kickoff-time">
        {diff !== null && diff <= 0 ? 'Kickoff' : `${formatTime(kickoffUtc)}`}
        {diff === null || diff > 0 ? <span className="sr-only"> IST</span> : null}
      </div>
    )
  }

  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const text =
    days > 0 ? `Kickoff in ${days} day${days === 1 ? '' : 's'}, ${hours} hour${hours === 1 ? '' : 's'}` : hours > 0 ? `Kickoff in ${hours} hour${hours === 1 ? '' : 's'}, ${mins} minutes` : `Kickoff in ${mins} minutes`

  return (
    <>
      <div className="countdown" aria-hidden="true">
        <div>
          {pad(days)}
          <span className="t-caption">Days</span>
        </div>
        <div>
          {pad(hours)}
          <span className="t-caption">Hrs</span>
        </div>
        <div>
          {pad(mins)}
          <span className="t-caption">Mins</span>
        </div>
      </div>
      <p className="sr-only" aria-live="off">
        {text}
      </p>
    </>
  )
}
