/**
 * Demo content from the design kit (ui_kits/website/kit-data.js), so a fresh database
 * looks like the prototype. Every name, score and stat here is SAMPLE data: never run
 * this against the live database once the club has entered real content.
 *
 *   npm run seed:demo           add the demo content (skips anything already there)
 *   npm run seed:demo -- clear  remove everything this script created
 *
 * Club facts stay empty so the site keeps showing [CLUB TO SUPPLY] placeholders.
 */
import config from '@payload-config'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const EMBLEM = path.resolve(dirname, '../../public/brand/emblem-512.webp')
const ctx = { disableRevalidate: true }

/** A kickoff in IST, as kit-data.js builds them. */
const ist = (y: number, m: number, d: number, h: number, mi: number) =>
  new Date(Date.UTC(y, m - 1, d, h, mi) - 330 * 60000).toISOString()
const now = new Date(Date.now() + 330 * 60000)
const nextKick = ist(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate() + 3, 18, 0)

type Pos = 'goalkeeper' | 'defender' | 'midfielder' | 'forward'
const P: Record<string, Pos> = { GK: 'goalkeeper', DEF: 'defender', MID: 'midfielder', FWD: 'forward' }
const ROSTER: [number, string][] = [
  [1, 'GK'], [13, 'GK'], [2, 'DEF'], [3, 'DEF'], [4, 'DEF'], [5, 'DEF'], [15, 'DEF'], [6, 'MID'],
  [8, 'MID'], [10, 'MID'], [14, 'MID'], [16, 'MID'], [7, 'FWD'], [9, 'FWD'], [11, 'FWD'], [17, 'FWD'],
]
const STATS: Record<number, [number, number, number]> = { 9: [12, 9, 3], 7: [12, 5, 6], 10: [11, 3, 7], 4: [12, 1, 0], 1: [10, 0, 0] }
const FEATURED = [9, 7, 10, 1, 4, 11]
const GUESTS: [string, number, string][] = [
  ['GK', 1, 'Winter Cup 2026'], ['DEF', 2, 'City 7s League'], ['MID', 1, 'Winter Cup 2026'], ['FWD', 2, 'Monsoon Invitational'],
]
const STAFF = ['Head coach', 'Assistant coach', 'Team manager', 'Physio']

type Scorer = { minute: number; side: 'us' | 'them'; name: string }
type Fixture = {
  slug: string
  opp: string
  kick: string
  home: boolean
  venue: string
  comp: string
  status: 'scheduled' | 'postponed' | 'fulltime'
  gf?: number
  ga?: number
  scorers?: Scorer[]
  photos?: boolean
}
const MATCHES: Fixture[] = [
  { slug: 'xfc-v-rivals-fc', opp: 'Rivals FC', kick: nextKick, home: true, venue: 'Home ground', comp: 'League', status: 'scheduled' },
  { slug: 'north-side-ac-v-xfc', opp: 'North Side AC', kick: ist(2026, 10, 24, 17, 30), home: false, venue: 'North Side AC ground', comp: 'League', status: 'scheduled' },
  { slug: 'xfc-v-united-stars', opp: 'United Stars', kick: ist(2026, 11, 7, 18, 0), home: true, venue: 'Home ground', comp: 'District Cup', status: 'scheduled' },
  { slug: 'lakeview-sc-v-xfc-cup', opp: 'Lakeview SC', kick: ist(2026, 11, 21, 16, 0), home: false, venue: 'Lakeview SC ground', comp: 'Friendly', status: 'postponed' },
  {
    slug: 'xfc-v-city-united', opp: 'City United', kick: ist(2026, 10, 4, 18, 0), home: true, venue: 'Home ground', comp: 'League', status: 'fulltime', gf: 2, ga: 1, photos: true,
    scorers: [{ minute: 12, side: 'them', name: 'City United' }, { minute: 34, side: 'us', name: 'Player 9' }, { minute: 78, side: 'us', name: 'Player 7' }],
  },
  {
    slug: 'harbor-fc-v-xfc', opp: 'Harbor FC', kick: ist(2026, 9, 27, 17, 0), home: false, venue: 'Harbor FC ground', comp: 'League', status: 'fulltime', gf: 1, ga: 1,
    scorers: [{ minute: 41, side: 'them', name: 'Harbor FC' }, { minute: 88, side: 'us', name: 'Player 11' }],
  },
  { slug: 'xfc-v-riverside-fc', opp: 'Riverside FC', kick: ist(2026, 9, 20, 18, 0), home: true, venue: 'Home ground', comp: 'League', status: 'fulltime', gf: 0, ga: 2 },
  { slug: 'xfc-v-lakeview-sc', opp: 'Lakeview SC', kick: ist(2026, 9, 13, 18, 0), home: true, venue: 'Home ground', comp: 'Friendly', status: 'fulltime', gf: 3, ga: 0 },
]
const ALBUMS = ['Match day', 'Training', 'Community']
const CAPTIONS = [
  'XTREME CLUB v City United', 'Evening session', 'Pre-match huddle', 'Harbor FC away', 'Warm-up drills',
  'Youth open day', 'Celebrating the winner', 'Set-piece practice', 'Supporters at the home ground', 'Lakeview SC friendly',
]
const SPONSORS = ['Sponsor logo 1', 'Sponsor logo 2', 'Sponsor logo 3', 'Sponsor logo 4']

