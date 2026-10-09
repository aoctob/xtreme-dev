import type { Metadata } from 'next'
import { CalendarX2, Trophy } from 'lucide-react'
import { EmptyState, ErrorBox, JoinCta, PageHero } from '@/components/Basics'
import { FixturesTabs } from '@/components/FixturesTabs'
import { MatchCard } from '@/components/Match'
import type { Match } from '@/payload-types'
import { formatLongDate, formatMonth, groupBy } from '@/lib/format'
import { getLastUpdated, getResults, getSiteSettings, getUpcomingMatches } from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Fixtures & results',
  description: 'Upcoming Xtreme FC matches with kickoff times in IST, plus every result and match report.',
  alternates: { canonical: '/fixtures' },
}

function MatchList({ matches }: { matches: Match[] }) {
  const groups = groupBy(matches, (m) => formatMonth(m.kickoffUtc))
  const sticky = matches.length > 6
  return (
    <>
      {groups.map(([month, list]) => (
        <section key={month} className={`month-group${sticky ? ' month-group--sticky' : ''}`} aria-label={month}>
          <h3 className="t-h3">{month}</h3>
          <div className="match-list">
            {list.map((m) => (
              <MatchCard key={m.id} match={m} headingLevel={3} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export default async function FixturesPage() {
  const [upcoming, results, lastUpdated, settings] = await Promise.all([
    getUpcomingMatches(),
    getResults(),
    getLastUpdated(),
    getSiteSettings(),
  ])
  const instagram = settings?.socials?.find((s) => s.network === 'instagram')

  return (
    <>
      <PageHero title="Fixtures & results" description="All times in IST (India Standard Time)." />
      <section className="section">
        <div className="container">
          <div className="list-meta">
            <h2 className="sr-only">Matches</h2>
            <span />
            {lastUpdated && <span className="t-caption">Last updated: {formatLongDate(lastUpdated)}</span>}
          </div>
          <FixturesTabs
            upcoming={
              upcoming === null ? (
                <ErrorBox what="Fixtures" href="/fixtures" />
              ) : upcoming.length ? (
                <MatchList matches={upcoming} />
              ) : (
                <EmptyState icon={<CalendarX2 aria-hidden="true" />} title="No matches scheduled.">
                  <p>
                    {instagram ? (
                      <a href={instagram.url} target="_blank" rel="noopener noreferrer" data-social="instagram">
                        Follow us on Instagram for updates<span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      'Check back soon.'
                    )}
                  </p>
                </EmptyState>
              )
            }
            results={
              results === null ? (
                <ErrorBox what="Results" href="/fixtures?tab=results" />
              ) : results.length ? (
                <MatchList matches={results} />
              ) : (
                <EmptyState icon={<Trophy aria-hidden="true" />} title="No results yet." />
              )
            }
          />
        </div>
      </section>
      <JoinCta text={settings?.joinCtaText} />
    </>
  )
}
