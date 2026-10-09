import 'server-only'
import { draftMode } from 'next/headers'
import { cache } from 'react'
import type { Payload, Where } from 'payload'
import type {
  JoinPage,
  Match,
  Media,
  Player,
  SiteSetting,
  Sponsor,
  Staff,
} from '@/payload-types'
import { CLUB_NAME } from './constants'
import { getPayloadClient } from './payload'

/**
 * Data access for the public site, through Payload's Local API (PRD §J.1).
 * A failed query returns `null` so pages can show their error state instead of a
 * blank section (PRD §D.2 "Error state"). Lists never include unpublished drafts
 * unless Draft Mode is on.
 */
async function safely<T>(label: string, run: (payload: Payload) => Promise<T>): Promise<T | null> {
  try {
    const payload = await getPayloadClient()
    return await run(payload)
  } catch (err) {
    console.error(`[queries] ${label} failed:`, (err as Error).message)
    return null
  }
}

async function isDraft(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch {
    return false
  }
}

export const getSiteSettings = cache(() =>
  safely<SiteSetting>('site settings', (p) => p.findGlobal({ slug: 'site-settings', depth: 1 })),
)

export const getJoinPage = cache(() =>
  safely<JoinPage>('join page', (p) => p.findGlobal({ slug: 'join-page', depth: 0 })),
)

/* ---------------------------------- Matches --------------------------------- */

// The Local API skips access control, so unpublished drafts are filtered out here.
const PUBLISHED: Where = { _status: { equals: 'published' } }

export const getUpcomingMatches = cache((limit = 100) =>
  safely<Match[]>('upcoming matches', async (p) => {
    const res = await p.find({
      collection: 'matches',
      where: {
        and: [
          PUBLISHED,
          { status: { in: ['scheduled', 'live', 'postponed'] } },
          // Keep a match visible on "Upcoming" until a few hours after kickoff.
          { kickoffUtc: { greater_than: new Date(Date.now() - 6 * 3600_000).toISOString() } },
        ],
      },
      sort: 'kickoffUtc',
      limit,
      depth: 1,
    })
    return res.docs
  }),
)

export const getResults = cache((limit = 100) =>
  safely<Match[]>('results', async (p) => {
    const res = await p.find({
      collection: 'matches',
      where: { and: [PUBLISHED, { status: { in: ['fulltime', 'cancelled'] } }] },
      sort: '-kickoffUtc',
      limit,
      depth: 1,
    })
    return res.docs
  }),
)

export const getMatchBySlug = cache((slug: string) =>
  safely<Match | null>('match', async (p) => {
    const draft = await isDraft()
    const res = await p.find({
      collection: 'matches',
      where: draft ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, PUBLISHED] },
      limit: 1,
      depth: 2,
      draft,
      overrideAccess: draft,
    })
    return res.docs[0] ?? null
  }),
)

export const getAllMatchesForNav = cache(() =>
  safely<Pick<Match, 'id' | 'slug' | 'opponentName' | 'kickoffUtc' | 'homeOrAway'>[]>('match list', async (p) => {
    const res = await p.find({
      collection: 'matches',
      where: PUBLISHED,
      sort: 'kickoffUtc',
      limit: 500,
      depth: 0,
      select: { slug: true, opponentName: true, kickoffUtc: true, homeOrAway: true },
    })
    return res.docs
  }),
)

export const getLastUpdated = cache(() =>
  safely<string | null>('last updated', async (p) => {
    const res = await p.find({ collection: 'matches', where: PUBLISHED, sort: '-updatedAt', limit: 1, depth: 0 })
    return res.docs[0]?.updatedAt ?? null
  }),
)

/* ---------------------------------- Players --------------------------------- */

export const getPlayers = cache(() =>
  safely<Player[]>('players', async (p) => {
    const res = await p.find({
      collection: 'players',
      where: { isActive: { equals: true } },
      sort: 'shirtNumber',
      limit: 200,
      depth: 1,
    })
    return res.docs
  }),
)

export const getFeaturedPlayers = cache(() =>
  safely<Player[]>('featured players', async (p) => {
    const res = await p.find({
      collection: 'players',
      where: {
        and: [{ isActive: { equals: true } }, { featured: { equals: true } }, { squadRole: { equals: 'squad' } }],
      },
      sort: 'shirtNumber',
      limit: 6,
      depth: 1,
    })
    return res.docs
  }),
)

export const getPlayerBySlug = cache((slug: string) =>
  safely<Player | null>('player', async (p) => {
    const res = await p.find({
      collection: 'players',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    return res.docs[0] ?? null
  }),
)

export const getStaff = cache(() =>
  safely<Staff[]>('staff', async (p) => {
    const res = await p.find({ collection: 'staff', sort: 'order', limit: 100, depth: 1 })
    return res.docs
  }),
)

/* ---------------------------------- Gallery --------------------------------- */

export const getGallery = cache((limit = 500) =>
  safely<Media[]>('gallery', async (p) => {
    const res = await p.find({
      collection: 'media',
      where: { showInGallery: { equals: true } },
      sort: '-createdAt',
      limit,
      depth: 0,
    })
    return res.docs
  }),
)

/* ---------------------------------- Sponsors -------------------------------- */

export const getSponsors = cache(() =>
  safely<Sponsor[]>('sponsors', async (p) => {
    const res = await p.find({
      collection: 'sponsors',
      where: { permissionOnFile: { equals: true } },
      sort: 'order',
      limit: 100,
      depth: 1,
    })
    return res.docs
  }),
)

/* ---------------------------------- Search --------------------------------- */

export type SearchHit = { href: string; title: string; kind: string }

/** Header search: players, staff and matches by name, plus the fixed pages. */
export const searchSite = cache((q: string) =>
  safely<SearchHit[]>('search', async (p) => {
    const term = q.trim()
    if (term.length < 2) return []
    const [players, staff, matches] = await Promise.all([
      p.find({
        collection: 'players',
        where: { and: [{ isActive: { equals: true } }, { fullName: { like: term } }] },
        limit: 10,
        depth: 0,
        select: { fullName: true, slug: true, squadRole: true },
      }),
      p.find({
        collection: 'staff',
        where: { or: [{ name: { like: term } }, { role: { like: term } }] },
        limit: 5,
        depth: 0,
        select: { name: true, role: true },
      }),
      p.find({
        collection: 'matches',
        where: { and: [PUBLISHED, { or: [{ opponentName: { like: term } }, { competition: { like: term } }] }] },
        sort: '-kickoffUtc',
        limit: 10,
        depth: 0,
        select: { opponentName: true, slug: true, kickoffUtc: true, homeOrAway: true },
      }),
    ])
    return [
      ...players.docs.map((d) =>
        d.squadRole === 'guest'
          ? { href: '/squad?pos=guests', title: d.fullName, kind: 'Guest player' }
          : { href: `/squad/${d.slug}`, title: d.fullName, kind: 'Player' },
      ),
      ...staff.docs.map((d) => ({ href: '/about', title: d.name, kind: d.role })),
      ...matches.docs.map((d) => ({
        href: `/results/${d.slug}`,
        title: d.homeOrAway === 'away' ? `${d.opponentName} v ${CLUB_NAME}` : `${CLUB_NAME} v ${d.opponentName}`,
        kind: 'Match',
      })),
    ]
  }),
)
