import 'server-only'
import { draftMode } from 'next/headers'
import { cache } from 'react'
import type { Payload } from 'payload'
import type {
  JoinPage,
  Match,
  Media,
  Player,
  Post,
  SiteSetting,
  Sponsor,
  Staff,
} from '@/payload-types'
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

export const getUpcomingMatches = cache((limit = 100) =>
  safely<Match[]>('upcoming matches', async (p) => {
    const res = await p.find({
      collection: 'matches',
      where: {
        and: [
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
      where: { status: { in: ['fulltime', 'cancelled'] } },
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
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
      draft,
      overrideAccess: draft,
    })
    return res.docs[0] ?? null
  }),
)

export const getAllMatchesForNav = cache(() =>
  safely<Pick<Match, 'id' | 'slug' | 'opponentName' | 'kickoffUtc'>[]>('match list', async (p) => {
    const res = await p.find({
      collection: 'matches',
      sort: 'kickoffUtc',
      limit: 500,
      depth: 0,
      select: { slug: true, opponentName: true, kickoffUtc: true },
    })
    return res.docs
  }),
)

export const getLastUpdated = cache(() =>
  safely<string | null>('last updated', async (p) => {
    const res = await p.find({ collection: 'matches', sort: '-updatedAt', limit: 1, depth: 0 })
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
      where: { and: [{ isActive: { equals: true } }, { featured: { equals: true } }] },
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

/* ----------------------------------- News ----------------------------------- */

export const NEWS_PAGE_SIZE = 12

export const getPosts = cache((page = 1, category?: string) =>
  safely('posts', async (p) => {
    const res = await p.find({
      collection: 'posts',
      where: {
        and: [
          { _status: { equals: 'published' } },
          ...(category ? [{ category: { equals: category } }] : []),
        ],
      },
      sort: '-publishedAt',
      limit: NEWS_PAGE_SIZE,
      page,
      depth: 1,
    })
    return res
  }),
)

export const getLatestPosts = cache((limit = 3) =>
  safely<Post[]>('latest posts', async (p) => {
    const res = await p.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit,
      depth: 1,
    })
    return res.docs
  }),
)

export const getPostBySlug = cache((slug: string) =>
  safely<Post | null>('post', async (p) => {
    const draft = await isDraft()
    const res = await p.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
      draft,
      overrideAccess: draft,
    })
    return res.docs[0] ?? null
  }),
)

export const getAllPostSlugs = cache(() =>
  safely<Pick<Post, 'slug' | 'updatedAt'>[]>('post slugs', async (p) => {
    const res = await p.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
      select: { slug: true, updatedAt: true },
    })
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

/** Which optional nav items have content (PRD §E.1 "Hidden items"). */
export const getNavAvailability = cache(async () => {
  const [posts, gallery] = await Promise.all([
    safely('post count', (p) =>
      p.count({ collection: 'posts', where: { _status: { equals: 'published' } } }),
    ),
    safely('gallery count', (p) =>
      p.count({ collection: 'media', where: { showInGallery: { equals: true } } }),
    ),
  ])
  return { news: (posts?.totalDocs ?? 0) > 0, gallery: (gallery?.totalDocs ?? 0) > 0 }
})
