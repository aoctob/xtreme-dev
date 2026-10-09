import type { Match } from '@/payload-types'
import { CLUB_NAME } from './constants'
import { formatLongDate } from './format'
import { asMedia } from './media'

export type Outcome = 'win' | 'draw' | 'loss'

export const hasScore = (m: Match) =>
  (m.status === 'fulltime' || m.status === 'live') &&
  typeof m.scoreFor === 'number' &&
  typeof m.scoreAgainst === 'number'

export function outcome(m: Match): Outcome | null {
  if (m.status !== 'fulltime' || !hasScore(m)) return null
  const f = m.scoreFor as number
  const a = m.scoreAgainst as number
  return f > a ? 'win' : f < a ? 'loss' : 'draw'
}

export type Side = {
  name: string
  isUs: boolean
  crestUrl: string | null
  score: number | null
}

/** Home team first, as on any fixture list. */
export function sides(m: Match): [Side, Side] {
  const us: Side = { name: CLUB_NAME, isUs: true, crestUrl: '/brand/badge-240.webp', score: hasScore(m) ? (m.scoreFor ?? null) : null }
  const them: Side = {
    name: m.opponentName,
    isUs: false,
    crestUrl: asMedia(m.opponentCrest)?.url ?? null,
    score: hasScore(m) ? (m.scoreAgainst ?? null) : null,
  }
  return m.homeOrAway === 'away' ? [them, us] : [us, them]
}

/** Text equivalent of the scoreboard for screen readers (PRD §G.2). */
export function matchSummary(m: Match): string {
  const [home, away] = sides(m)
  const date = formatLongDate(m.kickoffUtc)
  if (hasScore(m)) {
    const state = m.status === 'live' ? 'live' : 'full time'
    return `${home.name} ${home.score}, ${away.name} ${away.score}, ${state}, ${date}`
  }
  const state =
    m.status === 'postponed' ? 'postponed' : m.status === 'cancelled' ? 'cancelled' : 'upcoming'
  return `${home.name} versus ${away.name}, ${state}, ${date}`
}

export const matchTitle = (m: Match) => {
  const [home, away] = sides(m)
  return hasScore(m)
    ? `${home.name} ${home.score}–${away.score} ${away.name}`
    : `${home.name} vs ${away.name}`
}
