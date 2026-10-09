'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { track } from '@/lib/analytics'
import { CLUB_NAME } from '@/lib/constants'
import { formatDay, formatTime } from '@/lib/format'
import type { MatchVM, PlayerVM } from '@/lib/view'
import { Icon } from './Icon'
import { onInView, Reveal, Roll, useNow } from './motion'
import { Badge, Button, Crest, PlayerCard, Scoreboard, scoreText } from './ui'

/* -------------------------------- Countdown ------------------------------- */

function Countdown({ to }: { to: string }) {
  const now = useNow(1000)
  let ms = now ? Math.max(0, new Date(to).getTime() - now) : 0
  const d = Math.floor(ms / 864e5)
  ms -= d * 864e5
  const h = Math.floor(ms / 36e5)
  ms -= h * 36e5
  const m = Math.floor(ms / 6e4)
  ms -= m * 6e4
  const s = Math.floor(ms / 1e3)
  const p = (n: number) => String(n).padStart(2, '0')
  const units: [string, string][] = now
    ? [[String(d), 'days'], [p(h), 'hrs'], [p(m), 'min'], [p(s), 'sec']]
    : [['–', 'days'], ['––', 'hrs'], ['––', 'min'], ['––', 'sec']]
  return (
    <div className="cd">
      <span className="sr">
        Kickoff in {d} days, {h} hours, {m} minutes
      </span>
      {units.map(([v, l], i) => (
        <div key={l} className={'cd-u' + (i === 3 ? ' cd-sec' : '')} aria-hidden="true">
          <div className="cd-v tnum">
            {v.split('').map((c, j) => (
              <Roll key={j} v={c} />
            ))}
          </div>
          <div className="cd-l">{l}</div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------- Live score ------------------------------- */

/** Live score from the CMS. Refreshes the page data every minute and flashes "Goal" when the club scores. */
function LiveScore({ m }: { m: MatchVM }) {
  const router = useRouter()
  const now = useNow(15000)
  const us = m.home.isUs ? m.home : m.away
  const prev = useRef(us.score)
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 60000)
    return () => clearInterval(t)
  }, [router])
  useEffect(() => {
    if (us.score !== null && prev.current !== null && us.score > prev.current) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 2200)
      prev.current = us.score
      return () => clearTimeout(t)
    }
    prev.current = us.score
  }, [us.score])
  const minute = now ? Math.min(90, Math.max(1, Math.floor((now - new Date(m.kickoff).getTime()) / 60000))) : null
  return (
    <div className="live">
      <div className="live-score tnum" aria-label={`${m.home.name} ${m.home.score ?? 0}, ${m.away.name} ${m.away.score ?? 0}`}>
        <Roll v={m.home.score ?? 0} />
        <span className="dash">–</span>
        <Roll v={m.away.score ?? 0} />
      </div>
      {minute !== null && <div className="live-min tnum">{minute}′</div>}
      {flash && (
        <div className="goal" aria-live="assertive">
          <span>Goal · {CLUB_NAME}</span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------- Match strip ------------------------------ */

/** The home hero's match strip: live → countdown to the next match → latest result → nothing scheduled. */
export function MatchStrip({
  live,
  next,
  last,
  failed,
  instagram,
}: {
  live: MatchVM | null
  next: MatchVM | null
  last: MatchVM | null
  failed: boolean
  instagram: string | null
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => (ref.current ? onInView(ref.current, () => track('match_strip_view')) : undefined), [])
  const mode = live ? 'live' : next ? 'upcoming' : last ? 'result' : 'none'
  const mm = live || next || last
  let body
  if (failed)
    body = (
      <div className="strip-msg">
        <Icon name="alert-circle" color="var(--color-error)" />
        <span>Match data could not be loaded.</span>
        <Button variant="tertiary" icon="arrow-right" href="/results">
          View results
        </Button>
      </div>
    )
  else if (!mm)
    body = (
      <div className="strip-msg">
        <Icon name="calendar" color="var(--color-text-secondary)" />
        <span>No match scheduled. Follow us for updates.</span>
        {instagram && (
          <Button variant="tertiary" icon="arrow-up-right" href={instagram} external data-social="instagram">
            Instagram
          </Button>
        )}
      </div>
    )
  else
    body = (
      <>
        <div className="strip-meta">
          <Badge status={mode === 'live' ? 'live' : mode === 'result' ? 'fulltime' : mm.status} />
          {mm.competition && (
            <>
              <span>{mm.competition}</span>
              <span className="dot" />
            </>
          )}
          <span>
            {formatDay(mm.kickoff)} · {formatTime(mm.kickoff)} IST
          </span>
          <span className="dot hide-sm" />
          <span className="hide-sm">
            <Icon name="map-pin" size={14} /> {mm.venue}
          </span>
        </div>
        <div className="strip-main">
          <div className="strip-team">
            <Crest side={mm.home} />
            <span>{mm.home.name}</span>
          </div>
          <div className="strip-mid">
            {mode === 'upcoming' && <Countdown to={mm.kickoff} />}
            {mode === 'live' && <LiveScore m={mm} />}
            {mode === 'result' && (
              <div className="live-score tnum" aria-label={`${mm.home.name} ${mm.home.score}, ${mm.away.name} ${mm.away.score}`}>
                {scoreText(mm)}
              </div>
            )}
          </div>
          <div className="strip-team r">
            <span>{mm.away.name}</span>
            <Crest side={mm.away} />
          </div>
        </div>
        <div className="strip-actions">
          <Button variant="tertiary" icon="arrow-right" href={`/results/${mm.slug}`}>
            {mode === 'result' ? 'Match report' : 'Match centre'}
          </Button>
          <Button variant="tertiary" icon="arrow-right" href="/results">
            All results
          </Button>
        </div>
      </>
    )
  return (
    <div ref={ref} className={'strip' + (mode === 'live' ? ' is-live' : '')}>
      {body}
    </div>
  )
}

/* ------------------------------ Player rail ------------------------------- */

export function PlayerRow({ players }: { players: PlayerVM[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)
  const onScroll = () => {
    const el = ref.current
    if (el) setP(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth))
  }
  const by = (d: number) => ref.current?.scrollBy({ left: d * 236, behavior: 'smooth' })
  return (
    <div>
      <div ref={ref} className="hrow" onScroll={onScroll}>
        {players.map((pl, i) => (
          <Reveal i={i} key={pl.slug} className="hrow-i">
            <PlayerCard variant="compact" name={pl.name} number={pl.number} position={pl.position} photo={pl.photo} href={`/squad/${pl.slug}`} />
          </Reveal>
        ))}
      </div>
      <div className="hrow-ctl">
        <div className="hrow-track">
          <span style={{ transform: `scaleX(${0.25 + p * 0.75})` }} />
        </div>
        <button type="button" className="sq-btn" aria-label="Scroll players left" onClick={() => by(-1)}>
          <Icon name="chevron-left" />
        </button>
        <button type="button" className="sq-btn" aria-label="Scroll players right" onClick={() => by(1)}>
          <Icon name="chevron-right" />
        </button>
      </div>
    </div>
  )
}

/* ---------------------------- Match page header --------------------------- */

/** Scoreboard with the kit's score count-up for results and a countdown for fixtures. */
export function MatchScoreboard({ m }: { m: MatchVM }) {
  const now = useNow(1000)
  const isRes = m.status === 'fulltime' && m.hasScore
  const gf = m.home.score ?? 0
  const ga = m.away.score ?? 0
  const [s, setS] = useState<[number, number]>([gf, ga])
  useEffect(() => {
    if (!isRes || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setS([0, 0])
    const steps = Math.max(gf, ga)
    if (!steps) return
    let k = 0
    const t = setInterval(() => {
      k++
      setS([Math.min(gf, k), Math.min(ga, k)])
      if (k >= steps) clearInterval(t)
    }, 800 / steps)
    return () => clearInterval(t)
  }, [isRes, gf, ga])

  let countdown: [string, string][] | undefined
  if (m.status === 'scheduled') {
    let ms = now ? Math.max(0, new Date(m.kickoff).getTime() - now) : 0
    const d = Math.floor(ms / 864e5)
    ms -= d * 864e5
    const hh = Math.floor(ms / 36e5)
    ms -= hh * 36e5
    const mi = Math.floor(ms / 6e4)
    countdown =
      now && d < 7
        ? [[String(d), 'days'], [String(hh).padStart(2, '0'), 'hrs'], [String(mi).padStart(2, '0'), 'min']]
        : [[formatDay(m.kickoff).split(' ').slice(1).join(' '), formatTime(m.kickoff)]]
  }
  const score =
    m.status === 'postponed' ? 'P – P' : m.hasScore ? `${isRes ? s[0] : gf} – ${isRes ? s[1] : ga}` : m.status === 'cancelled' ? '–' : undefined
  return (
    <>
      <Scoreboard m={m} score={score} countdown={countdown} />
      {m.hasScore && (
        <span className="sr">
          {m.home.name} {gf}, {m.away.name} {ga}
        </span>
      )}
    </>
  )
}
