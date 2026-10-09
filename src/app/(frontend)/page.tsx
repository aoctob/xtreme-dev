import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarX2 } from 'lucide-react'
import {
  Badge,
  EmptyState,
  JoinCta,
  JsonLd,
  MediaImage,
  OrSupply,
  SectionHead,
  Supply,
  TextLink,
} from '@/components/Basics'
import { Gallery } from '@/components/Gallery'
import { MatchCard, Scoreboard } from '@/components/Match'
import { NewsCard } from '@/components/News'
import { PlayerCard } from '@/components/Player'
import { SponsorGrid } from '@/components/Sponsors'
import { SocialIcon } from '@/components/SocialIcon'
import { toGalleryItems } from '@/lib/gallery'
import { absoluteUrl, asMedia } from '@/lib/media'
import {
  getFeaturedPlayers,
  getGallery,
  getLatestPosts,
  getResults,
  getSiteSettings,
  getSponsors,
  getUpcomingMatches,
} from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: { absolute: 'Xtreme FC | Fixtures, squad and trials' },
  description:
    'The home of Xtreme FC: next match, latest results, the squad, club news and how to join or sponsor the club.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const [settings, upcoming, results, players, posts, gallery, sponsors] = await Promise.all([
    getSiteSettings(),
    getUpcomingMatches(2),
    getResults(3),
    getFeaturedPlayers(),
    getLatestPosts(3),
    getGallery(6),
    getSponsors(),
  ])

  const nextMatch = upcoming?.[0]
  const lastResult = results?.find((m) => m.status === 'fulltime')
  const stripMatch = nextMatch ?? lastResult
  const heroImage = asMedia(settings?.heroImage)
  const instagram = settings?.socials?.find((s) => s.network === 'instagram')
  const sameAs = (settings?.socials ?? []).map((s) => s.url)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SportsTeam',
          name: 'Xtreme FC',
          sport: 'Football',
          url: absoluteUrl('/'),
          logo: absoluteUrl('/brand/badge-512.webp'),
          ...(settings?.foundingYear ? { foundingDate: String(settings.foundingYear) } : {}),
          ...(settings?.email ? { email: settings.email } : {}),
          ...(settings?.homeGround || settings?.address
            ? { location: { '@type': 'Place', name: settings?.homeGround ?? undefined, address: settings?.address ?? undefined } }
            : {}),
          ...(sameAs.length ? { sameAs } : {}),
        }}
      />

      {/* 1. Hero */}
      <section className="hero" aria-labelledby="hero-title">
        {heroImage ? (
          <div className="hero__media">
            <MediaImage media={heroImage} alt="" size="large" sizes="100vw" priority />
          </div>
        ) : (
          <div className="hero__lines" aria-hidden="true" />
        )}
        <div className="container">
          <div className="hero__content">
            <span className="eyebrow">
              <OrSupply value={settings?.tagline} what="tagline" />
            </span>
            <h1 id="hero-title" className="t-display">
              {settings?.heroHeadline || 'Xtreme FC'}
            </h1>
            <p className="t-lead">
              {!settings?.heroHeadline && (
                <>
                  <Supply what="headline (8 words max)" />{' '}
                </>
              )}
              <OrSupply value={settings?.heroLead} what="lead paragraph (25 words max)" />
            </p>
            <div className="btn-row">
              <Link className="btn btn--primary btn--lg" href="/join" data-track="join_cta_click" data-track-location="hero">
                Join the club
              </Link>
              <Link className="btn btn--secondary btn--lg" href="/fixtures">
                View fixtures
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Match strip */}
      <section className="match-strip" aria-label={nextMatch ? 'Next match' : 'Latest result'}>
        <div className="container">
          {upcoming === null && results === null ? (
            <div className="scoreboard clip">
              <p className="t-secondary" style={{ textAlign: 'center' }}>
                Match information is unavailable right now. <Link href="/fixtures">See all fixtures</Link>.
              </p>
            </div>
          ) : stripMatch ? (
            <>
              <Link href={`/fixtures/${stripMatch.slug}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                <Scoreboard match={stripMatch} />
              </Link>
              <div className="match-strip__foot">
                <TextLink href="/fixtures">All fixtures</TextLink>
              </div>
            </>
          ) : (
            <div className="scoreboard clip">
              <p style={{ textAlign: 'center' }}>
                No match scheduled.{' '}
                {instagram ? (
                  <a href={instagram.url} target="_blank" rel="noopener noreferrer" data-social="instagram">
                    Follow us on Instagram for updates<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  'Follow us for updates.'
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Club intro */}
      <section className="section" aria-labelledby="intro-title">
        <div className="container split">
          <div className="stack">
            <span className="eyebrow eyebrow--rule">The club</span>
            <h2 id="intro-title" className="t-h2">
              Who we are
            </h2>
            <p className="t-lead measure">
              <OrSupply value={settings?.clubIntro} what="club intro (60 words max)" />
            </p>
            <div className="btn-row">
              <TextLink href="/about">About the club</TextLink>
              {instagram && (
                <a className="link" href={instagram.url} target="_blank" rel="noopener noreferrer" data-social="instagram">
                  <SocialIcon network="instagram" size={16} /> Follow on Instagram
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
          </div>
          <div className="article-cover clip" style={{ margin: 0 }}>
            {asMedia(settings?.introImage) ? (
              <MediaImage media={asMedia(settings?.introImage)} sizes="(min-width: 1024px) 40vw, 100vw" />
            ) : (
              <div className="media-placeholder" aria-hidden="true">
                <Badge size={120} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Featured players */}
      {players && players.length > 0 && (
        <section className="section section--alt" aria-labelledby="players-title">
          <div className="container">
            <SectionHead eyebrow="The squad" title="Meet the players" id="players-title" link={{ href: '/squad', label: 'Full squad' }} />
            <ul role="list" className="scroll-row">
              {players.map((p) => (
                <li key={p.id}>
                  <PlayerCard player={p} compact />
                </li>
              ))}
            </ul>
            {players.length > 1 && <p className="scroll-hint t-caption">Swipe for more players →</p>}
          </div>
        </section>
      )}

      {/* 5. Results & fixtures */}
      <section className="section" aria-labelledby="matches-title">
        <div className="container">
          <SectionHead eyebrow="Matches" title="Fixtures & results" id="matches-title" link={{ href: '/fixtures', label: 'All fixtures' }} />
          <div className="split split--top">
            <div className="stack">
              <h3 className="t-h4">Next fixtures</h3>
              {upcoming === null ? (
                <p className="t-secondary">
                  Fixtures could not be loaded. <Link href="/fixtures">Open the fixtures page</Link>.
                </p>
              ) : upcoming.length ? (
                <div className="match-list">
                  {upcoming.map((m) => (
                    <MatchCard key={m.id} match={m} headingLevel={4} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={<CalendarX2 aria-hidden="true" />} title="No matches scheduled">
                  <p>Follow us for updates.</p>
                </EmptyState>
              )}
            </div>
            {results && results.length > 0 && (
              <div className="stack">
                <h3 className="t-h4">Latest results</h3>
                <div className="match-list">
                  {results.map((m) => (
                    <MatchCard key={m.id} match={m} headingLevel={4} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. News */}
      {posts && posts.length > 0 && (
        <section className="section section--alt" aria-labelledby="news-title">
          <div className="container">
            <SectionHead eyebrow="Latest" title="Club news" id="news-title" link={{ href: '/news', label: 'All news' }} />
            <div className="home-news">
              {posts.map((p, i) => (
                <NewsCard key={p.id} post={p} featured={false} priority={i === 0} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Gallery highlights */}
      {gallery && gallery.length > 0 && (
        <section className="section" aria-labelledby="gallery-title">
          <div className="container">
            <SectionHead eyebrow="Gallery" title="Match-day moments" id="gallery-title" link={{ href: '/gallery', label: 'Open gallery' }} />
            <Gallery items={toGalleryItems(gallery)} limit={6} gridClass="gallery-grid gallery-grid--home" />
          </div>
        </section>
      )}

      {/* 8. Sponsors (only real ones) */}
      {sponsors && sponsors.length > 0 && (
        <section className="section section--alt" aria-labelledby="sponsors-title">
          <div className="container">
            <SectionHead eyebrow="Partners" title="Our sponsors" id="sponsors-title" link={{ href: '/sponsors', label: 'Partner with us' }} />
            <SponsorGrid sponsors={sponsors} />
          </div>
        </section>
      )}

      {/* 9. Join CTA */}
      <JoinCta text={settings?.joinCtaText} />
    </>
  )
}
