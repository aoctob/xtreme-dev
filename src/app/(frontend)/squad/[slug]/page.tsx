import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TrackView } from '@/components/Analytics'
import { Icon } from '@/components/kit/Icon'
import { TileGrid } from '@/components/kit/gallery'
import { CountUp, Reveal } from '@/components/kit/motion'
import { ShareButton } from '@/components/kit/toast'
import { Breadcrumbs, Ph, PlayerCard, Sec, SectionHead } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { ageFrom } from '@/lib/format'
import { getPlayerBySlug, getPlayers } from '@/lib/queries'
import { imageOf, mediaListVM, playerVM, positionLabel, positionPlural } from '@/lib/view'

export const revalidate = 600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const players = await getPlayers()
  return (players ?? []).filter((p) => p.slug && p.squadRole !== 'guest').map((p) => ({ slug: p.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const player = await getPlayerBySlug(slug)
  if (!player) return { title: 'Player not found' }
  const photo = player.consentOnFile ? imageOf(player.photo, 'card') : null
  const position = positionLabel(player.position)
  return {
    title: `${player.fullName}${player.shirtNumber ? ` #${player.shirtNumber}` : ''}`,
    description: (player.bio || `${player.fullName}, ${position} for ${CLUB_NAME}.`).slice(0, 155),
    alternates: { canonical: `/squad/${slug}` },
    openGraph: photo ? { images: [{ url: photo.src, alt: photo.alt }] } : undefined,
  }
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params
  const [player, all] = await Promise.all([getPlayerBySlug(slug), getPlayers()])
  if (!player || !player.isActive || player.squadRole === 'guest') notFound()

  const p = playerVM(player)
  const list = (all ?? []).filter((x) => x.squadRole !== 'guest')
  const idx = list.findIndex((x) => x.id === player.id)
  const prev = list.length > 1 ? list[(idx - 1 + list.length) % list.length] : null
  const next = list.length > 1 ? list[(idx + 1) % list.length] : null
  const related = list
    .filter((x) => x.position === player.position && x.id !== player.id)
    .slice(0, 3)
    .map(playerVM)
  const plural = positionPlural(player.position)
  const photos = player.consentOnFile ? mediaListVM(player.gallery).slice(0, 6) : []
  const s = player.stats
  const stats = (
    [
      ['Appearances', s?.appearances],
      ['Goals', s?.goals],
      ['Assists', s?.assists],
    ] as [string, number | null | undefined][]
  ).filter((x): x is [string, number] => typeof x[1] === 'number')
  const age = player.showAge && player.dateOfBirth ? ageFrom(player.dateOfBirth) : null
  const facts = [age !== null ? `Age ${age}` : null, player.nationality || null].filter((x): x is string => Boolean(x))

  return (
    <div>
      <TrackView event="player_profile_view" props={{ slug }} />
      <section className="pband">
        <div className="wrap">
          <div className="phero-crumbs">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Squad', href: '/squad' }, { label: p.name }]} />
          </div>
          <div className="pband-grid">
            <div className="pband-photo">
              <Ph ratio="4/5" clip="lg" label="Player portrait 4:5" image={p.photo} priority sizes="(min-width:768px) 420px, 100vw" />
            </div>
            <div className="pband-info">
              {p.number ? (
                <span className="pband-num tnum" aria-hidden="true">
                  {p.number}
                </span>
              ) : null}
              <div className="eyebrow">{p.position}</div>
              <h1 className="h1 pband-name">{p.name}</h1>
              <div className="pband-meta">
                {p.number ? (
                  <>
                    <span className="tnum">No. {p.number}</span>
                    <span className="dot" />
                  </>
                ) : null}
                <Link href={`/squad?pos=${p.positionKey}`}>{plural}</Link>
                {facts.map((f) => (
                  <span key={f} style={{ display: 'contents' }}>
                    <span className="dot" />
                    <span>{f}</span>
                  </span>
                ))}
              </div>
              <div className="btnrow">
                <ShareButton title={`${p.name} · ${CLUB_NAME}`} label="Share profile" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {stats.length > 0 && (
        <section className="sec-tight">
          <div className="wrap">
            <div className="stats">
              {stats.map(([l, v], i) => (
                <Reveal i={i} key={l} className="stat">
                  <div className="stat-v tnum">
                    <CountUp value={v} />
                  </div>
                  <div className="stat-l">{l}</div>
                </Reveal>
              ))}
              <p className="caption stats-note">Season stats from the club’s own records. Omitted when not supplied.</p>
            </div>
          </div>
        </section>
      )}

      <Sec>
        <div className={photos.length ? 'split' : undefined}>
          <div>
            <SectionHead eyebrow="Bio" title="About the player" />
            <p className="body-l">
              {player.bio || '[CLUB TO SUPPLY: bio, max 40 words. Joined year, previous clubs, playing style as agreed by the player.]'}
            </p>
          </div>
          {photos.length > 0 && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 16 }}>
                Photos
              </div>
              <TileGrid items={photos} className="grid-3t" />
            </div>
          )}
        </div>
      </Sec>

      {related.length > 0 && (
        <Sec alt>
          <SectionHead eyebrow={plural} title="Related players" />
          <div className="grid-3">
            {related.map((r, i) => (
              <Reveal i={i} key={r.slug}>
                <PlayerCard name={r.name} number={r.number} position={r.position} photo={r.photo} href={`/squad/${r.slug}`} />
              </Reveal>
            ))}
          </div>
        </Sec>
      )}

      {prev && next && (
        <section className="sec-tight">
          <div className="wrap pn">
            <Link className="pn-l" href={`/squad/${prev.slug}`}>
              <Icon name="arrow-left" />
              <span>
                <span className="caption">Previous player</span>
                <span className="pn-n">{prev.fullName}</span>
              </span>
            </Link>
            <Link className="pn-r" href={`/squad/${next.slug}`}>
              <span>
                <span className="caption">Next player</span>
                <span className="pn-n">{next.fullName}</span>
              </span>
              <Icon name="arrow-right" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
