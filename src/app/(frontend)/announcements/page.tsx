import type { Metadata } from 'next'
import { EmptyState, ErrorState, PageHero, Ph, Sec } from '@/components/kit/ui'
import { Reveal } from '@/components/kit/motion'
import { ANNOUNCEMENT_CATEGORIES, CLUB_NAME, labelFor } from '@/lib/constants'
import { formatDay } from '@/lib/format'
import { getAnnouncements } from '@/lib/queries'
import { imageOf } from '@/lib/view'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Announcements',
  description: `News and notices from the ${CLUB_NAME} committee.`,
  alternates: { canonical: '/announcements' },
}

export default async function AnnouncementsPage() {
  const items = await getAnnouncements()
  return (
    <div>
      <PageHero title="Announcements" desc="Notices from the club committee." crumbs={[{ label: 'Home', href: '/' }, { label: 'Announcements' }]} />
      <Sec>
        {items === null ? (
          <ErrorState title="Announcements unavailable" description="We could not load announcements. Please try again shortly." retryHref="/announcements" />
        ) : items.length === 0 ? (
          <EmptyState icon="clipboard-list" title="No announcements" description="There are no current announcements from the committee." />
        ) : (
          <div className="stack" style={{ gap: 24, maxWidth: 'var(--container-article-max)' }}>
            {items.map((a, i) => {
              const img = imageOf(a.featuredImage)
              return (
                <Reveal i={i} key={a.id}>
                  <article style={{ background: 'var(--color-surface)', clipPath: 'var(--clip-card)', boxShadow: 'inset 0 0 0 1px var(--color-border)', padding: 28 }}>
                    <div className="eyebrow">
                      {labelFor(ANNOUNCEMENT_CATEGORIES, a.category)}
                      {a.publishedAt ? ` · ${formatDay(a.publishedAt)}` : ''}
                    </div>
                    <h2 className="h3" style={{ marginBottom: 16 }}>
                      {a.title}
                    </h2>
                    {img && <Ph ratio="16/9" image={img} clip={false} style={{ marginBottom: 16 }} />}
                    {a.content.split(/\n{2,}/).map((p, j) => (
                      <p key={j} className="muted" style={{ whiteSpace: 'pre-line', margin: '0 0 12px' }}>
                        {p}
                      </p>
                    ))}
                  </article>
                </Reveal>
              )
            })}
          </div>
        )}
      </Sec>
    </div>
  )
}
