'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { COMMITTEE_ROLES, FEET, labelFor, PREFERRED_POSITIONS, TEAMS } from '@/lib/constants'
import { ageOf, isMinor, LIMITS, PHOTO_MAX_BYTES, PHOTO_TYPES } from '@/lib/validation'
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
  type Form,
  type Option,
} from './formkit'
import { Reveal } from './motion'
import { Button } from './ui'

const LABELS: Record<string, string> = {
  regName: 'Your name',
  regRole: 'Your role',
  regPhone: 'Your phone',
  fullName: 'Player full name',
  dateOfBirth: 'Date of birth',
  phone: 'Player phone',
  email: 'Player email',
  address: 'Home address',
  photo: 'Player photo',
  guardianName: 'Parent/guardian name',
  guardianPhone: 'Parent/guardian phone',
  guardianConsent: 'Guardian consent',
  emergencyName: 'Emergency contact name',
  emergencyRelationship: 'Relationship',
  emergencyPhone: 'Emergency contact phone',
  shirtNumber: 'Shirt number',
  confirm: 'Committee confirmation',
  consent: 'Privacy Policy',
}

const opts = (list: readonly Option[]): Option[] => list.map(({ label, value }) => ({ label, value }))
const POSITION_OPTS = opts(PREFERRED_POSITIONS)
const SECOND_OPTS: Option[] = [{ label: 'None', value: 'none' }, ...POSITION_OPTS.filter((p) => p.value !== 'not-sure')]

const BLANK = {
  fullName: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  guardianName: '',
  guardianPhone: '',
  guardianConsent: '',
  team: 'unassigned',
  position: 'not-sure',
  secondPosition: 'none',
  foot: 'right',
  shirtNumber: '',
  previousClub: '',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  medical: '',
  confirm: '',
  consent: '',
}
const INITIAL = { mode: 'player', regName: '', regRole: 'secretary', regPhone: '', ...BLANK }

function Part({ n, title, desc, children }: { n: number; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rpart">
      <legend className="rpart-h">
        <span className="rpart-n tnum">{String(n).padStart(2, '0')}</span>
        <span>{title}</span>
      </legend>
      {desc && (
        <p className="caption" style={{ margin: '-8px 0 0' }}>
          {desc}
        </p>
      )}
      {children}
    </fieldset>
  )
}

function PhotoDrop({ f }: { f: Form }) {
  const ref = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [problem, setProblem] = useState('')
  const p = f.file
  useEffect(() => {
    if (!p) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(p)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [p])
  const take = (file?: File | null) => {
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type)) return setProblem('Use a JPG, PNG or WebP image')
    if (file.size > PHOTO_MAX_BYTES) return setProblem('Use an image under 4 MB')
    setProblem('')
    f.setFile(file)
  }
  const e = problem || f.err('photo')
  return (
    <div className="fld">
      <span className="lbl-t">Player photo</span>
      <span className="lbl-h">Optional. Head and shoulders, plain background. Used on the squad page only if the player agrees.</span>
      <div
        id="f-photo"
        className={'pdrop' + (over ? ' over' : '') + (p ? ' has' : '')}
        role="button"
        tabIndex={0}
        aria-label={p ? `Photo selected: ${p.name}. Click to replace` : 'Add a player photo'}
        onClick={() => ref.current?.click()}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault()
            ref.current?.click()
          }
        }}
        onDragOver={(ev) => {
          ev.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(ev) => {
          ev.preventDefault()
          setOver(false)
          take(ev.dataTransfer.files[0])
        }}
      >
        {p && preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="pdrop-img" />
            <span className="pdrop-t">
              <span>{p.name}</span>
              <span className="caption">Click to replace</span>
            </span>
            <button
              type="button"
              className="fb-x"
              aria-label="Remove photo"
              onClick={(ev) => {
                ev.stopPropagation()
                f.setFile(null)
                if (ref.current) ref.current.value = ''
              }}
            >
              <Icon name="x" size={18} />
            </button>
          </>
        ) : (
          <>
            <span className="pdrop-ic">
              <Icon name="upload" size={24} color="var(--color-primary-ink)" />
            </span>
            <span className="pdrop-t">
              <span>Drop a photo or browse</span>
              <span className="caption">JPG or PNG, up to 4 MB</span>
            </span>
          </>
        )}
        <input ref={ref} type="file" accept={PHOTO_TYPES.join(',')} hidden onChange={(ev) => take(ev.target.files?.[0])} />
      </div>
      {e && (
        <span className="ferr">
          <Icon name="alert-circle" size={16} />
          {e}
        </span>
      )}
    </div>
  )
}

