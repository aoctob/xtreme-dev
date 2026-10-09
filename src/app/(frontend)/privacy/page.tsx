import type { Metadata } from 'next'
import { PageHero } from '@/components/kit/ui'
import { PrivacyToc } from '@/components/kit/widgets'
import { CLUB_NAME } from '@/lib/constants'
import { formatLongDate } from '@/lib/format'
import { getSiteSettings } from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: `How ${CLUB_NAME} collects, uses and protects personal data, including data about children.`,
  alternates: { canonical: '/privacy' },
}

/**
 * Plain-language policy (kit-media.jsx Privacy, PRD §D.14). Must be reviewed by a lawyer
 * against India's Digital Personal Data Protection Act, 2023 before launch.
 */
export default async function PrivacyPage() {
  const s = await getSiteSettings()
  const sections: { id: string; title: string; text: string }[] = [
    {
      id: 'what',
      title: 'What we collect',
      text:
        'The details you enter in our forms: name, date of birth, phone number, email and your message. For applicants under 18, the parent or guardian’s name and phone number. Player registration also asks for a home address, an emergency contact, optional medical notes and an optional photo. We also count page visits without cookies.',
    },
    {
      id: 'why',
      title: 'Why we collect it',
      text: 'To arrange trials, register players, answer enquiries and run the club. We do not sell your data or use it for advertising.',
    },
    {
      id: 'who',
      title: 'Who sees it',
      text:
        'Only named club staff [CLUB TO SUPPLY: roles] with an admin account. Medical and emergency details are shared only with coaches and first-aid staff. Our hosting and email providers process the data on our behalf.',
    },
    {
      id: 'keep',
      title: 'How long we keep it',
      text: s?.retentionPeriod ? `We keep form submissions for ${s.retentionPeriod}, then delete them.` : '[CLUB TO DECIDE: retention period.]',
    },
    {
      id: 'children',
      title: 'Children’s data',
      text:
        'We collect the minimum needed for applicants under 18, require a parent or guardian’s consent, and contact the guardian rather than the child. We never publish a minor’s contact details, school or home area.',
    },
    {
      id: 'rights',
      title: 'Your rights',
      text: 'You can ask to see, correct or delete your data at any time. We reply within [CLUB TO DECIDE] days.',
    },
    {
      id: 'contact',
      title: 'Contact for privacy requests',
      text: s?.privacyContact || s?.email || '[CLUB TO SUPPLY: email for privacy requests.]',
    },
  ]
  const desc =
    'Draft for legal review under India’s Digital Personal Data Protection Act, 2023.' +
    (s?.privacyLastUpdated ? ` Last updated ${formatLongDate(s.privacyLastUpdated)}.` : '')

  return (
    <div>
      <PageHero title="Privacy policy" desc={desc} crumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]} />
      <section className="sec">
        <div className="wrap priv">
          <div className="priv-body">
            {sections.map(({ id, title, text }) => (
              <section key={id} id={'pv-' + id} className="priv-s">
                <h2 className="h3">{title}</h2>
                <p>{text}</p>
              </section>
            ))}
          </div>
          <PrivacyToc sections={sections.map(({ id, title }) => ({ id, title }))} />
        </div>
      </section>
    </div>
  )
}
