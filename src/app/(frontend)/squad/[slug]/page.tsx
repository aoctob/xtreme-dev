import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Breadcrumb, MediaImage } from '@/components/Basics'
import { TrackView } from '@/components/Analytics'
import { Gallery } from '@/components/Gallery'
import { PlayerCard, positionLabel } from '@/components/Player'
import { ShareButton } from '@/components/Share'
import { ageFrom } from '@/lib/format'
import { toGalleryItems } from '@/lib/gallery'
import { asMedia, mediaList } from '@/lib/media'
import { getPlayerBySlug, getPlayers } from '@/lib/queries'

export const revalidate = 600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const players = await getPlayers()
  return (players ?? []).filter((p) => p.slug).map((p) => ({ slug: p.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const player = await getPlayerBySlug(slug)
  if (!player) return { title: 'Player not found' }
  const photo = player.consentOnFile ? asMedia(player.photo) : null
  const position = positionLabel(player.position)
  return {
    title: `${player.fullName}${player.shirtNumber ? ` #${player.shirtNumber}` : ''}`,
    description: (player.bio || `${player.fullName}, ${position} for Xtreme FC.`).slice(0, 155),
    alternates: { canonical: `/squad/${slug}` },
    openGraph: photo?.url ? { images: [{ url: photo.sizes?.card?.url || photo.url, alt: photo.alt }] } : undefined,
  }
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params
  const [player, all] = await Promise.all([getPlayerBySlug(slug), getPlayers()])
  if (!player || !player.isActive) notFound()

  const position = positionLabel(player.position)
  const photo = player.consentOnFile ? asMedia(player.photo) : null
  const age = player.showAge && player.dateOfBirth ? ageFrom(player.dateOfBirth) : null
  const stats = [
    { label: 'Appearances', value: player.stats?.appearances },
    { label: 'Goals', value: player.stats?.goals },
    { label: 'Assists', value: player.stats?.assists },
  ].filter((s) => typeof s.value === 'number')
  const gallery = player.consentOnFile ? mediaList(player.gallery) : []
  const list = all ?? []
  const i = list.findIndex((p) => p.id === player.id)
  const prev = i > 0 ? list[i - 1] : null
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null
  const related = list.filter((p) => p.position === player.position && p.id !== player.id).slice(0, 3)
  // No social handle for under-18s (PRD §D.5 privacy).
  const showSocial = player.socialHandle && !(player.dateOfBirth && ageFrom(player.dateOfBirth) < 18)

  return (
    <>
      <TrackView event="player_profile_view" />
      <Breadcrumb trail={[{ href: '/', label: 'Home' }, { href: '/squad', label: 'Squad' }, { label: player.fullName }]} />

      <section className="profile-head" style={{ marginTop: 16 }}>
        <div className="container profile-head__grid">
          <div className="profile-head__photo clip clip--lg">
            <MediaImage media={photo} alt={photo ? `${player.fullName}` : ''} size="card" priority sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
          <div className="profile-head__info">
            {player.shirtNumber ? (
              <span className="profile-head__giant" aria-hidden="true">
                {player.shirtNumber}
              </span>
            ) : null}
            <span className="eyebrow">{position}</span>
            <h1 className="t-h1">{player.fullName}</h1>
            {player.shirtNumber ? (
              <p className="profile-head__number">
                <span className="sr-only">Shirt number </span>#{player.shirtNumber}
              </p>
            ) : null}
            <div className="meta-row t-small t-secondary">
              {age !== null && <span>Age {age}</span>}
              {player.nationality && <span>{player.nationality}</span>}
              {showSocial && <span>{player.socialHandle}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShareButton title={`${player.fullName} | Xtreme FC`} />
            </div>
          </div>
        </div>
      </section>

      {stats.length > 0 && (
        <section className="section" style={{ paddingBlock: 48 }} aria-labelledby="stats-title">
          <div className="container">
            <h2 id="stats-title" className="sr-only">
              Season stats
            </h2>
            <dl className="stats-row" style={{ margin: 0 }}>
              {stats.map((s) => (
                <div key={s.label} className="stat">
                  <dt className="t-caption" style={{ order: 2 }}>
                    {s.label}
                  </dt>
                  <dd style={{ margin: 0, order: 1 }}>
                    <strong>{s.value}</strong>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {player.bio && (
        <section className="section" style={{ paddingTop: stats.length ? 0 : undefined }} aria-labelledby="bio-title">
          <div className="container">
            <h2 id="bio-title" className="t-h3" style={{ marginBottom: 16 }}>
              About
            </h2>
            <p className="t-lead measure" style={{ color: 'var(--color-text-primary)' }}>
              {player.bio}
            </p>
          </div>
        </section>
      )}

      {gallery.length >= 2 && (
        <section className="section section--alt" aria-labelledby="pgallery-title">
          <div className="container">
            <h2 id="pgallery-title" className="t-h3" style={{ marginBottom: 24 }}>
              Photos
            </h2>
            <Gallery items={toGalleryItems(gallery)} limit={6} gridClass="gallery-grid gallery-grid--home" />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section" aria-labelledby="related-title">
          <div className="container">
            <h2 id="related-title" className="t-h3" style={{ marginBottom: 24 }}>
              More {POSITION_PLURAL[player.position] ?? 'players'}
            </h2>
            <ul role="list" className="player-grid">
              {related.map((p) => (
                <li key={p.id}>
                  <PlayerCard player={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="container" style={{ paddingBottom: 64 }}>
        <nav className="prev-next" aria-label="Other players">
          {prev ? (
            <Link className="link" href={`/squad/${prev.slug}`}>
              <ArrowLeft size={16} aria-hidden="true" /> {prev.fullName}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link className="link" href={`/squad/${next.slug}`}>
              {next.fullName} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </nav>
      </div>
    </>
  )
}

const POSITION_PLURAL: Record<string, string> = {
  goalkeeper: 'goalkeepers',
  defender: 'defenders',
  midfielder: 'midfielders',
  forward: 'forwards',
}
