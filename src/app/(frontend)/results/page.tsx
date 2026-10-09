import type { Metadata } from 'next'
import { MatchItem } from '@/components/kit/MatchItem'
import { Reveal } from '@/components/kit/motion'
import { Badge, EmptyState, ErrorState, JoinBand, PageHero } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { formatLongDate, formatMonth, groupBy } from '@/lib/format'
import { getLastUpdated, getResults, getSiteSettings } from '@/lib/queries'
import { matchVM } from '@/lib/view'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Results',
  description: `${CLUB_NAME} match history: previous results, newest first, with the season record and recent form.`,
  alternates: { canonical: '/results' },
}

export default async function ResultsPage() {
  const [results, updated, settings] = await Promise.all([getResults(), getLastUpdated(), getSiteSettings()])
  const list = (results ?? []).map(matchVM)
  const played = list.filter((m) => m.outcome)
  const rec = played.reduce(
    (r, m) => {
      r[m.outcome!] += 1
      const us = m.home.isUs ? m.home : m.away
      const them = m.home.isUs ? m.away : m.home
      r.gf += us.score ?? 0
      r.ga += them.score ?? 0
      return r
    },
    { win: 0, draw: 0, loss: 0, gf: 0, ga: 0 },
  )
  const stats: [string, number][] = [
    ['Played', played.length],
    ['Won', rec.win],
    ['Drawn', rec.draw],
    ['Lost', rec.loss],
    ['Goals for', rec.gf],
    ['Goals against', rec.ga],
  ]
  const form = played.slice(0, 5)

  return (
    <div>
      <PageHero title="Match history" desc="Previous results, newest first. All times in IST." crumbs={[{ label: 'Home', href: '/' }, { label: 'Results' }]} />
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap" style={{ maxWidth: 960 }}>
          <div className="fx-top">{updated && <span className="caption">Last updated: {formatLongDate(updated)}</span>}</div>
          <div className="fx-panel">
            {results === null ? (
              <ErrorState title="Results could not be loaded" description="Check your connection and try again." retryHref="/results" />
            ) : list.length === 0 ? (
              <EmptyState icon="calendar" title="No results yet" description="Results appear here after full time." />
            ) : (
              <>
                <Reveal className="rec" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 16, marginBottom: 24 }}>
                  {stats.map(([l, v]) => (
                    <div key={l}>
                      <div className="fact-l">{l}</div>
                      <div className="h3 tnum" style={{ margin: 0 }}>
                        {v}
                      </div>
                    </div>
                  ))}
                </Reveal>
                {form.length > 0 && (
                  <Reveal className="formguide">
                    <span className="caption">Recent form</span>
                    <div className="fg-b">
                      {form.map((m) => (
                        <Badge key={m.slug} status={m.outcome!} />
                      ))}
                    </div>
                  </Reveal>
                )}
                {groupBy(list, (m) => formatMonth(m.kickoff)).map(([month, items]) => (
                  <div key={month} className="fx-group">
                    <h3 className="h4 fx-month">{month}</h3>
                    <div className="stack">
                      {items.map((m, i) => (
                        <MatchItem key={m.slug} m={m} i={i} />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>
      <JoinBand text={settings?.joinCtaText} />
    </div>
  )
}
