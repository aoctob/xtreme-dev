import type { Metadata } from 'next'
import { Icon, type IconName } from '@/components/kit/Icon'
import { Reveal } from '@/components/kit/motion'
import { Timeline } from '@/components/kit/widgets'
import { JoinBand, PageHero, Ph, PlayerCard, Sec, SectionHead } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { getOfficials, getSiteSettings, getStaff } from '@/lib/queries'
import { imageOf, staffVM, supply } from '@/lib/view'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'About the club',
  description: `Who ${CLUB_NAME} are, what the club stands for, and the people behind it.`,
  alternates: { canonical: '/about' },
}

const VALUE_ICONS: IconName[] = ['target', 'zap', 'users', 'shield', 'flag']
const PLACEHOLDER_VALUES = ['value one', 'value two', 'value three'].map((t) => ({
  title: `[CLUB TO SUPPLY: ${t}]`,
  text: 'One sentence on what this value means on the pitch.',
}))

const PLACEHOLDER_TIMELINE = [
  { year: '[Year]', title: 'Club founded', text: '[CLUB TO SUPPLY: founding story]' },
  { year: '[Year]', title: 'First competitive season', text: '[CLUB TO SUPPLY]' },
  { year: '[Year]', title: 'Verified achievement', text: '[CLUB TO SUPPLY: only verifiable entries]' },
]

export default async function AboutPage() {
  const [s, staff, officials] = await Promise.all([getSiteSettings(), getStaff(), getOfficials()])
  const values = s?.values?.length ? s.values.map((v) => ({ title: v.title, text: v.text || '' })) : PLACEHOLDER_VALUES
  const crew = (staff ?? []).map(staffVM)
  const timeline = s?.timeline?.length
    ? s.timeline.map((t) => ({ year: t.year, title: t.title, text: t.text || '' }))
    : PLACEHOLDER_TIMELINE
  const facts: [string, string][] = [
    ['Founded', supply(s?.foundingYear)],
    ['Home ground', supply(s?.homeGround)],
    ['City', supply(s?.city)],
  ]

  return (
    <div>
      <PageHero
        title="About the club"
        desc={`Who ${CLUB_NAME} are, what the club stands for, and the people behind it.`}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />
      <Sec>
        <div className="split rev">
          <Reveal>
            <Ph ratio="4/5" clip="lg" label="Club photo" image={imageOf(s?.storyImage, 'large')} />
          </Reveal>
          <div>
            <SectionHead eyebrow="Our story" title="Where we come from" />
            <p className="body-l" style={{ whiteSpace: 'pre-line' }}>
              {s?.clubStory || '[CLUB TO SUPPLY: club story, max 200 words.]'}
            </p>
            <div className="kfacts">
              {facts.map(([l, v], i) => (
                <Reveal i={i} key={l} className="kf">
                  <div className="fact-l">{l}</div>
                  <div className="fact-v">{v}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Sec>

      <Sec alt>
        <SectionHead eyebrow="Values" title="What we stand for" />
        <div className="grid-3">
          {values.map((v, i) => (
            <Reveal i={i} key={v.title + i} className="place">
              <Icon name={VALUE_ICONS[i % VALUE_ICONS.length]} size={24} color="var(--color-primary-ink)" />
              <h3 className="h4">{v.title}</h3>
              {v.text && <p>{v.text}</p>}
            </Reveal>
          ))}
        </div>
      </Sec>

      <Sec>
        <div className="badge-mean">
          <Reveal className="bm-badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/emblem-160.webp" alt={`${CLUB_NAME} badge`} width={160} height={160} />
          </Reveal>
          <div>
            <SectionHead eyebrow="The badge" title="Neon on black" />
            <p className="body-l">{s?.badgeMeaning || '[CLUB TO SUPPLY: meaning of the mascot and colours.]'}</p>
          </div>
        </div>
      </Sec>

      {(officials ?? []).length > 0 && (
        <Sec>
          <SectionHead eyebrow="Committee" title="Running the club" />
          <div className="grid-squad">
            {(officials ?? []).map((c, i) => (
              <Reveal i={i} key={c.id}>
                <PlayerCard variant="staff" name={c.name} position={c.role} photo={c.photo} />
              </Reveal>
            ))}
          </div>
        </Sec>
      )}

      {crew.length > 0 && (
        <Sec alt>
          <SectionHead eyebrow="Staff" title="Coaching and management" />
          <div className="grid-squad">
            {crew.map((c, i) => (
              <Reveal i={i} key={c.id}>
                <PlayerCard variant="staff" name={c.name} position={c.role} photo={c.photo} />
              </Reveal>
            ))}
          </div>
        </Sec>
      )}

      <Sec>
        <SectionHead eyebrow="History" title="Club timeline" />
        <Timeline entries={timeline} />
      </Sec>

      <JoinBand text={s?.joinCtaText} />
    </div>
  )
}
