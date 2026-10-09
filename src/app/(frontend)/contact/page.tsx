import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ContactForm } from '@/components/kit/forms'
import { Icon, type IconName } from '@/components/kit/Icon'
import { Reveal } from '@/components/kit/motion'
import { Button, PageHero, Ph } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { getJoinPage, getSiteSettings } from '@/lib/queries'
import { contactLine, responseTime, socialUrl } from '@/lib/site'
import { imageOf, supply } from '@/lib/view'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact ${CLUB_NAME} about match requests, media, sponsorship and general questions.`,
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const [s, join] = await Promise.all([getSiteSettings(), getJoinPage()])
  const instagram = socialUrl(s, 'instagram')
  const details: [IconName, string, string][] = [
    ['mail', 'Email', supply(s?.email, 'email')],
    ['phone', 'Phone / WhatsApp', supply(s?.phone, 'phone')],
    ['map-pin', 'Ground', supply(s?.address, 'address')],
  ]
  return (
    <div>
      <PageHero
        title="Contact"
        desc="Match requests, media, sponsorship and general questions."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />
      <section className="sec">
        <div className="wrap contact-grid">
          <aside className="contact-side">
            <Reveal className="facts-card">
              {details.map(([ic, l, v], i) => (
                <Reveal i={i} key={l} className="fact">
                  <Icon name={ic} size={24} color="var(--color-primary-ink)" />
                  <div>
                    <div className="fact-l">{l}</div>
                    <div className="fact-v" style={{ whiteSpace: 'pre-line' }}>
                      {l === 'Email' && s?.email ? <a href={`mailto:${s.email}`}>{v}</a> : l.startsWith('Phone') && s?.phone ? <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{v}</a> : v}
                    </div>
                  </div>
                </Reveal>
              ))}
              <Ph ratio="16/9" clip="card" label="Static map image" image={imageOf(s?.mapImage, 'card')} sizes="(min-width:1024px) 400px, 100vw" />
              <div className="btnrow">
                {s?.mapUrl && (
                  <Button variant="tertiary" icon="arrow-up-right" href={s.mapUrl} external>
                    Open in maps
                  </Button>
                )}
                {instagram && (
                  <Button variant="tertiary" icon="arrow-up-right" href={instagram} external data-social="instagram">
                    Instagram
                  </Button>
                )}
                {s?.whatsapp && (
                  <Button variant="tertiary" icon="arrow-up-right" href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} external data-social="whatsapp">
                    WhatsApp
                  </Button>
                )}
              </div>
            </Reveal>
          </aside>
          <Suspense>
            <ContactForm contact={contactLine(s)} responseTime={responseTime(join)} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
