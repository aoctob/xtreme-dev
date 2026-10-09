import type { Metadata } from 'next'
import { CalendarDays, IndianRupee, MapPin, Minus, Plus, Shirt, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { OrSupply, PageHero, Supply } from '@/components/Basics'
import { Form } from '@/components/forms/Form'
import { SocialIcon } from '@/components/SocialIcon'
import { formatKickoff } from '@/lib/format'
import { joinFields } from '@/lib/forms'
import { getJoinPage, getSiteSettings } from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Join the club / trials',
  description: 'Apply for Xtreme FC trials: who can join, trial dates, location, what to bring and the application form.',
  alternates: { canonical: '/join' },
}

function Fact({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li>
      {icon}
      <div>
        <h3>{title}</h3>
        <div style={{ whiteSpace: 'pre-line' }}>{children}</div>
      </div>
    </li>
  )
}

export default async function JoinPage() {
  const [join, settings] = await Promise.all([getJoinPage(), getSiteSettings()])
  const upcomingDates = (join?.trialDates ?? [])
    .filter((d) => new Date(d.start).getTime() > Date.now() - 86_400_000)
    .sort((a, b) => a.start.localeCompare(b.start))
  const dateLabels = upcomingDates.map((d) => `${formatKickoff(d.start)}${d.note ? ` (${d.note})` : ''}`)
  const contact = settings?.email || settings?.phone || 'the club'
  const whatsapp = settings?.whatsapp?.replace(/\D/g, '')

  return (
    <>
      <PageHero title="Join Xtreme FC" description="Trials, requirements and how to apply." />
      <section className="section">
        <div className="container split split--reverse split--top">
          <aside className="card clip" aria-labelledby="facts-title">
            <h2 id="facts-title" className="t-h3" style={{ marginBottom: 24 }}>
              Key facts
            </h2>
            <ul role="list" className="facts">
              <Fact icon={<Users size={24} aria-hidden="true" />} title="Who can join">
                <OrSupply value={join?.whoCanJoin || join?.ageGroups} what="age groups and levels" />
              </Fact>
              <Fact icon={<CalendarDays size={24} aria-hidden="true" />} title="Trial dates">
                {dateLabels.length ? (
                  <ul style={{ margin: 0, paddingLeft: '1.1em' }}>
                    {dateLabels.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                ) : (
                  <Supply what="trial dates and times" />
                )}
              </Fact>
              <Fact icon={<MapPin size={24} aria-hidden="true" />} title="Location">
                <OrSupply value={join?.trialLocation} what="trial location" />
                {join?.trialLocationMapUrl && (
                  <>
                    {' '}
                    <a href={join.trialLocationMapUrl} target="_blank" rel="noopener noreferrer">
                      Open in maps<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </>
                )}
              </Fact>
              <Fact icon={<Shirt size={24} aria-hidden="true" />} title="What to bring">
                <OrSupply value={join?.whatToBring} what="what to bring" />
              </Fact>
              <Fact icon={<IndianRupee size={24} aria-hidden="true" />} title="Fees">
                {join?.fees || 'Contact the club'}
              </Fact>
            </ul>
            {whatsapp && (
              <a
                className="btn btn--secondary"
                style={{ marginTop: 32, width: '100%' }}
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi Xtreme FC, I would like to know more about trials.')}`}
                target="_blank"
                rel="noopener noreferrer"
                data-social="whatsapp"
              >
                <SocialIcon network="whatsapp" size={20} /> WhatsApp the club
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </aside>

          <div className="form-wrap" id="apply">
            <h2 className="t-h3" style={{ marginBottom: 8 }}>
              Apply for trials
            </h2>
            <p className="t-small t-secondary" style={{ marginBottom: 24 }}>
              Applicants under 18 need a parent or guardian&apos;s name, phone number and consent.
            </p>
            <Form
              kind="join"
              fields={joinFields(dateLabels)}
              submitLabel="Submit application"
              successTitle="Application received"
              successSteps={[
                `The club will review the application and get in touch ${join?.responseTime || 'soon'}.`,
                'Watch your phone for a call or WhatsApp message from the club.',
                'Follow us on social media for trial updates.',
              ]}
              fallbackContact={contact}
              note="We use these details only to arrange trials. See the Privacy Policy for how long we keep them and how to ask us to delete them."
            />
          </div>
        </div>
      </section>

      {join?.faq && join.faq.length > 0 && (
        <section className="section section--alt" aria-labelledby="faq-title">
          <div className="container container--text">
            <h2 id="faq-title" className="t-h2" style={{ marginBottom: 32 }}>
              Questions
            </h2>
            <div className="faq">
              {join.faq.slice(0, 6).map((f) => (
                <details key={f.id ?? f.question}>
                  <summary>
                    {f.question}
                    <Plus className="faq__plus" size={24} aria-hidden="true" />
                    <Minus className="faq__minus" size={24} aria-hidden="true" />
                  </summary>
                  <div style={{ whiteSpace: 'pre-line' }}>{f.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