/** Season registration, for the player or a committee member (kit-register.jsx). */
export function RegisterForm({ contact, responseTime, instagram }: { contact: string; responseTime: string; instagram: string | null }) {
  const [count, setCount] = useState(0)
  const f = useForm({
    kind: 'register',
    initial: INITIAL,
    labels: LABELS,
    startEvent: 'register_form_start',
    successEvent: 'register_submit_success',
    errorEvent: 'register_submit_error',
  })
  const cm = f.v.mode === 'committee'
  const age = ageOf(f.v.dateOfBirth)
  const minor = isMinor(f.v.dateOfBirth)
  const req = [
    ...(cm ? ['regName', 'regPhone'] : []),
    'fullName',
    'dateOfBirth',
    ...(!minor && !cm ? ['phone'] : []),
    'address',
    ...(minor ? ['guardianName', 'guardianPhone', 'guardianConsent'] : []),
    'emergencyName',
    'emergencyRelationship',
    'emergencyPhone',
    ...(cm ? ['confirm'] : []),
    'consent',
  ]
  const first = f.v.fullName.trim().split(' ')[0]
  const again = () => {
    f.reset({ mode: f.v.mode, regName: f.v.regName, regRole: f.v.regRole, regPhone: f.v.regPhone })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  useEffect(() => {
    if (cm && f.status === 'success') setCount((c) => c + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.status])
  let n = cm ? 1 : 0
  const team = labelFor(TEAMS, f.v.team)

  return (
    <div className="wrap join-grid">
      <aside className="facts">
        <Reveal className="facts-card">
          <div>
            <div className="eyebrow">Who is registering?</div>
            <div className="seg" role="radiogroup" aria-label="Who is registering">
              <button type="button" role="radio" aria-label="I’m the player" aria-checked={!cm} className={!cm ? 'on' : ''} onClick={() => f.setValue('mode', 'player')}>
                <Icon name="user" size={18} />
                <span>I’m the player</span>
              </button>
              <button type="button" role="radio" aria-label="Committee member" aria-checked={cm} className={cm ? 'on' : ''} onClick={() => f.setValue('mode', 'committee')}>
                <Icon name="clipboard-list" size={18} />
                <span>Committee</span>
              </button>
              <span className="seg-bar" style={{ transform: `translateX(${cm ? 100 : 0}%)` }} aria-hidden="true" />
            </div>
            <p className="caption" style={{ margin: '12px 0 0' }}>
              {cm
                ? 'Registering on behalf of a player. You can add several players one after another.'
                : 'Under 18? A parent or guardian completes part of the form with you.'}
            </p>
          </div>
          <div className="eyebrow" style={{ margin: 0 }}>
            Have these ready
          </div>
          {(
            [
              ['calendar', 'Date of birth'],
              ['map-pin', 'Home address'],
              ['phone', 'An emergency contact'],
              ['shield', 'Guardian details, if under 18'],
              ['image', 'A photo (optional)'],
            ] as const
          ).map(([ic, t], i) => (
            <Reveal i={i + 1} key={t} className="fact">
              <Icon name={ic} size={24} color="var(--color-primary-ink)" />
              <div className="fact-v" style={{ marginTop: 0 }}>
                {t}
              </div>
            </Reveal>
          ))}
          {cm && count > 0 && (
            <div className="rcount">
              <span className="rcount-n tnum">{count}</span>
              <span>player{count === 1 ? '' : 's'} registered this session</span>
            </div>
          )}
        </Reveal>
      </aside>
      <div className="form-box" ref={f.boxRef}>
        {f.status === 'success' ? (
          <Success
            title={cm ? 'Player registered' : 'Registration received'}
            steps={
              cm
                ? [
                    'The club secretary checks the details.',
                    'The player is added to the ' + (f.v.team === 'unassigned' ? 'squad list' : team.toLowerCase()) + '.',
                    (minor ? 'The guardian' : 'The player') + ' gets a confirmation message.',
                  ]
                : [
                    'The club secretary checks your details.',
                    'You get a confirmation message with your registration number.',
                    'Bring your kit to the next training session.',
                  ]
            }
            actions={
              cm ? (
                <>
                  <Button icon="plus" onClick={again}>
                    Register another player
                  </Button>
                  <Button variant="secondary" href="/squad">
                    View squad
                  </Button>
                </>
              ) : (
                <>
                  <Button icon="arrow-right" href="/results">
                    View fixtures
                  </Button>
                  {instagram && (
                    <Button variant="secondary" href={instagram} external data-social="instagram">
                      Follow on Instagram
                    </Button>
                  )}
                </>
              )
            }
          >
            <p>
              {cm ? (
                <>
                  <strong>{f.v.fullName}</strong> has been sent to the club for approval. Registered by {f.v.regName} (
                  {labelFor(COMMITTEE_ROLES, f.v.regRole).toLowerCase()}).
                </>
              ) : (
                <>
                  Thanks{first ? ', ' + first : ''}. The club will confirm your registration {responseTime}.
                </>
              )}
            </p>
            {minor && (
              <p>
                Because the player is under 18, the club will contact the parent or guardian, <strong>{f.v.guardianName}</strong>, on{' '}
                <span className="tnum">{f.v.guardianPhone}</span>.
              </p>
            )}
          </Success>
        ) : (
          <form noValidate onSubmit={f.submit} className="form">
            <div className="form-h">
              <h2 className="h3">{cm ? 'Register a player' : 'Register as a player'}</h2>
              <Progress f={f} keys={req} />
            </div>
            <ErrorSummary f={f} />
            <ErrorBanner f={f} what="registration" contact={contact} />

            <div className={'reveal-rows' + (cm ? ' o' : '')} aria-hidden={!cm}>
              <div>
                <Part n={1} title="Registered by" desc="The committee member submitting this form.">
                  <div className="frow">
                    <TextField f={f} k="regName" label="Your name" required autoComplete="name" />
                    <SelectField f={f} k="regRole" label="Your role" options={opts(COMMITTEE_ROLES)} />
                  </div>
                  <TextField f={f} k="regPhone" label="Your phone" type="tel" required autoComplete="tel" inputMode="tel" />
                </Part>
              </div>
            </div>

            <Part n={++n} title="Player details">
              <TextField f={f} k="fullName" label="Player full name" required autoComplete={cm ? 'off' : 'name'} maxLength={LIMITS.name} />
              <div className="frow">
                <TextField
                  f={f}
                  k="dateOfBirth"
                  label="Date of birth"
                  type="date"
                  required
                  autoComplete={cm ? 'off' : 'bday'}
                  max={new Date().toISOString().slice(0, 10)}
                />
                <TextField
                  f={f}
                  k="phone"
                  label="Player phone"
                  type="tel"
                  required={!minor && !cm}
                  help={minor || cm ? 'Optional' : undefined}
                  placeholder="98765 43210"
                  autoComplete={cm ? 'off' : 'tel'}
                  inputMode="tel"
                />
              </div>
              <TextField f={f} k="email" label="Player email" type="email" help="Optional" autoComplete={cm ? 'off' : 'email'} inputMode="email" />
              <TextField f={f} k="address" label="Home address" required autoComplete={cm ? 'off' : 'street-address'} maxLength={LIMITS.address} />
              <PhotoDrop f={f} />
            </Part>

            <div className={'reveal-rows' + (minor ? ' o' : '')} aria-hidden={!minor}>
              <div>
                <div className="guardian">
                  <div className="guardian-h">
                    <Icon name="shield" size={20} color="var(--color-primary-ink)" />
                    <span>The player is {age} — a parent or guardian must complete this section.</span>
                  </div>
                  <div className="frow">
                    <TextField f={f} k="guardianName" label="Parent/guardian name" required autoComplete="off" />
                    <TextField f={f} k="guardianPhone" label="Parent/guardian phone" type="tel" required inputMode="tel" />
                  </div>
                  <Consent
                    f={f}
                    k="guardianConsent"
                    label="I am the parent or guardian and I consent to this player being registered with the club, as described in the Privacy Policy."
                  />
                </div>
              </div>
            </div>

            <Part n={++n} title="Football">
              <div className="frow">
                <SelectField f={f} k="team" label="Team" options={opts(TEAMS)} />
                <SelectField f={f} k="foot" label="Preferred foot" options={opts(FEET)} />
              </div>
              <div className="frow">
                <SelectField f={f} k="position" label="Main position" options={POSITION_OPTS} />
                <SelectField f={f} k="secondPosition" label="Second position" options={SECOND_OPTS} />
              </div>
              <div className="frow">
                <TextField
                  f={f}
                  k="shirtNumber"
                  label="Shirt number"
                  help="Optional. Not guaranteed."
                  inputMode="numeric"
                  maxLength={2}
                  transform={(v) => v.replace(/\D/g, '').slice(0, 2)}
                />
                <TextField f={f} k="previousClub" label="Previous club" help="Optional" maxLength={LIMITS.short} />
              </div>
            </Part>

            <Part n={++n} title="Emergency and medical" desc="Kept private. Shared only with coaches and first-aid staff.">
              <div className="frow">
                <TextField f={f} k="emergencyName" label="Emergency contact name" required autoComplete="off" />
                <TextField f={f} k="emergencyRelationship" label="Relationship" required placeholder="e.g. Mother" />
              </div>
              <TextField f={f} k="emergencyPhone" label="Emergency contact phone" type="tel" required inputMode="tel" />
              <TextAreaField f={f} k="medical" label="Medical conditions, allergies or injuries" help="Optional" maxLength={LIMITS.medical} />
            </Part>

            <Honeypot />
            {cm && (
              <Consent
                f={f}
                k="confirm"
                label="I confirm the player, or their parent or guardian, has agreed to be registered and that these details are correct."
              />
            )}
            <Consent
              f={f}
              k="consent"
              label={
                <>
                  I agree to the{' '}
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                  .
                </>
              }
            />
            <SubmitBtn f={f}>{cm ? 'Register player' : 'Submit registration'}</SubmitBtn>
            <p className="caption">
              Details are used only to manage club registration and player safety. See the <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
