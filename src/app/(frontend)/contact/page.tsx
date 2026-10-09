import type { Metadata } from 'next'
import { Mail, MapPin, Phone } from 'lucide-react'
import { MediaImage, OrSupply, PageHero } from '@/components/Basics'
import { Form } from '@/components/forms/Form'
import { SocialIcon } from '@/components/SocialIcon'
import { labelFor, SOCIAL_NETWORKS } from '@/lib/constants'
import { contactFields } from '@/lib/forms'
import { asMedia } from '@/lib/media'
import { getSiteSettings } from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Xtreme FC about matches, tournaments, sponsorship, media or anything else.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const settings = await getSiteSettings()
  const mapImage = asMedia(settings?.mapImage)
  const whatsapp = settings?.whatsapp?.replace(/\D/g, '')

  return (
    <>
      <PageHero title="Contact" description="Match requests, sponsorship, media or general questions." />
      <section className="section">
        <div className="container split split--top">
          <div className="form-wrap contact-form">
            <h2 className="t-h3" style={{ marginBottom: 24 }}>
              Send a message
            </h2>
            <Form
              kind="contact"
              fields={contactFields}
              submitLabel="Send message"
              successTitle="Message sent"
              successSteps={['The club will reply using the email or phone number you gave.']}
              fallbackContact={settings?.email || settings?.phone || 'the club'}
            />
          </div>
          <aside className="card clip contact-details" aria-labelledby="details-title">
            <h2 id="details-title" className="t-h3" style={{ marginBottom: 24 }}>
              Club details
            </h2>
            <ul role="list" className="contact-list">
              <li>
                <Mail size={24} aria-hidden="true" />
                <div>
                  {settings?.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : <OrSupply what="club email" />}
                </div>
              </li>
              <li>
                <Phone size={24} aria-hidden="true" />
                <div>
                  {settings?.phone ? (
                    <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
                  ) : (
                    <OrSupply what="phone / WhatsApp" />
                  )}
                  {whatsapp && (
                    <div>
                      <a className="link" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" data-social="whatsapp">
                        WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </div>
                  )}
                </div>
              </li>
              <li>
                <MapPin size={24} aria-hidden="true" />
                <div>
                  <div style={{ whiteSpace: 'pre-line' }}>
                    <OrSupply value={settings?.address} what="ground address" />
                  </div>
                  {settings?.mapUrl && (
                    <a className="link" href={settings.mapUrl} target="_blank" rel="noopener noreferrer">
                      Open in maps<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                </div>
              </li>
            </ul>
            {mapImage && (
              <div className="map-image clip">
                <MediaImage media={mapImage} sizes="(min-width: 1024px) 40vw, 100vw" />
              </div>
            )}
            {settings?.socials && settings.socials.length > 0 && (
              <ul role="list" className="social-list" style={{ marginTop: 24 }}>
                {settings.socials.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" data-social={s.network}>
                      <SocialIcon network={s.network} />
                      <span className="sr-only">{labelFor(SOCIAL_NETWORKS, s.network)} (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </section>
    </>
  )
}
