import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon } from '@/components/kit/Icon'
import { TileGrid } from '@/components/kit/gallery'
import { MatchScoreboard } from '@/components/kit/live'
import { Reveal } from '@/components/kit/motion'
import { ToastLink } from '@/components/kit/toast'
import { Breadcrumbs, Button, Sec, SectionHead } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { formatDay, formatTime } from '@/lib/format'
import { fixtureTitle, matchSummary } from '@/lib/match'
import { absoluteUrl } from '@/lib/media'
import { getAllMatchesForNav, getMatchBySlug } from '@/lib/queries'
import { matchVM, mediaListVM } from '@/lib/view'

export const revalidate = 600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const all = await getAllMatchesForNav()
  return (all ?? []).filter((m) => m.slug).map((m) => ({ slug: m.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const match = await getMatchBySlug(slug)
  if (!match) return { title: 'Match not found' }
  return {
    title: fixtureTitle(match),
    description: matchSummary(match),
    alternates: { canonical: `/results/${slug}` },
  }
}

const navTitle = (m: { opponentName: string; homeOrAway?: string | null }) =>
  m.homeOrAway === 'away' ? `${m.opponentName} v ${CLUB_NAME}` : `${CLUB_NAME} v ${m.opponentName}`

export default async function MatchPage({ params }: Props) {
  const { slug } = await params
  const [match, all] = await Promise.all([getMatchBySlug(slug), getAllMatchesForNav()])
  if (!match) notFound()

  const m = matchVM(match)
  const isRes = m.status === 'fulltime' && m.hasScore
  const list = all ?? []
  const i = list.findIndex((x) => x.slug === slug)
  const prev = i > 0 ? list[i - 1] : null
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null
  const events = (match.scorers ?? [])
    .filter((e) => typeof e.minute === 'number')
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
    .map((e) => ({ min: e.minute as number, side: e.side === 'them' ? 'them' : 'us', who: e.name }))
  const photos = mediaListVM(match.gallery)

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: fixtureTitle(match),
            startDate: m.kickoff,
            sport: 'Football',
            url: absoluteUrl(`/results/${slug}`),
            eventStatus:
              m.status === 'postponed'
                ? 'https://schema.org/EventPostponed'
                : m.status === 'cancelled'
                  ? 'https://schema.org/EventCancelled'
                  : 'https://schema.org/EventScheduled',
            homeTeam: { '@type': 'SportsTeam', name: m.home.name },
            awayTeam: { '@type': 'SportsTeam', name: m.away.name },
            ...(match.venueName ? { location: { '@type': 'Place', name: match.venueName } } : {}),
          }).replace(/</g, '\\u003c'),
        }}
      />
      <section className="mband">
        <div className="wrap" style={{ maxWidth: 960 }}>
          <div className="phero-crumbs">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Results', href: '/results' }, { label: `${m.home.name} v ${m.away.name}` }]} />
          </div>
          <h1 className="sr">{matchSummary(match)}</h1>
          <div className="sb-wrap">
            <MatchScoreboard m={m} />
          </div>
          <div className="mdetails">
            <div className="md">
              <Icon name="calendar" color="var(--color-primary-ink)" />
              <div>
                <div className="fact-l">Kickoff</div>
                <div className="fact-v">
                  {formatDay(m.kickoff)} · {formatTime(m.kickoff)} IST
                </div>
              </div>
            </div>
            <div className="md">
              <Icon name="map-pin" color="var(--color-primary-ink)" />
              <div>
                <div className="fact-l">Venue</div>
                <div className="fact-v">{m.venue}</div>
                {m.mapUrl && (
                  <Button variant="tertiary" href={m.mapUrl} external>
                    Get directions
                  </Button>
                )}
              </div>
            </div>
            <div className="md">
              <Icon name="flag" color="var(--color-primary-ink)" />
              <div>
                <div className="fact-l">Competition</div>
                <div className="fact-v">
                  {m.competition ? `${m.competition} · ` : ''}
                  {m.isHome ? 'Home' : 'Away'}
                </div>
              </div>
            </div>
          </div>
          {m.status === 'scheduled' && (
            <div className="btnrow" style={{ marginTop: 24 }}>
              <ToastLink
                variant="primary"
                icon="calendar"
                iconPosition="left"
                href={`/results/${slug}/calendar.ics`}
                download
                event="fixture_calendar_add"
                toastText="Calendar file (.ics) downloaded"
                toastIcon="calendar"
              >
                Add to calendar
              </ToastLink>
            </div>
          )}
          {m.status === 'postponed' && (
            <p className="muted" style={{ marginTop: 24 }}>
              This match has been postponed. A new date will be published here.
            </p>
          )}
          {m.status === 'cancelled' && (
            <p className="muted" style={{ marginTop: 24 }}>
              This match has been cancelled.
            </p>
          )}
        </div>
      </section>

      {events.length > 0 && (
        <Sec>
          <SectionHead eyebrow="Goals" title="Match timeline" />
          <Reveal className="mtl">
            <div className="mtl-track">
              <span className="mtl-fill" />
            </div>
            {events.map((e, j) => (
              <div
                key={j}
                className={'mtl-ev ' + e.side}
                style={{ left: (Math.min(e.min, 90) / 90) * 100 + '%', animationDelay: 400 + j * 160 + 'ms' }}
              >
                <span className="mtl-dot" />
                <span className="mtl-lab">
                  <b className="tnum">{e.min}′</b> {e.who}
                </span>
              </div>
            ))}
            <div className="mtl-ends caption">
              <span>KO</span>
              <span>HT</span>
              <span>FT</span>
            </div>
          </Reveal>
          <ul className="scorers">
            {events.map((e, j) => (
              <li key={j}>
                <span className="tnum">{e.min}′</span>
                <span>{e.who}</span>
                <span className="muted">{e.side === 'us' ? CLUB_NAME : m.opponent}</span>
              </li>
            ))}
          </ul>
        </Sec>
      )}

      {isRes && photos.length > 0 && (
        <Sec alt>
          <SectionHead eyebrow="Photos" title="From the match" more="Open gallery" moreHref="/gallery" />
          <TileGrid items={photos} />
        </Sec>
      )}

      <section className="sec-tight" style={{ background: 'var(--color-surface)' }}>
        <div className="wrap pn" style={{ maxWidth: 960 }}>
          {prev ? (
            <Link className="pn-l" href={`/results/${prev.slug}`}>
              <Icon name="arrow-left" />
              <span>
                <span className="caption">Previous match</span>
                <span className="pn-n">{navTitle(prev)}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="pn-r" href={`/results/${next.slug}`}>
              <span>
                <span className="caption">Next match</span>
                <span className="pn-n">{navTitle(next)}</span>
              </span>
              <Icon name="arrow-right" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </section>
    </div>
  )
}
