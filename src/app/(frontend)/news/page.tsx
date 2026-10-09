import type { Metadata } from 'next'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { EmptyState, ErrorBox, PageHero } from '@/components/Basics'
import { NewsCard } from '@/components/News'
import { POST_CATEGORIES } from '@/lib/constants'
import { getPosts } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'News & announcements',
  description: 'Xtreme FC match reports, club news, trial announcements and sponsor news.',
  alternates: { canonical: '/news' },
}

// Filters and pagination: All | Match Reports | Club News | Trials (PRD §C.2, §D.8).
const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Match Reports', value: 'match-report' },
  { label: 'Club News', value: 'club-news' },
  { label: 'Trials', value: 'trials' },
]

const href = (category: string, page = 1) => {
  const q = new URLSearchParams()
  if (category) q.set('category', category)
  if (page > 1) q.set('page', String(page))
  const s = q.toString()
  return s ? `/news?${s}` : '/news'
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const sp = await searchParams
  const category = POST_CATEGORIES.some((c) => c.value === sp.category) ? sp.category! : ''
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const result = await getPosts(page, category || undefined)

  return (
    <>
      <PageHero title="News" description="Match reports, club news and trial announcements." />
      <section className="section">
        <div className="container">
          <nav className="filter-row" aria-label="News categories">
            <ul role="list">
              {FILTERS.map((f) => (
                <li key={f.value || 'all'}>
                  <Link className="chip-btn" href={href(f.value)} aria-current={f.value === category ? 'page' : undefined}>
                    {f.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {result === null ? (
            <ErrorBox what="News" href={href(category, page)} />
          ) : result.docs.length === 0 ? (
            <EmptyState icon={<Newspaper aria-hidden="true" />} title="No posts yet." />
          ) : (
            <>
              <h2 className="sr-only">Posts</h2>
              {page === 1 && (
                <div style={{ marginBottom: 48 }}>
                  <NewsCard post={result.docs[0]} featured priority />
                </div>
              )}
              <div className="news-grid">
                {(page === 1 ? result.docs.slice(1) : result.docs).map((p) => (
                  <NewsCard key={p.id} post={p} />
                ))}
              </div>
              {result.totalPages > 1 && (
                <nav className="pagination" aria-label="Pagination">
                  <ol>
                    {result.hasPrevPage && (
                      <li>
                        <Link href={href(category, page - 1)}>Previous</Link>
                      </li>
                    )}
                    {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) => (
                      <li key={n}>
                        {n === page ? (
                          <span aria-current="page">{n}</span>
                        ) : (
                          <Link href={href(category, n)} aria-label={`Page ${n}`}>
                            {n}
                          </Link>
                        )}
                      </li>
                    ))}
                    {result.hasNextPage && (
                      <li>
                        <Link href={href(category, page + 1)}>Next</Link>
                      </li>
                    )}
                  </ol>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
