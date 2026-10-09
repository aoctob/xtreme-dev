import Image from 'next/image'
import Link from 'next/link'
import { CalendarPlus, Check, Clock, MapPin, XCircle } from 'lucide-react'
import type { Match } from '@/payload-types'
import { formatKickoff, formatTime } from '@/lib/format'
import { outcome, sides, matchSummary, type Side } from '@/lib/match'
import { asMedia } from '@/lib/media'
import { Countdown } from './Countdown'

const statusChip: Record<string, { cls: string; label: string; icon?: React.ReactNode }> = {
  scheduled: { cls: 'chip--scheduled', label: 'Upcoming' },
  live: { cls: 'chip--live', label: 'Live' },
  fulltime: { cls: 'chip--fulltime', label: 'Full time', icon: <Check size={14} aria-hidden="true" /> },
  postponed: { cls: 'chip--postponed', label: 'Postponed', icon: <Clock size={14} aria-hidden="true" /> },
  cancelled: { cls: 'chip--cancelled', label: 'Cancelled', icon: <XCircle size={14} aria-hidden="true" /> },
}

export function StatusChip({ status }: { status: Match['status'] }) {
  const s = statusChip[status] ?? statusChip.scheduled
  return (
    <span className={`chip ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  )
}

export function ResultChip({ match }: { match: Match }) {
  const o = outcome(match)
  if (!o) return null
  const map = { win: ['chip--win', 'W', 'Win'], draw: ['', 'D', 'Draw'], loss: ['chip--loss', 'L', 'Loss'] } as const
  const [cls, letter, label] = map[o]
  return (
    <span className={`chip ${cls}`} title={label}>
      <span aria-hidden="true">{letter}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

function Crest({ side, size }: { side: Side; size: number }) {
  return side.crestUrl ? (
    <span className="crest" style={{ ['--crest' as string]: `${size}px` }}>
      <Image src={side.crestUrl} width={size} height={size} alt="" unoptimized={side.isUs} />
    </span>
  ) : (
    <span className="crest crest--blank" style={{ ['--crest' as string]: `${size}px`, fontSize: size / 2.6 }} aria-hidden="true">
      {side.name.slice(0, 1)}
    </span>
  )
}

/** Colour of the Xtreme FC number in a result (design.md §E.7). */
const scoreClass = (m: Match, side: Side) => {
  if (!side.isUs) return undefined
  const o = outcome(m)
  return o === 'win' ? 'is-win' : o === 'loss' ? 'is-loss' : undefined
}

export function MatchCard({ match, headingLevel = 3 }: { match: Match; headingLevel?: 3 | 4 }) {
  const [home, away] = sides(match)
  const scored = home.score !== null && away.score !== null
  const H = headingLevel === 3 ? 'h3' : 'h4'
  const upcoming = match.status === 'scheduled' || match.status === 'postponed'
  const report = match.report && typeof match.report === 'object' ? match.report : null
  return (
    <article className="match-card card clip">
      <div className="match-card__top">
        <span className="t-caption">{match.competition || 'Match'}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <ResultChip match={match} />
          <StatusChip status={match.status} />
        </span>
      </div>
      <H className="sr-only">
        <Link href={`/fixtures/${match.slug}`} className="stretched">
          {matchSummary(match)}
        </Link>
      </H>
      <div className="match-card__mobile-score" aria-hidden="true">
        <div className="match-card__teams">
          <div className="match-card__team">
            <Crest side={home} size={32} />
            <span>{home.name}</span>
          </div>
          <div className="match-card__team match-card__team--away">
            <Crest side={away} size={32} />
            <span>{away.name}</span>
          </div>
        </div>
        {scored ? (
          <div className="match-card__mid match-card__mid--score">
            <span className={scoreClass(match, home)}>{home.score}</span> – <span className={scoreClass(match, away)}>{away.score}</span>
          </div>
        ) : (
          <div className="match-card__mid match-card__mid--time">{match.status === 'cancelled' ? '—' : formatTime(match.kickoffUtc)}</div>
        )}
      </div>
      <div>
        <div className="match-card__when">{formatKickoff(match.kickoffUtc)}</div>
        {match.venueName && <div className="t-caption">{match.venueName}</div>}
      </div>
      {(upcoming || report) && (
        <div className="match-card__actions">
          {upcoming && match.status === 'scheduled' && (
            <a className="link" href={`/fixtures/${match.slug}/calendar.ics`} download data-track="fixture_calendar_add">
              <CalendarPlus size={16} aria-hidden="true" />
              Add to calendar
            </a>
          )}
          {upcoming && match.venueMapUrl && (
            <a className="link" href={match.venueMapUrl} target="_blank" rel="noopener noreferrer">
              <MapPin size={16} aria-hidden="true" />
              Directions<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          {report?.slug && (
            <Link className="link" href={`/news/${report.slug}`}>
              Match report
            </Link>
          )}
        </div>
      )}
    </article>
  )
}

/** Big three-column scoreboard for the match page and the home match strip (design.md §E.7). */
export function Scoreboard({
  match,
  large,
  headingLevel = 2,
}: {
  match: Match
  large?: boolean
  headingLevel?: 1 | 2
}) {
  const [home, away] = sides(match)
  const scored = home.score !== null && away.score !== null
  const crest = large ? 120 : 72
  const H = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <div className={`scoreboard clip${large ? ' scoreboard--large' : ''}`}>
      <H className="sr-only">{matchSummary(match)}</H>
      <div className="scoreboard__grid" aria-hidden="true">
        <div className="scoreboard__team">
          <Crest side={home} size={crest} />
          <span>{home.name}</span>
        </div>
        <div className="scoreboard__centre">
          <StatusChip status={match.status} />
          {scored ? (
            <div className="score">
              <span className={scoreClass(match, home)}>{home.score}</span>
              <span className="score__dash" />
              <span className={scoreClass(match, away)}>{away.score}</span>
            </div>
          ) : match.status === 'scheduled' ? (
            <Countdown kickoffUtc={match.kickoffUtc} />
          ) : (
            <div className="kickoff-time">{match.status === 'cancelled' ? '—' : 'TBC'}</div>
          )}
        </div>
        <div className="scoreboard__team">
          <Crest side={away} size={crest} />
          <span>{away.name}</span>
        </div>
      </div>
      <div className="scoreboard__meta t-small t-secondary">
        <span className="match-card__when" style={{ color: 'var(--color-text-primary)' }}>
          {formatKickoff(match.kickoffUtc)}
        </span>
        {match.venueName && <span>{match.venueName}</span>}
        {match.competition && <span>{match.competition}</span>}
      </div>
    </div>
  )
}

export const crestOf = (m: Match) => asMedia(m.opponentCrest)
