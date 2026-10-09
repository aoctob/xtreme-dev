import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/kit/Icon'
import { Button, EmptyState, PageHero } from '@/components/kit/ui'
import { searchSite, type SearchHit } from '@/lib/queries'

export const metadata: Metadata = { title: 'Search', robots: { index: false } }

const PAGES: SearchHit[] = [
  { href: '/join', title: 'Join the club: trials and application', kind: 'Page' },
  { href: '/register', title: 'Player registration', kind: 'Page' },
  { href: '/squad', title: 'Squad', kind: 'Page' },
  { href: '/results', title: 'Results and match history', kind: 'Page' },
  { href: '/gallery', title: 'Gallery', kind: 'Page' },
  { href: '/about', title: 'About the club', kind: 'Page' },
  { href: '/sponsors', title: 'Sponsors and partners', kind: 'Page' },
  { href: '/contact', title: 'Contact', kind: 'Page' },
  { href: '/privacy', title: 'Privacy policy', kind: 'Page' },
]

/** Results for the header search box. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').slice(0, 80).trim()
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const pages = words.length ? PAGES.filter((p) => words.some((w) => p.title.toLowerCase().includes(w))) : []
  const hits = q ? [...((await searchSite(q)) ?? []), ...pages] : []
  return (
    <div>
      <PageHero title="Search" crumbs={[{ label: 'Home', href: '/' }, { label: 'Search' }]}>
        <form action="/search" role="search" className="sform">
          <input className="ctl" type="search" name="q" defaultValue={q} placeholder="Players, matches, pages" aria-label="Search the site" />
          <Button type="submit" icon="search" iconPosition="left">
            Search
          </Button>
        </form>
      </PageHero>
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap" style={{ maxWidth: 960 }}>
          {!q ? (
            <p className="muted">Search for a player, an opponent or a page.</p>
          ) : hits.length === 0 ? (
            <EmptyState icon="search" title="No results" description={`Nothing matches “${q}”. Try a player’s name or an opponent.`} />
          ) : (
            <>
              <p className="caption" style={{ marginBottom: 16 }}>
                {hits.length} {hits.length === 1 ? 'result' : 'results'} for “{q}”
              </p>
              <div className="sres">
                {hits.map((h) => (
                  <Link key={h.href + h.title} href={h.href}>
                    <span>
                      <span className="fact-l" style={{ display: 'block' }}>
                        {h.kind}
                      </span>
                      <span className="pn-n">{h.title}</span>
                    </span>
                    <Icon name="arrow-right" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