/** The kit's photo placeholder (raised surface + 20% badge), as a real image file. */
async function placeholder(tone: string): Promise<Buffer> {
  const badge = await sharp(EMBLEM).resize(300, 300).ensureAlpha(0.2).toBuffer()
  const faded = await sharp(badge)
    .composite([{ input: Buffer.from([255, 255, 255, 51]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp({ create: { width: 1200, height: 1200, channels: 3, background: tone } })
    .composite([{ input: faded, gravity: 'centre' }])
    .jpeg({ quality: 80 })
    .toBuffer()
}

async function exists(payload: Payload, collection: 'players' | 'matches' | 'staff' | 'sponsors' | 'media', field: string, value: string) {
  const r = await payload.find({ collection, where: { [field]: { equals: value } }, limit: 1, depth: 0, overrideAccess: true })
  return r.docs[0] as { id: number } | undefined
}

async function seed(payload: Payload) {
  // Media: 30 placeholder tiles across three albums.
  const media: number[] = []
  for (let i = 0; i < 30; i++) {
    const filename = `demo-media-${String(i).padStart(2, '0')}.jpg`
    const found = await exists(payload, 'media', 'filename', filename)
    if (found) {
      media.push(found.id)
      continue
    }
    const data = await placeholder(i % 3 === 1 ? '#1A3523' : '#12291A')
    const doc = await payload.create({
      collection: 'media',
      overrideAccess: true,
      context: ctx,
      data: {
        alt: `${CAPTIONS[i % CAPTIONS.length]} (photo placeholder)`,
        caption: CAPTIONS[i % CAPTIONS.length],
        credit: i % 4 === 0 ? '[CLUB TO SUPPLY]' : undefined,
        album: ALBUMS[i % 3],
        type: 'image',
        showInGallery: true,
      },
      file: { data, mimetype: 'image/jpeg', name: filename, size: data.length },
    })
    media.push(doc.id)
  }

  for (const [num, pos] of ROSTER) {
    const slug = `player-${num}`
    if (await exists(payload, 'players', 'slug', slug)) continue
    const s = STATS[num]
    await payload.create({
      collection: 'players',
      overrideAccess: true,
      context: ctx,
      data: {
        fullName: `Player ${num}`,
        slug,
        shirtNumber: num,
        position: P[pos],
        squadRole: 'squad',
        isActive: true,
        publicationStatus: 'published',
        featured: FEATURED.includes(num),
        stats: s ? { appearances: s[0], goals: s[1], assists: s[2] } : undefined,
        // Player 9 shows the profile photo strip, as in the kit.
        consentOnFile: num === 9,
        gallery: num === 9 ? media.slice(6, 9) : undefined,
      },
    })
  }
  for (const [i, [pos, apps, event]] of GUESTS.entries()) {
    const slug = `guest-${i + 1}`
    if (await exists(payload, 'players', 'slug', slug)) continue
    await payload.create({
      collection: 'players',
      overrideAccess: true,
      context: ctx,
      data: { fullName: `Guest ${i + 1}`, slug, position: P[pos], squadRole: 'guest', guestAppearances: apps, guestEvent: event, isActive: true, publicationStatus: 'published' },
    })
  }
  for (const [i, role] of STAFF.entries()) {
    if (await exists(payload, 'staff', 'role', role)) continue
    await payload.create({ collection: 'staff', overrideAccess: true, context: ctx, data: { name: 'Staff name', role, order: i } })
  }

  for (const m of MATCHES) {
    if (await exists(payload, 'matches', 'slug', m.slug)) continue
    await payload.create({
      collection: 'matches',
      overrideAccess: true,
      context: ctx,
      data: {
        _status: 'published',
        slug: m.slug,
        opponentName: m.opp,
        homeOrAway: m.home ? 'home' : 'away',
        kickoffUtc: m.kick,
        competition: m.comp,
        venueName: m.venue,
        status: m.status,
        scoreFor: m.gf,
        scoreAgainst: m.ga,
        scorers: m.scorers,
        gallery: m.photos ? media.slice(0, 6) : undefined,
      },
    })
  }

  for (const [i, name] of SPONSORS.entries()) {
    if (await exists(payload, 'sponsors', 'name', name)) continue
    await payload.create({
      collection: 'sponsors',
      overrideAccess: true,
      context: ctx,
      data: { name, logoOnWhite: i === 1, permissionOnFile: true, order: i },
    })
  }

  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  if (!settings.announcement)
    await payload.updateGlobal({ slug: 'site-settings', context: ctx, data: { announcement: 'Season trials are open.' } })
  const join = await payload.findGlobal({ slug: 'join-page', depth: 0 })
  if (!join.trialDates?.length)
    await payload.updateGlobal({
      slug: 'join-page',
      context: ctx,
      data: { trialDates: [{ start: ist(2026, 10, 17, 7, 0), note: 'sample' }, { start: ist(2026, 10, 31, 7, 0), note: 'sample' }] },
    })
  payload.logger.info('Demo content added.')
}

async function clear(payload: Payload) {
  const del = (collection: 'players' | 'matches' | 'staff' | 'sponsors' | 'media', where: object) =>
    payload.delete({ collection, where: where as never, overrideAccess: true, context: ctx })
  await del('matches', { slug: { in: MATCHES.map((m) => m.slug) } })
  await del('players', { or: [{ slug: { like: 'player-' } }, { slug: { like: 'guest-' } }] })
  await del('staff', { name: { equals: 'Staff name' } })
  await del('sponsors', { name: { in: SPONSORS } })
  await del('media', { filename: { like: 'demo-media-' } })
  const join = await payload.findGlobal({ slug: 'join-page', depth: 0 })
  await payload.updateGlobal({
    slug: 'join-page',
    context: ctx,
    data: { trialDates: (join.trialDates ?? []).filter((t) => t.note !== 'sample') },
  })
  payload.logger.info('Demo content removed.')
}

const payload = await getPayload({ config })
if (process.argv.includes('clear')) await clear(payload)
else await seed(payload)
process.exit(0)
