import type { Metadata } from 'next'
import { Flag } from 'lucide-react'
import { Badge, JoinCta, MediaImage, OrSupply, PageHero, SectionHead, Supply, TextLink } from '@/components/Basics'
import { StaffCard } from '@/components/Player'
import { asMedia } from '@/lib/media'
import { getSiteSettings, getStaff } from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'About the club',
  description: 'The story of Xtreme FC: who we are, our values, our coaching staff and our history.',
  alternates: { canonical: '/about' },
}

export default async function AboutPage() {
  const [settings, staff] = await Promise.all([getSiteSettings(), getStaff()])
  const values = settings?.values ?? []
  const timeline = settings?.timeline ?? []
  const storyImage = asMedia(settings?.storyImage)

  return (
    <>
      <PageHero title="About the club" />

      <section className="section" aria-labelledby="story-title">
        <div className="container split split--reverse">
          <div className="article-cover clip" style={{ margin: 0 }}>
            {storyImage ? (
              <MediaImage media={storyImage} sizes="(min-width: 1024px) 40vw, 100vw" />
            ) : (
              <div className="media-placeholder" aria-hidden="true">
                <Badge size={120} />
              </div>
            )}
          </div>
          <div className="stack">
            <span className="eyebrow eyebrow--rule">Our story</span>
            <h2 id="story-title" className="t-h2">
              Xtreme FC
            </h2>
            <p className="t-lead measure" style={{ whiteSpace: 'pre-line', color: 'var(--color-text-primary)' }}>
              <OrSupply value={settings?.clubStory} what="club story (200 words max)" />
            </p>
            <dl className="meta-row t-small" style={{ margin: 0 }}>
              <div>
                <dt className="t-caption">Founded</dt>
                <dd style={{ margin: 0 }}>
                  <OrSupply value={settings?.foundingYear} what="founding year" />
                </dd>
              </div>
              <div>
                <dt className="t-caption">Home ground</dt>
                <dd style={{ margin: 0 }}>
                  <OrSupply value={settings?.homeGround} what="home ground" />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="values-title">
        <div className="container">
          <SectionHead eyebrow="What we stand for" title="Our values" id="values-title" />
          {values.length ? (
            <ul role="list" className="grid-3 values-grid">
              {values.map((v) => (
                <li key={v.id ?? v.title} className="card clip">
                  <Flag size={24} aria-hidden="true" />
                  <h3 className="t-h4">{v.title}</h3>
                  {v.text && <p className="t-small t-secondary">{v.text}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              <Supply what="3–5 club values" />
            </p>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="badge-title">
        <div className="container badge-meaning">
          <Badge size={160} alt="Xtreme FC badge" />
          <div className="stack">
            <h2 id="badge-title" className="t-h3">
              Our badge
            </h2>
            <p className="measure t-secondary" style={{ whiteSpace: 'pre-line' }}>
              <OrSupply value={settings?.badgeMeaning} what="meaning of the badge and colours" />
            </p>
          </div>
        </div>
      </section>

      {staff && staff.length > 0 && (
        <section className="section section--alt" aria-labelledby="staff-title">
          <div className="container">
            <SectionHead eyebrow="The people" title="Coaching & management" id="staff-title" />
            <ul role="list" className="player-grid">
              {staff.map((s) => (
                <li key={s.id}>
                  <StaffCard person={s} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="section" aria-labelledby="history-title">
          <div className="container container--text">
            <SectionHead eyebrow="History" title="History & achievements" id="history-title" />
            <ol role="list" className="timeline">
              {timeline.map((t) => (
                <li key={t.id ?? `${t.year}-${t.title}`}>
                  <div className="timeline__year">{t.year}</div>
                  <h3 className="t-h4" style={{ marginTop: 8 }}>
                    {t.title}
                  </h3>
                  {t.text && <p className="t-small t-secondary">{t.text}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <div className="container" style={{ paddingBottom: 48 }}>
        <TextLink href="/contact">Contact the club</TextLink>
      </div>
      <JoinCta text={settings?.joinCtaText} />
    </>
  )
}
