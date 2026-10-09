/**
 * Plain, serialisable shapes for the kit's client components, built from Payload docs
 * on the server. Keeps Payload types (and unpublished fields) out of the browser bundle.
 */
import type { Match, Media, Player, Sponsor, Staff } from '@/payload-types'
import { labelFor, POSITIONS } from './constants'
import { hasScore, outcome, sides, type Outcome } from './match'
import { asMedia, youtubeEmbed, type MaybeMedia } from './media'

export type ImageVM = { src: string; alt: string; width: number; height: number }

export function imageOf(m: MaybeMedia, size: 'thumb' | 'card' | 'large' = 'card'): ImageVM | null {
  const media = asMedia(m)
  if (!media?.url) return null
  const s = media.sizes?.[size]
  return {
    src: s?.url || media.url,
    alt: media.alt || '',
    width: s?.width || media.width || 1200,
    height: s?.height || media.height || 900,
  }
}

/* --------------------------------- Players -------------------------------- */

export type PlayerVM = {
  slug: string
  name: string
  number: number | null
  position: string
  positionKey: string
  photo: ImageVM | null
}

export const positionLabel = (value: string | null | undefined) => labelFor(POSITIONS, value)
export const positionPlural = (value: string | null | undefined) =>
  POSITIONS.find((p) => p.value === value)?.plural ?? ''

export function playerVM(p: Player): PlayerVM {
  return {
    slug: p.slug ?? '',
    name: p.fullName,
    number: p.shirtNumber ?? null,
    position: positionLabel(p.position),
    positionKey: POSITIONS.find((x) => x.value === p.position)?.query ?? '',
    photo: p.consentOnFile ? imageOf(p.photo, 'card') : null,
  }
}

export type GuestVM = { slug: string; name: string; position: string; apps: number | null; event: string }
export const guestVM = (p: Player): GuestVM => ({
  slug: p.slug ?? '',
  name: p.fullName,
  position: positionLabel(p.position),
  apps: p.guestAppearances ?? null,
  event: p.guestEvent ?? '',
})

export type StaffVM = { id: number; name: string; role: string; photo: ImageVM | null }
export const staffVM = (s: Staff): StaffVM => ({ id: s.id, name: s.name, role: s.role, photo: imageOf(s.photo, 'card') })

/* --------------------------------- Matches -------------------------------- */

export type SideVM = { name: string; isUs: boolean; crest: string | null; score: number | null }
export type MatchVM = {
  id: number
  slug: string
  status: Match['status']
  kickoff: string
  competition: string
  venue: string
  mapUrl: string | null
  isHome: boolean
  opponent: string
  home: SideVM
  away: SideVM
  hasScore: boolean
  outcome: Outcome | null
}

export function matchVM(m: Match): MatchVM {
  const [home, away] = sides(m)
  const side = (s: typeof home): SideVM => ({ name: s.name, isUs: s.isUs, crest: s.crestUrl, score: s.score })
  return {
    id: m.id,
    slug: m.slug ?? '',
    status: m.status,
    kickoff: m.kickoffUtc,
    competition: m.competition || '',
    venue: m.venueName || '[CLUB TO SUPPLY: venue]',
    mapUrl: m.venueMapUrl || null,
    isHome: m.homeOrAway !== 'away',
    opponent: m.opponentName,
    home: side(home),
    away: side(away),
    hasScore: hasScore(m),
    outcome: outcome(m),
  }
}

/* ---------------------------------- Media --------------------------------- */

export type MediaVM = {
  id: number
  type: 'image' | 'video'
  thumb: string | null
  src: string | null
  width: number
  height: number
  alt: string
  caption: string
  credit: string
  album: string
  embed: string | null
  videoUrl: string | null
}

/** Demo seed files (src/seed/demo.ts) render as the kit's CSS placeholder, which adapts to light bands. */
const isDemo = (m: Media) => Boolean(m.filename?.startsWith('demo-media-'))

export function mediaVM(m: Media): MediaVM {
  const large = isDemo(m) ? null : imageOf(m, 'large')
  return {
    id: m.id,
    type: m.type === 'video' ? 'video' : 'image',
    thumb: isDemo(m) ? null : (imageOf(m, 'card')?.src ?? null),
    src: large?.src ?? null,
    width: large?.width ?? 1600,
    height: large?.height ?? 1067,
    alt: m.alt || '',
    caption: m.caption || m.alt || '',
    credit: m.credit ? `Photo: ${m.credit}` : '',
    album: m.album || '',
    embed: m.type === 'video' ? youtubeEmbed(m.videoUrl) : null,
    videoUrl: m.type === 'video' ? m.videoUrl || null : null,
  }
}

export const mediaListVM = (items: MaybeMedia[] | null | undefined): MediaVM[] =>
  (items ?? []).map(asMedia).filter((m): m is Media => Boolean(m)).map(mediaVM)

/* --------------------------------- Sponsors ------------------------------- */

export type SponsorVM = { id: number; name: string; logo: string | null; onWhite: boolean; url: string | null }
export const sponsorVM = (s: Sponsor): SponsorVM => ({
  id: s.id,
  name: s.name,
  logo: imageOf(s.logo, 'card')?.src ?? null,
  onWhite: Boolean(s.logoOnWhite),
  url: s.url || null,
})

/** Text shown when the club has not filled a field yet (PRD constraint C2). */
export const supply = (v: string | number | null | undefined, what?: string) =>
  v === null || v === undefined || v === '' ? `[CLUB TO SUPPLY${what ? `: ${what}` : ''}]` : String(v)
