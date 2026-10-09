import type { Metadata } from 'next'
import { OrSupply, PageHero, SectionHead } from '@/components/Basics'
import { Form } from '@/components/forms/Form'
import { SponsorGrid } from '@/components/Sponsors'
import { sponsorFields } from '@/lib/forms'
import { getSiteSettings, getSponsors } from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Sponsors & partners',
  description: 'Partner with Xtreme FC: sponsorship options and an enquiry form for local businesses.',
  alternates: { canonical: '/sponsors' },
}

export default async function SponsorsPage() {
  const [settings, sponsors] = await Promise.all([getSiteSettings(), getSponsors()])
  const options = settings?.placementOptions ?? []

  return (
    <>
      <PageHero title="Sponsors & partners" description="Back the club and get your business seen." />

      <section className="section" aria-labelledby="why-title">
        <div className="container">
          <SectionHead eyebrow="Partnership" title="Why partner with Xtreme FC" id="why-title" />
          <p className="t-lead measure" style={{ whiteSpace: 'pre-line' }}>
            <OrSupply value={settings?.sponsorPitch} what="why partner with the club (verifiable facts only)" />
          </p>
        </div>
      </section>

      {options.length > 0 && (
        <section className="section section--alt" aria-labelledby="options-title">
          <div className="container">
            <SectionHead eyebrow="Options" title="Ways to support" id="options-title" />
            <ul role="list" className="grid-3">
              {options.map((o) => (
                <li key={o.id ?? o.title} className="card clip">
                  <h3 className="t-h4" style={{ marginBottom: 8 }}>
                    {o.title}
                  </h3>
                  {o.text && <p className="t-small t-secondary">{o.text}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {sponsors && sponsors.length > 0 && (
        <section className="section" aria-labelledby="partners-title">
          <div className="container">
            <SectionHead eyebrow="Thank you" title="Current partners" id="partners-title" />
            <SponsorGrid sponsors={sponsors} />
          </div>
        </section>
      )}

      <section className="section section--alt" aria-labelledby="enquiry-title">
        <div className="container container--text">
          <SectionHead eyebrow="Get in touch" title="Sponsorship enquiry" id="enquiry-title" />
          <div className="form-wrap" style={{ background: 'var(--color-surface-raised)' }}>
            <Form
              kind="sponsor"
              fields={sponsorFields}
              submitLabel="Send enquiry"
              successTitle="Enquiry sent"
              successSteps={['Someone from the club will contact you to talk about partnership options.']}
              fallbackContact={settings?.email || settings?.phone || 'the club'}
            />
          </div>
        </div>
      </section>
    </>
  )
}
