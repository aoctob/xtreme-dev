'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { track } from '@/lib/analytics'
import { ENQUIRY_TYPES, EXPERIENCE_LEVELS, labelFor, PREFERRED_POSITIONS, SPONSOR_INTERESTS } from '@/lib/constants'
import { ageOf, isMinor, LIMITS } from '@/lib/validation'
import { Icon } from './Icon'
import {
  Consent,
  ErrorBanner,
  ErrorSummary,
  Honeypot,
  Progress,
  SelectField,
  SubmitBtn,
  Success,
  TextAreaField,
  TextField,
  useForm,
  type Option,
} from './formkit'
import { Button } from './ui'

const opts = (list: readonly Option[]): Option[] => list.map(({ label, value }) => ({ label, value }))
const today = () => new Date().toISOString().slice(0, 10)
const privacy = (
  <>
    I agree to the{' '}
    <Link href="/privacy" target="_blank">
      Privacy Policy
    </Link>
    .
  </>
)

type Shared = { contact: string; responseTime: string; instagram: string | null }

/* ================================== JOIN ================================== */

const JOIN_LABELS: Record<string, string> = {
  fullName: 'Full name',
  dateOfBirth: 'Date of birth',
  phone: 'Phone number',
  email: 'Email',
  guardianName: 'Parent/guardian name',
  guardianPhone: 'Parent/guardian phone',
  guardianConsent: 'Guardian consent',
  consent: 'Privacy Policy',
  message: 'Message',
}

export function JoinForm({ trialDates, contact, responseTime, instagram }: Shared & { trialDates: string[] }) {
  const trials: Option[] = [...trialDates.map((d) => ({ label: d, value: d })), { label: 'Not sure', value: 'Not sure' }]
  const f = useForm({
    kind: 'join',
    initial: {
      fullName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      preferredPosition: 'not-sure',
      experienceLevel: 'beginner',
      previousClub: '',
      preferredTrialDate: trials[0].value,
      message: '',
      guardianName: '',
      guardianPhone: '',
      guardianConsent: '',
      consent: '',
    },
    labels: JOIN_LABELS,
    startEvent: 'join_form_start',
    successEvent: 'join_submit_success',
    errorEvent: 'join_submit_error',
  })
  const age = ageOf(f.v.dateOfBirth)
  const minor = isMinor(f.v.dateOfBirth)
  const req = ['fullName', 'dateOfBirth', 'phone', ...(minor ? ['guardianName', 'guardianPhone', 'guardianConsent'] : []), 'consent']
  const first = f.v.fullName.trim().split(' ')[0]

  return (
    <div className="form-box" ref={f.boxRef}>
      {f.status === 'success' ? (
        <Success
          title="Application received"
          steps={[
            'The club reviews your application.',
            'We call to confirm your trial date' + (f.v.preferredTrialDate !== 'Not sure' ? ` (${f.v.preferredTrialDate})` : '') + '.',
            'Come to the trial with the kit listed in Key facts.',
          ]}
          actions={
            <>
              {instagram && (
                <Button icon="arrow-up-right" href={instagram} external data-social="instagram">
                  Follow on Instagram
                </Button>
              )}
              <Button variant="secondary" href="/results">
                View fixtures
              </Button>
            </>
          }
        >
          <p>
            Thanks{first ? ', ' + first : ''}. We will be in touch {responseTime}.
          </p>
          {minor && (
            <p>
              Because the applicant is under 18, the club will contact the parent or guardian, <strong>{f.v.guardianName}</strong>, on{' '}
              <span className="tnum">{f.v.guardianPhone}</span>.
            </p>
          )}
        </Success>
      ) : (
        <form noValidate onSubmit={f.submit} className="form">
          <div className="form-h">
            <h2 className="h3">Apply for trials</h2>
            <Progress f={f} keys={req} />
          </div>
          <ErrorSummary f={f} />
          <ErrorBanner f={f} what="application" contact={contact} />
          <TextField f={f} k="fullName" label="Full name" required autoComplete="name" maxLength={LIMITS.name} />
          <div className="frow">
            <TextField f={f} k="dateOfBirth" label="Date of birth" type="date" required autoComplete="bday" max={today()} />
            <TextField f={f} k="phone" label="Phone number" type="tel" required placeholder="98765 43210" autoComplete="tel" inputMode="tel" />
          </div>
          <div className={'reveal-rows' + (minor ? ' o' : '')} aria-hidden={!minor}>
            <div>
              <div className="guardian">
                <div className="guardian-h">
                  <Icon name="shield" size={20} color="var(--color-primary-ink)" />
                  <span>The applicant is {age} — a parent or guardian must complete this section.</span>
                </div>
                <div className="frow">
                  <TextField f={f} k="guardianName" label="Parent/guardian name" required autoComplete="off" />
                  <TextField f={f} k="guardianPhone" label="Parent/guardian phone" type="tel" required inputMode="tel" />
                </div>
                <Consent
                  f={f}
                  k="guardianConsent"
                  label="I am the parent or guardian and I consent to the club using these details as described in the Privacy Policy."
                />
              </div>
            </div>
          </div>
          <TextField f={f} k="email" label="Email" type="email" help="Optional" autoComplete="email" inputMode="email" />
          <div className="frow">
            <SelectField f={f} k="preferredPosition" label="Preferred position" options={opts(PREFERRED_POSITIONS)} />
            <SelectField f={f} k="experienceLevel" label="Experience level" options={opts(EXPERIENCE_LEVELS)} />
          </div>
          <div className="frow">
            <TextField f={f} k="previousClub" label="Previous club" help="Optional" maxLength={LIMITS.short} />
            <SelectField f={f} k="preferredTrialDate" label="Preferred trial date" options={trials} />
          </div>
          <TextAreaField f={f} k="message" label="Message" help="Optional" maxLength={LIMITS.joinMessage} />
          <Honeypot />
          <Consent f={f} k="consent" label={privacy} />
          <SubmitBtn f={f}>Submit application</SubmitBtn>
          <p className="caption">
            We use these details only to arrange your trial. See the <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </form>
      )}
    </div>
  )
}

