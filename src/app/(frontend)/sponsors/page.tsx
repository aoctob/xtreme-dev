import type { Metadata } from 'next'
import { PlacementButton, SponsorForm } from '@/components/kit/forms'
import { Icon, type IconName } from '@/components/kit/Icon'
import { Reveal } from '@/components/kit/motion'
import { PageHero, Sec, SectionHead, SponsorLogo } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { getJoinPage, getSiteSettings, getSponsors } from '@/lib/queries'
import { contactLine, responseTime } from '@/lib/site'
import { sponsorVM } from '@/lib/view'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Sponsors and partners',
  description: `Partner with ${CLUB_NAME}: placement options and a partnership enquiry form for local businesses.`,
  alternates: { canonical: '/sponsors' },
}

const DEFAULT_PLACEMENTS = ['Shirt sponsor', 'Kit sponsor', 'Event sponsor', 'Equipment']
const PLACEMENT_ICONS: IconName[] = ['shirt', 'layers', 'flag', 'package', 'tag']

export default async function SponsorsPage() {
  const [s, sponsors, join] = await Promise.all([getSiteSettings(), getSponsors(), getJoinPage()])
  const reasons = s?.partnerReasons?.length
    ? s.partnerReasons.map((r) => r.text)
    : Array.from({ length: 3 }, () => '[CLUB TO SUPPLY: verifiable audience fact. Do not publish numbers that cannot be verified.]')
  const placements = s?.placementOptions?.length
    ? s.placementOptions.map((p) => ({ title: p.title, text: p.text || '' }))
    : DEFAULT_PLACEMENTS.map((title) => ({ title, text: '[CLUB TO SUPPLY: what’s included]' }))
  const partners = (sponsors ?? []).map(sponsorVM)

  return (
    <div>
      <PageHero
        title="Sponsors and partners"
        desc="Put your business in front of the club’s players and supporters."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Sponsors' }]}
      />
      <Sec>
        <SectionHead eyebrow="Why partner" title={`Why partner with ${CLUB_NAME}`} />
        {s?.sponsorPitch && (
          <p className="body-l" style={{ marginTop: -8 }}>
            {s.sponsorPitch}
          </p>
        )}
        <div className="why">
          {reasons.map((t, i) => (
            <Reveal i={i + 1} key={i} className="why-i">
              <span className="why-n">0{i + 1}</span>
              <p>{t}</p>
            </Reveal>
          ))}
        </div>
      </Sec>

      <Sec alt>
        <SectionHead eyebrow="Placement options" title="Ways to back the club" />
        <div className="grid-4">
          {placements.map((p, i) => (
            <Reveal i={i} key={p.title + i} className="place">
              <Icon name={PLACEMENT_ICONS[i % PLACEMENT_ICONS.length]} size={24} color="var(--color-primary-ink)" />
              <h3 className="h4">{p.title}</h3>
              <p>{p.text}</p>
              <PlacementButton title={p.title} />
            </Reveal>
          ))}
        </div>
      </Sec>

      {partners.length > 0 && (
        <Sec>
          <SectionHead eyebrow="Current partners" title="Thank you to our partners" />
          <div className="grid-4">
            {partners.map((p, i) => (
              <Reveal i={i} key={p.id}>
                <SponsorLogo s={p} />
              </Reveal>
            ))}
          </div>
        </Sec>
      )}

      <section
        id="enquiry"
        className="sec"
        style={{ background: partners.length ? 'var(--color-surface)' : 'var(--color-background)' }}
      >
        <div className="wrap" style={{ maxWidth: 820 }}>
          <SectionHead eyebrow="Enquiry" title="Send a partnership enquiry" />
          <SponsorForm contact={contactLine(s)} responseTime={responseTime(join)} />
        </div>
      </section>
    </div>
  )
}
