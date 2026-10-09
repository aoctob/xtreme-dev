'use client'

import { useRouter } from 'next/navigation'
import { formatDay } from '@/lib/format'
import type { MatchVM } from '@/lib/view'
import { Reveal } from './motion'
import { ToastLink } from './toast'
import { Button, MatchCard } from './ui'

/** A match card that opens the match page; inner buttons keep their own action (kit-core.jsx MatchItem). */
export function MatchItem({ m, i = 0 }: { m: MatchVM; i?: number }) {
  const router = useRouter()
  const href = `/results/${m.slug}`
  const isResult = m.status === 'fulltime' || m.status === 'cancelled'
  const label = `${m.home.name} v ${m.away.name}, ${formatDay(m.kickoff)}${
    m.hasScore ? `, ${m.home.name} ${m.home.score}, ${m.away.name} ${m.away.score}` : ''
  }. Open match details`
  const actions = isResult ? (
    <Button variant="tertiary" href={href} onClick={(e) => e.stopPropagation()}>
      Match report
    </Button>
  ) : (
    <>
      {m.status === 'scheduled' && (
        <ToastLink href={`${href}/calendar.ics`} download event="fixture_calendar_add" toastText="Calendar file (.ics) downloaded" toastIcon="calendar">
          Add to calendar
        </ToastLink>
      )}
      {m.mapUrl && (
        <Button variant="tertiary" href={m.mapUrl} external onClick={(e) => e.stopPropagation()}>
          Directions
        </Button>
      )}
    </>
  )
  return (
    <Reveal
      i={i}
      className="mc"
      role="link"
      tabIndex={0}
      aria-label={label}
      onClick={() => router.push(href)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.target === e.currentTarget) router.push(href)
      }}
    >
      <MatchCard m={m} actions={actions} />
    </Reveal>
  )
}
