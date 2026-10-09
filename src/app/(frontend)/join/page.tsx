import type { Metadata } from 'next'
import { JoinForm } from '@/components/kit/forms'
import { Icon, type IconName } from '@/components/kit/Icon'
import { Reveal } from '@/components/kit/motion'
import { Accordion } from '@/components/kit/widgets'
import { Button, PageHero, Sec, SectionHead } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import { getJoinPage, getSiteSettings } from '@/lib/queries'
import { contactLine, responseTime, socialUrl } from '@/lib/site'
import { supply } from '@/lib/view'

export const revalidate = 600

export const metadata: Metadata = {
  title: { absolute: `Join ${CLUB_NAME} | Trials and application` },
  description: `Apply for ${CLUB_NAME} trials: trial dates, location, age groups, fees, what to bring and the application form.`,
  alternates: { canonical: '/join' },
}

export default async function JoinPage() {
  const [j, s] = await Promise.all([getJoinPage(), getSiteSettings()])
  const upcoming = (j?.trialDates ?? []).filter((t) => new Date(t.start).getTime() > Date.now() - 864e5)
  const trialDates = upcoming.map((t) => formatDateTime(t.start) + (t.note ? ` (${t.note})` : ''))
  const rt = responseTime(j)
  const faq = j?.faq?.length
    ? j.faq.map((x) => ({ q: x.question, a: x.answer }))
    : [
        { q: 'Who can join?', a: j?.whoCanJoin || '[CLUB TO SUPPLY: age groups and playing levels.]' },
        { q: 'I have never played for a club. Can I still apply?', a: 'Yes. Choose “Beginner” as your experience level on the form.' },
        {
          q: 'Do under-18s need a parent or guardian?',
          a: 'Yes. If you are under 18, a parent or guardian adds their name and mobile number and gives consent. The club contacts the guardian, not the player.',
        },
        { q: 'What should I bring to a trial?', a: j?.whatToBring || '[CLUB TO SUPPLY]' },
        { q: 'How much does it cost?', a: j?.fees || 'Contact the club.' },
        { q: 'How will I hear back?', a: `The club calls or messages the number on your application ${rt}.` },
      ]
  const facts: [IconName, string, string][] = [
    ['calendar', 'Trial dates', trialDates.length ? trialDates.join(' · ') : '[CLUB TO SUPPLY]'],
    ['map-pin', 'Location', supply(j?.trialLocation)],
    ['users', 'Age groups', supply(j?.ageGroups)],
    ['tag', 'Fees', j?.fees || 'Contact the club'],
    ['shirt', 'What to bring', supply(j?.whatToBring)],
  ]

  return (
    <div>
      <PageHero
        title={`Join ${CLUB_NAME}`}
        desc="Trials, requirements and the application form in one place."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Join' }]}
      />
      <section className="sec">
        <div className="wrap join-grid">
          <aside className="facts">
            <Reveal className="facts-card">
              <div className="eyebrow">Key facts</div>
              {facts.map(([ic, l, v], i) => (
                <Reveal i={i + 1} key={l} className="fact">
                  <Icon name={ic} size={24} color="var(--color-primary-ink)" />
                  <div>
                    <div className="fact-l">{l}</div>
                    <div className="fact-v" style={{ whiteSpace: 'pre-line' }}>
                      {l === 'Location' && j?.trialLocationMapUrl ? (
                        <a href={j.trialLocationMapUrl} target="_blank" rel="noopener noreferrer">
                          {v}
                        </a>
                      ) : (
                        v
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
              <div className="facts-wa">
                <span className="fact-l">Already in the squad?</span>
                <Button variant="tertiary" icon="arrow-right" href="/register">
                  Register as a player
                </Button>
              </div>
              {s?.whatsapp && (
                <div className="facts-wa">
                  <Button
                    variant="tertiary"
                    icon="arrow-up-right"
                    href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${CLUB_NAME}, I would like to know more about trials.`)}`}
                    external
                    data-social="whatsapp"
                  >
                    WhatsApp the club
                  </Button>
                </div>
              )}
            </Reveal>
          </aside>
          <JoinForm trialDates={trialDates} contact={contactLine(s)} responseTime={rt} instagram={socialUrl(s, 'instagram')} />
        </div>
      </section>
      <Sec alt>
        <SectionHead eyebrow="FAQ" title="Before you apply" />
        <div style={{ maxWidth: 820 }}>
          <Accordion items={faq} />
        </div>
      </Sec>
    </div>
  )
}
