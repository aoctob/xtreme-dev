import type { Metadata } from 'next'
import { OrSupply, PageHero } from '@/components/Basics'
import { formatLongDate } from '@/lib/format'
import { getSiteSettings } from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Xtreme FC collects, uses and protects personal data, including data about children.',
  alternates: { canonical: '/privacy' },
}

const SECTIONS = [
  { id: 'what', title: 'What we collect' },
  { id: 'why', title: 'Why we collect it' },
  { id: 'who', title: 'Who sees it' },
  { id: 'keep', title: 'How long we keep it' },
  { id: 'children', title: "Children's data" },
  { id: 'rights', title: 'Your rights and deletion' },
  { id: 'analytics', title: 'Analytics and cookies' },
  { id: 'contact', title: 'Contact for privacy requests' },
]

/**
 * Plain-language policy skeleton (PRD §D.14). Must be reviewed by a lawyer against
 * India's Digital Personal Data Protection Act, 2023 before launch.
 */
export default async function PrivacyPage() {
  const s = await getSiteSettings()
  return (
    <>
      <PageHero
        title="Privacy policy"
        description={
          s?.privacyLastUpdated ? `Last updated ${formatLongDate(s.privacyLastUpdated)}.` : undefined
        }
      />
      <section className="section">
        <div className="container container--text prose">
          <p className="placeholder" role="note">
            Draft for legal review. This page must be reviewed against India&apos;s Digital Personal Data
            Protection Act, 2023 before the site launches.
          </p>
          <nav aria-label="On this page">
            <ul>
              {SECTIONS.map((x) => (
                <li key={x.id}>
                  <a href={`#${x.id}`}>{x.title}</a>
                </li>
              ))}
            </ul>
          </nav>

          <h2 id="what">What we collect</h2>
          <p>
            When you use a form on this site we collect only what the form asks for. The trial
            application asks for your name, date of birth, phone number, and optionally your email,
            position, experience, previous club and a message. For applicants under 18 we also ask for
            a parent or guardian&apos;s name and phone number. The contact and sponsorship forms ask for
            your name, how to reach you, and your message.
          </p>
          <p>
            To protect the forms from abuse we store a scrambled (hashed) version of your connection&apos;s
            IP address for up to 24 hours. We cannot turn it back into the IP address.
          </p>

          <h2 id="why">Why we collect it</h2>
          <p>
            We use your details only to reply to you, arrange trials, and manage the club. We do not sell
            your data or use it for advertising.
          </p>

          <h2 id="who">Who sees it</h2>
          <p>
            Only named club staff with an admin account can see form submissions. Submissions are stored
            in an encrypted database (Neon Postgres) and are never published on the website. A
            notification email is sent to the club inbox when a form is submitted.
          </p>

          <h2 id="keep">How long we keep it</h2>
          <p>
            We keep form submissions for <OrSupply value={s?.retentionPeriod} what="retention period (club to decide)" />,
            then delete them.
          </p>

          <h2 id="children">Children&apos;s data</h2>
          <p>
            For applicants under 18 we need a parent or guardian&apos;s consent, and the club contacts the
            parent or guardian rather than the child. We never publish a minor&apos;s contact details, school
            or home area. Photos of players under 18 are published only with written consent from a parent
            or guardian, held by the club.
          </p>

          <h2 id="rights">Your rights and deletion</h2>
          <p>
            You can ask to see, correct or delete the personal data we hold about you. Contact us using
            the details below and we will act on your request. Deleting a record removes it from our
            database.
          </p>

          <h2 id="analytics">Analytics and cookies</h2>
          <p>
            We measure visits with privacy-friendly analytics that do not use cookies and do not collect
            names, phone numbers or email addresses. The site does not use advertising trackers.
          </p>

          <h2 id="contact">Contact for privacy requests</h2>
          <p>
            <OrSupply value={s?.privacyContact || s?.email} what="privacy contact email or phone" />
          </p>
        </div>
      </section>
    </>
  )
}