/* ================================ SPONSORS ================================ */

/** "Enquire about this" on a placement card: pre-selects the interest and scrolls to the form. */
export function PlacementButton({ title }: { title: string }) {
  return (
    <Button
      variant="tertiary"
      icon="arrow-right"
      onClick={() => window.dispatchEvent(new CustomEvent('xfc:interest', { detail: title }))}
    >
      Enquire about this
    </Button>
  )
}

const interestFor = (title: string) =>
  SPONSOR_INTERESTS.find((o) => o.label.toLowerCase() === title.toLowerCase() || title.toLowerCase().startsWith(o.label.split(' ')[0].toLowerCase()))
    ?.value ?? 'other'

export function SponsorForm({ contact, responseTime }: Omit<Shared, 'instagram'>) {
  const f = useForm({
    kind: 'sponsor',
    initial: { name: '', businessName: '', phone: '', email: '', interest: 'shirt', message: '', consent: '' },
    labels: { name: 'Name', businessName: 'Business name', phone: 'Phone', email: 'Email', consent: 'Privacy Policy' },
    successEvent: 'sponsor_enquiry_success',
    errorEvent: 'sponsor_enquiry_error',
  })
  const { setValue } = f
  useEffect(() => {
    const on = (e: Event) => {
      setValue('interest', interestFor(String((e as CustomEvent).detail)))
      const el = document.getElementById('enquiry')
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' })
    }
    window.addEventListener('xfc:interest', on)
    return () => window.removeEventListener('xfc:interest', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="form-box" ref={f.boxRef}>
      {f.status === 'success' ? (
        <Success
          title="Enquiry sent"
          steps={['The club reads your enquiry.', 'We contact you to talk through options.']}
          actions={
            <Button variant="secondary" onClick={() => f.reset()}>
              Send another enquiry
            </Button>
          }
        >
          <p>
            Thanks, {f.v.name.split(' ')[0]}. We will reply about <strong>{labelFor(SPONSOR_INTERESTS, f.v.interest).toLowerCase()}</strong>{' '}
            {responseTime}.
          </p>
        </Success>
      ) : (
        <form noValidate onSubmit={f.submit} className="form">
          <ErrorSummary f={f} />
          <ErrorBanner f={f} what="enquiry" contact={contact} />
          <div className="frow">
            <TextField f={f} k="name" label="Name" required autoComplete="name" maxLength={LIMITS.name} />
            <TextField f={f} k="businessName" label="Business name" required autoComplete="organization" maxLength={LIMITS.short} />
          </div>
          <div className="frow">
            <TextField f={f} k="phone" label="Phone" type="tel" required autoComplete="tel" inputMode="tel" />
            <TextField f={f} k="email" label="Email" type="email" help="Optional" autoComplete="email" inputMode="email" />
          </div>
          <SelectField f={f} k="interest" label="Interest" options={opts(SPONSOR_INTERESTS)} />
          <TextAreaField f={f} k="message" label="Message" help="Optional" maxLength={LIMITS.sponsorMessage} />
          <Honeypot />
          <Consent f={f} k="consent" label={privacy} />
          <SubmitBtn f={f}>Send enquiry</SubmitBtn>
        </form>
      )}
    </div>
  )
}

/* ================================= CONTACT ================================ */

const TYPE_QUERY: Record<string, string> = { general: 'general', match: 'match', sponsorship: 'sponsor', sponsor: 'sponsor', media: 'media' }

export function ContactForm({ contact, responseTime }: Omit<Shared, 'instagram'>) {
  const params = useSearchParams()
  const f = useForm({
    kind: 'contact',
    initial: { type: TYPE_QUERY[params.get('type') ?? ''] ?? 'general', name: '', email: '', phone: '', message: '' },
    labels: { name: 'Name', email: 'Email or phone', phone: 'Phone', message: 'Message', type: 'Enquiry type' },
    successEvent: 'contact_success',
    errorEvent: 'contact_error',
  })
  const typeLabel = labelFor(ENQUIRY_TYPES, f.v.type)
  return (
    <div className="form-box" ref={f.boxRef}>
      {f.status === 'success' ? (
        <Success
          title="Message sent"
          actions={
            <>
              {f.v.type === 'match' && (
                <Button icon="arrow-right" href="/results">
                  See recent results
                </Button>
              )}
              <Button variant="secondary" onClick={() => f.reset()}>
                Send another message
              </Button>
            </>
          }
        >
          <p>
            Thanks, {f.v.name.split(' ')[0]}. Your <strong>{typeLabel.toLowerCase()}</strong> enquiry is with the club. We reply to{' '}
            {f.v.email || f.v.phone} {responseTime}.
          </p>
        </Success>
      ) : (
        <form noValidate onSubmit={f.submit} className="form">
          <h2 className="h3">Send a message</h2>
          <ErrorSummary f={f} />
          <ErrorBanner f={f} what="message" contact={contact} />
          <div onChange={(e) => (e.target as HTMLElement).tagName === 'SELECT' && track('contact_type_change', { type: (e.target as unknown as HTMLSelectElement).value })}>
            <SelectField f={f} k="type" label="Enquiry type" options={opts(ENQUIRY_TYPES)} />
          </div>
          <TextField f={f} k="name" label="Name" required autoComplete="name" maxLength={LIMITS.name} />
          <p className="caption" style={{ margin: 0 }}>
            Give at least one way to reply.
          </p>
          <div className="frow">
            <TextField f={f} k="email" label="Email" type="email" autoComplete="email" inputMode="email" />
            <TextField f={f} k="phone" label="Phone" type="tel" autoComplete="tel" inputMode="tel" />
          </div>
          <TextAreaField f={f} k="message" label="Message" required maxLength={LIMITS.contactMessage} />
          <Honeypot />
          <SubmitBtn f={f}>Send message</SubmitBtn>
        </form>
      )}
    </div>
  )
}
