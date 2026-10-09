import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CalendarPlus, MapPin } from 'lucide-react'
import { Breadcrumb, JsonLd, TextLink } from '@/components/Basics'
import { Gallery } from '@/components/Gallery'
import { Scoreboard } from '@/components/Match'
import { toGalleryItems } from '@/lib/gallery'
import { formatFullDate, formatKickoff } from '@/lib/format'
import { matchSummary, matchTitle, sides } from '@/lib/match'
import { absoluteUrl, mediaList } from '@/lib/media'
import { getAllMatchesForNav, getMatchBySlug } from '@/lib/queries'

export const revalidate = 600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const matches = await getAllMatchesForNav()
  return (matches ?? []).filter((m) => m.slug).map((m) => ({ slug: m.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const match = await getMatchBySlug(slug)
  if (!match) return { title: 'Match not found' }
  return {
    title: `${matchTitle(match)}`.slice(0, 50),
    description: `${matchSummary(match)}. ${match.venueName ? `Venue: ${match.venueName}.` : ''}`.slice(0, 155),
    alternates: { canonical: `/fixtures/${slug}` },
  }
}

export default async function MatchPage({ params }: Props) {
  const { slug } = await params
  const [match, all] = await Promise.all([getMatchBySlug(slug), getAllMatchesForNav()])
  if (!match) notFound()

  const [home, away] = sides(match)
  const index = (all ?? []).findIndex((m) => m.slug === slug)
  const prev = index > 0 ? all![index - 1] : null
  const next = index >= 0 && index < (all?.length ?? 0) - 1 ? all![index + 1] : null
  const report = match.report && typeof match.report === 'object' ? match.report : null
  const photos = mediaList(match.gallery)
  const ourScorers = (match.scorers ?? []).filter((s) => s.side !== 'them')
  const theirScorers = (match.scorers ?? []).filter((s) => s.side === 'them')

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: matchTitle(match),
          sport: 'Football',
          startDate: match.kickoffUtc,
          eventStatus:
            match.status === 'cancelled'
              ? 'https://schema.org/EventCancelled'
              : match.status === 'postponed'
                ? 'https://schema.org/EventPostponed'
                : 'https://schema.org/EventScheduled',
          url: absoluteUrl(`/fixtures/${slug}`),
          homeTeam: { '@type': 'SportsTeam', name: home.name },
          awayTeam: { '@type': 'SportsTeam', name: away.name },
          competitor: [
            { '@type': 'SportsTeam', name: home.name },
            { '@type': 'SportsTeam', name: away.name },
          ],
          ...(match.venueName ? { location: { '@type': 'Place', name: match.venueName } } : {}),
        }}
      />
      <Breadcrumb trail={[{ href: '/', label: 'Home' }, { href: '/fixtures', label: 'Fixtures' }, { label: matchTitle(match) }]} />

      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container stack" style={{ gap: 32 }}>
          <Scoreboard match={match} large headingLevel={1} />

          <div className="card clip">
            <ul role="list" className="contact-list">
              <li>
                <CalendarPlus size={24} aria-hidden="true" />
                <div>
                  <strong>{formatFullDate(match.kickoffUtc)}</strong>
                  <div className="t-secondary t-small">Kickoff {formatKickoff(match.kickoffUtc).split(' · ')[1]}</div>
                  {match.status === 'scheduled' && (
                    <a className="link" href={`/fixtures/${slug}/calendar.ics`} download data-track="fixture_calendar_add">
                      Add to calendar
                    </a>
                  )}
                </div>
              </li>
              {match.venueName && (
                <li>
                  <MapPin size={24} aria-hidden="true" />
                  <div>
                    <strong>{match.venueName}</strong>
                    <div className="t-secondary t-small">{match.homeOrAway === 'home' ? 'Home match' : 'Away match'}</div>
                    {match.venueMapUrl && (
                      <a className="link" href={match.venueMapUrl} target="_blank" rel="noopener noreferrer">
                        Get directions<span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    )}
                  </div>
                </li>
              )}
              {match.competition && (
                <li>
                  <span aria-hidden="true" />
                  <div>
                    <span className="t-caption">Competition</span>
                    <div>{match.competition}</div>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {(ourScorers.length > 0 || theirScorers.length > 0) && (
            <section aria-labelledby="scorers-title" className="stack">
              <h2 id="scorers-title" className="t-h3">
                Goals
              </h2>
              <div className="split split--top" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {[
                  { team: 'Xtreme FC', list: ourScorers },
                  { team: match.opponentName, list: theirScorers },
                ].map(({ team, list }) => (
                  <div key={team}>
                    <h3 className="t-h4" style={{ marginBottom: 8 }}>
                      {team}
                    </h3>
                    {list.length ? (
                      <ul className="t-small" style={{ paddingLeft: '1.2em', margin: 0 }}>
                        {list.map((s, i) => (
                          <li key={i}>
                            {s.name}
                            {s.minute ? ` ${s.minute}′` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="t-small t-secondary">—</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {report?.slug && (
            <section aria-labelledby="report-title" className="card clip stack">
              <span className="eyebrow">Match report</span>
              <h2 id="report-title" className="t-h3">
                {report.title}
              </h2>
              {report.excerpt && <p className="t-secondary">{report.excerpt}</p>}
              <TextLink href={`/news/${report.slug}`}>Read the match report</TextLink>
            </section>
          )}

          {photos.length > 0 && (
            <section aria-labelledby="photos-title">
              <h2 id="photos-title" className="t-h3" style={{ marginBottom: 24 }}>
                Match photos
              </h2>
              <Gallery items={toGalleryItems(photos)} limit={6} gridClass="gallery-grid gallery-grid--home" />
            </section>
          )}

          <nav className="prev-next" aria-label="Other matches">
            {prev?.slug ? (
              <Link className="link" href={`/fixtures/${prev.slug}`}>
                <ArrowLeft size={16} aria-hidden="true" /> Previous: vs {prev.opponentName}
              </Link>
            ) : (
              <span />
            )}
            {next?.slug && (
              <Link className="link" href={`/fixtures/${next.slug}`}>
                Next: vs {next.opponentName} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>
      </section>
    </>
  )
}
