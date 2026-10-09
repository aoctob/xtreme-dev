import type { Metadata } from 'next'
import Link from 'next/link'
import { TileGrid } from '@/components/kit/gallery'
import { MatchStrip, PlayerRow } from '@/components/kit/live'
import { Reveal } from '@/components/kit/motion'
import { Badge, Button, ErrorState, JoinBand, Ph, Sec, SectionHead, SponsorLogo } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { formatDay } from '@/lib/format'
import { absoluteUrl } from '@/lib/media'
import { getFeaturedPlayers, getGallery, getPlayers, getResults, getSiteSettings, getSponsors, getUpcomingMatches } from '@/lib/queries'
import { socialUrl } from '@/lib/site'
import { imageOf, matchVM, mediaVM, playerVM, sponsorVM, type MatchVM } from '@/lib/view'

export const metadata: Metadata = {
  title: { absolute: `${CLUB_NAME} | Squad, results and trials` },
  description: `The home of ${CLUB_NAME}: the next match, recent results, the squad and how to join or sponsor the club.`,
  alternates: { canonical: '/' },
}

function ResultRow({ m, i }: { m: MatchVM; i: number }) {
  return (
    <Reveal
      i={i}
      as="a"
      href={`/results/${m.slug}`}
      className="rrow"
      aria-label={`${m.home.name} ${m.home.score}, ${m.away.name} ${m.away.score}, ${formatDay(m.kickoff)}`}
    >
      <span className="rrow-d">{formatDay(m.kickoff)}</span>
      <span className="rrow-t">
        <span>{m.home.name}</span>
        <b className="tnum">
          {m.home.score} – {m.away.score}
        </b>
        <span>{m.away.name}</span>
      </span>
      {m.outcome && <Badge status={m.outcome} />}
    </Reveal>
  )
}

export default async function HomePage() {
  const [settings, upcoming, results, featured, allPlayers, gallery, sponsors] = await Promise.all([
    getSiteSettings(),
    getUpcomingMatches(4),
    getResults(8),
    getFeaturedPlayers(),
    getPlayers(),
    getGallery(6),
    getSponsors(),
  ])

  const up = (upcoming ?? []).map(matchVM)
  const res = (results ?? []).filter((m) => m.status === 'fulltime').map(matchVM)
  const live = up.find((m) => m.status === 'live') ?? null
  const next = up.find((m) => m.status === 'scheduled' && new Date(m.kickoff).getTime() > Date.now()) ?? null
  const squad = (allPlayers ?? []).filter((p) => p.squadRole !== 'guest')
  const players = (featured?.length ? featured : squad.slice(0, 6)).map(playerVM)
  const photos = (gallery ?? []).map(mediaVM)
  const partners = (sponsors ?? []).map(sponsorVM)

  const headline = (settings?.heroHeadline || 'Play with intent.').trim().split(/\s+/)
  const sameAs = (settings?.socials ?? []).map((s) => s.url)

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsTeam',
            name: CLUB_NAME,
            sport: 'Football',
            url: absoluteUrl('/'),
            logo: absoluteUrl('/brand/emblem-512.webp'),
            ...(settings?.foundingYear ? { foundingDate: String(settings.foundingYear) } : {}),
            ...(settings?.email ? { email: settings.email } : {}),
            ...(sameAs.length ? { sameAs } : {}),
          }).replace(/</g, '\\u003c'),
        }}
      />

      <section className="hero">
        <div className="hero-lines" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="wrap hero-in">
          <div className="hero-copy">
            <div className="eyebrow hero-fade" style={{ animationDelay: '60ms' }}>
              {settings?.tagline || CLUB_NAME}
            </div>
            <h1 className="hero-h">
              {headline.map((w, i) => (
                <span key={i}>
                  <span className="hl">
                    <span className={i === headline.length - 1 ? 'neon' : undefined} style={{ animationDelay: 120 + i * 100 + 'ms' }}>
                      {w}
                    </span>
                  </span>{' '}
                </span>
              ))}
            </h1>
            <p className="hero-lead hero-fade" style={{ animationDelay: '460ms' }}>
              {settings?.heroLead || 'A local club built on discipline and pace. See the squad, the next match, and how to join.'}
            </p>
            <div className="btnrow hero-fade" style={{ animationDelay: '560ms' }}>
              <Button size="large" icon="arrow-right" href="/join" data-track="join_cta_click" data-track-location="hero">
                Apply for trials
              </Button>
              <Button variant="secondary" size="large" href="/results">
                View results
              </Button>
            </div>
          </div>
          <div className="hero-badge" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/emblem-512.webp" alt="" width={360} height={360} />
          </div>
        </div>
        <div className="wrap strip-wrap">
          <MatchStrip
            live={live}
            next={next}
            last={res[0] ?? null}
            failed={upcoming === null && results === null}
            instagram={socialUrl(settings, 'instagram')}
          />
        </div>
      </section>

      <Sec>
        <div className="split">
          <div>
            <SectionHead eyebrow="The club" title="Built to compete" />
            <p className="body-l">
              {settings?.clubIntro || '[CLUB TO SUPPLY: club story, max 60 words. Who the club is, where it plays, what it stands for.]'}
            </p>
            <Button variant="tertiary" icon="arrow-right" href="/about">
              About the club
            </Button>
          </div>
          <Reveal>
            <Ph ratio="4/3" clip="lg" label="Club photo" image={imageOf(settings?.introImage, 'large')} />
          </Reveal>
        </div>
      </Sec>

      <Sec alt>
        <SectionHead eyebrow="Featured players" title="Meet the squad" more="Full squad" moreHref="/squad" />
        {allPlayers === null ? (
          <ErrorState title="Squad could not be loaded" description="Check your connection and try again." retryHref="/" />
        ) : players.length === 0 ? (
          <p className="muted">Players will appear here once the club adds them.</p>
        ) : (
          <PlayerRow players={players} />
        )}
      </Sec>

      <Sec>
        <SectionHead eyebrow="Match history" title="Recent results" more="All results" moreHref="/results" />
        {results === null ? (
          <p className="muted">
            Results could not be loaded. <Link href="/results">Open the results page</Link>.
          </p>
        ) : res.length === 0 ? (
          <p className="muted">Results appear here after full time.</p>
        ) : (
          <div className="stack-tight" style={{ maxWidth: 960 }}>
            {res.slice(0, 4).map((m, i) => (
              <ResultRow key={m.slug} m={m} i={i} />
            ))}
          </div>
        )}
      </Sec>

      {photos.length > 0 && (
        <Sec alt>
          <SectionHead eyebrow="Gallery" title="Match moments" more="Open gallery" moreHref="/gallery" />
          <TileGrid items={photos} />
        </Sec>
      )}

      {partners.length > 0 && (
        <Sec>
          <SectionHead eyebrow="Sponsors" title="Our partners" more="Partner with us" moreHref="/sponsors" />
          <div className="grid-4">
            {partners.map((s, i) => (
              <Reveal i={i} key={s.id}>
                <SponsorLogo s={s} />
              </Reveal>
            ))}
          </div>
        </Sec>
      )}

      <JoinBand text={settings?.joinCtaText} />
    </div>
  )
}

