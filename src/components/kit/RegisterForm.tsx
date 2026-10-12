'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  BACHELOR_DEGREES,
  BLOOD_GROUPS,
  COMMITTEE_ROLES,
  FEET,
  labelFor,
  MASTER_DEGREES,
  PREFERRED_POSITIONS,
  TEAMS,
} from '@/lib/constants'
import { shrinkImage } from '@/lib/shrinkImage'
import {
  ageOf,
  IMAGE_PICK_MAX_BYTES,
  isChecked,
  isMinor,
  LIMITS,
  maskAadhaar,
  maskPan,
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
} from '@/lib/validation'
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
  fullName: 'Player full name',
  dateOfBirth: 'Date of birth',
  phone: 'Calling number',
  whatsapp: 'WhatsApp number',
  email: 'Email address',
  bloodGroup: 'Blood group',
  address: 'Home address',
  photo: 'Player photo',
  guardianName: 'Parent/guardian name',
  guardianPhone: 'Parent/guardian phone',
  guardianConsent: 'Guardian consent',
  emergencyName: 'Emergency contact name',
  emergencyRelationship: 'Relationship',
  emergencyPhone: 'Emergency contact phone',
  shirtNumber: 'Shirt number',
  schoolName: 'School name',
  bachelorDegree: 'Bachelor’s degree',
  bachelorCollege: 'Bachelor’s college',
  masterDegree: 'Master’s degree',
  masterCollege: 'Master’s college',
  otherQualifications: 'Other qualifications',
  aadhaarNumber: 'Aadhaar number',
  aadhaarImage: 'Aadhaar card image',
  panNumber: 'PAN',
  panImage: 'PAN card image',
  confirm: 'Committee confirmation',
  consent: 'Privacy Policy',
}

/** Digits, spaces and a leading +, so "+91 98765 43210" still fits. */
const maskPhone = (v: string) => v.replace(/[^\d+ ]/g, '').replace(/(?!^)\+/g, '').slice(0, 16)

const opts = (list: readonly Option[]): Option[] => list.map(({ label, value }) => ({ label, value }))
const POSITION_OPTS = opts(PREFERRED_POSITIONS)
const SECOND_OPTS: Option[] = [{ label: 'None', value: 'none' }, ...POSITION_OPTS.filter((p) => p.value !== 'not-sure')]
const BLOOD_OPTS: Option[] = [{ label: 'Choose…', value: '' }, ...opts(BLOOD_GROUPS)]
const BACHELOR_OPTS: Option[] = [{ label: 'None / not applicable', value: '' }, ...opts(BACHELOR_DEGREES)]
const MASTER_OPTS: Option[] = [{ label: 'None / not applicable', value: '' }, ...opts(MASTER_DEGREES)]

const BLANK = {
  fullName: '',
  dateOfBirth: '',
  phone: '',
  whatsapp: '',
  whatsappSame: 'true',
  email: '',
  bloodGroup: '',
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
  schoolName: '',
  bachelorDegree: '',
  bachelorCollege: '',
  masterDegree: '',
  masterCollege: '',
  otherQualifications: '',
  aadhaarNumber: '',
  panNumber: '',
  confirm: '',
  consent: '',
}

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

type DropProps = {
  f: Form
  k: string
  label: string
  /** Short hint on the label line, e.g. "Optional". */
  help?: string
  /** Longer guidance, shown inside the drop zone so the label stays on one line. */
  note?: string
  required?: boolean
  /** Round thumbnail for a face photo, card-shaped for documents. */
  doc?: boolean
}

/** Drag-and-drop image picker. Images are shrunk in the browser before they are sent. */
function ImageDrop({ f, k, label, help, note, required, doc }: DropProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [problem, setProblem] = useState('')
  const p = f.files[k] ?? null
  useEffect(() => {
    if (!p) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(p)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [p])
  const take = async (file?: File | null) => {
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type)) return setProblem('Use a JPG, PNG or WebP image')
    if (file.size > IMAGE_PICK_MAX_BYTES) return setProblem('Use an image under 15 MB')
    setProblem('')
    setBusy(true)
    try {
      const small = await shrinkImage(file)
      if (small.size > PHOTO_MAX_BYTES) return setProblem('This image is too detailed to send. Try a smaller photo or a screenshot.')
      f.setFile(k, small)
    } catch {
      setProblem('This image could not be read. Try a JPG or PNG.')
    } finally {
      setBusy(false)
    }
  }
  const e = problem || f.err(k)
  const verb = doc ? 'image' : 'photo'
  return (
    <div className="fld">
      <span className="lbl">
        <span className="lbl-t">
          {label}
          {required && ' (required)'}
        </span>
        {help && <> <span className="lbl-h">{help}</span></>}
      </span>
      <div className="fld-b">
        <div
          id={'f-' + k}
          className={'pdrop' + (over ? ' over' : '') + (p ? ' has' : '') + (e ? ' bad' : '')}
          role="button"
          tabIndex={0}
          aria-label={p ? `${label} selected: ${p.name}. Click to replace` : `Add ${label.toLowerCase()}`}
          aria-invalid={e ? true : undefined}
          aria-describedby={[note && 'n-' + k, e && 'e-' + k].filter(Boolean).join(' ') || undefined}
          aria-busy={busy || undefined}
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
            void take(ev.dataTransfer.files[0])
          }}
        >
          {p && preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className={'pdrop-img' + (doc ? ' doc' : '')} />
              <span className="pdrop-t">
                <span>{p.name}</span>
                <span className="caption">Click to replace</span>
              </span>
              <button
                type="button"
                className="fb-x"
                aria-label={`Remove ${label.toLowerCase()}`}
                onClick={(ev) => {
                  ev.stopPropagation()
                  f.setFile(k, null)
                  if (ref.current) ref.current.value = ''
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </>
          ) : (
            <>
              <span className="pdrop-ic">
                <Icon name={busy ? 'loader-2' : 'upload'} size={24} color="var(--color-primary-ink)" />
              </span>
              <span className="pdrop-t">
                <span>{busy ? 'Preparing image…' : `Drop a ${verb} or browse`}</span>
                <span id={note ? 'n-' + k : undefined} className="caption">
                  {note && note + ' '}JPG, PNG or WebP
                </span>
              </span>
            </>
          )}
          <input
            ref={ref}
            type="file"
            accept={PHOTO_TYPES.join(',')}
            hidden
            onChange={(ev) => void take(ev.target.files?.[0])}
          />
        </div>
        {e && (
          <span id={'e-' + k} className="ferr">
            <Icon name="alert-circle" size={16} />
            {e}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Season registration (kit-register.jsx). Who is registering follows the signed-in account:
 * the Secretary or Joint Secretary (`submitter`) registers for the club, everyone else as the player.
 */
export function RegisterForm({
  contact,
  responseTime,
  instagram,
  submitter,
}: {
  contact: string
  responseTime: string
  instagram: string | null
  submitter: { name: string; role: string } | null
}) {
  const [count, setCount] = useState(0)
  const f = useForm({
    kind: 'register',
    initial: { mode: submitter ? 'committee' : 'player', ...BLANK },
    labels: LABELS,
    startEvent: 'register_form_start',
    successEvent: 'register_submit_success',
    errorEvent: 'register_submit_error',
  })
  const cm = !!submitter
  const asWho = submitter ? `${submitter.name} (${labelFor(COMMITTEE_ROLES, submitter.role)})` : ''
  const age = ageOf(f.v.dateOfBirth)
  const minor = isMinor(f.v.dateOfBirth)
  const req = [
    'fullName',
    'dateOfBirth',
    ...(!minor && !cm ? ['phone', ...(isChecked(f.v.whatsappSame) ? [] : ['whatsapp'])] : []),
    'email',
    'bloodGroup',
    'address',
    ...(minor ? ['guardianName', 'guardianPhone', 'guardianConsent'] : []),
    'emergencyName',
    'emergencyRelationship',
    'emergencyPhone',
    'aadhaarNumber',
    'aadhaarImage',
    ...(minor ? [] : ['panNumber', 'panImage']),
    ...(cm ? ['confirm'] : []),
    'consent',
  ]
  const first = f.v.fullName.trim().split(' ')[0]
  const again = () => {
    f.reset({ mode: f.v.mode })
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
            <div className="seg one">
              <span className="seg-bar" aria-hidden="true" />
              <span className="seg-item">
                <Icon name={cm ? 'clipboard-list' : 'user'} size={18} />
                <span>{cm ? 'Committee' : 'Player'}</span>
              </span>
            </div>
            <p className="caption" style={{ margin: '12px 0 0' }}>
              {cm
                ? `Signed in as ${asWho}. Players you register are approved straight away, and you can add several one after another.`
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
              ['file-text', 'Aadhaar card, and PAN card if 18 or over'],
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
                    'The registration is approved and the player has a Player ID.',
                    'The player is added to the ' + (f.v.team === 'unassigned' ? 'squad list' : team.toLowerCase()) + '.',
                    'Prepare their public squad profile from the dashboard when you are ready.',
                  ]
                : [
                    'The club secretary checks your details.',
                    'Once approved, you get your Player ID (like xfc-26-0001) on your account page.',
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
                  <strong>{f.v.fullName}</strong> is registered and approved. Registered by {asWho}.
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
            <p className="caption" style={{ margin: 0 }}>
              <Icon name="info" size={16} />{' '}
              {cm ? (
                <>
                  The Player ID (like <span className="tnum">xfc-26-0001</span>) is given as soon as you submit.
                </>
              ) : (
                <>
                  Your Player ID (like <span className="tnum">xfc-26-0001</span>) is given when the club approves the registration.
                </>
              )}
            </p>
            <ErrorSummary f={f} />
            <ErrorBanner f={f} what="registration" contact={contact} />

            {cm && (
              <Part n={1} title="Registered by" desc="Taken from the account you are signed in with.">
                <p style={{ margin: 0, fontWeight: 600 }}>{asWho}</p>
              </Part>
            )}

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
                <SelectField f={f} k="bloodGroup" label="Blood group" required options={BLOOD_OPTS} />
              </div>
              <div className="frow">
                <TextField
                  f={f}
                  k="phone"
                  label="Calling number"
                  type="tel"
                  required={!minor && !cm}
                  help={minor || cm ? 'Optional' : undefined}
                  placeholder="98765 43210"
                  autoComplete={cm ? 'off' : 'tel'}
                  inputMode="tel"
                  maxLength={16}
                  transform={maskPhone}
                />
                {isChecked(f.v.whatsappSame) ? (
                  <div className="fld">
                    <span className="lbl">
                      <span className="lbl-t">WhatsApp number</span>
                    </span>
                    <div className="fld-b">
                      <span className="fnote">Same as the calling number.</span>
                    </div>
                  </div>
                ) : (
                  <TextField
                    f={f}
                    k="whatsapp"
                    label="WhatsApp number"
                    type="tel"
                    required={!minor && !cm}
                    help={minor || cm ? 'Optional' : undefined}
                    placeholder="98765 43210"
                    autoComplete="off"
                    inputMode="tel"
                    maxLength={16}
                    transform={maskPhone}
                  />
                )}
              </div>
              <Consent f={f} k="whatsappSame" label="WhatsApp is on the same number as calls." />
              <TextField
                f={f}
                k="email"
                label="Email address"
                type="email"
                required
                help={minor ? 'The player’s or a parent’s email' : undefined}
                autoComplete={cm ? 'off' : 'email'}
                inputMode="email"
                maxLength={LIMITS.email}
              />
              <TextField f={f} k="address" label="Home address" required autoComplete={cm ? 'off' : 'street-address'} maxLength={LIMITS.address} />
              <ImageDrop
                f={f}
                k="photo"
                label="Player photo"
                help="Optional"
                note="Head and shoulders, plain background. Used on the squad page only if the player agrees."
              />
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
                    <TextField f={f} k="guardianPhone" label="Parent/guardian phone" type="tel" required inputMode="tel" maxLength={16} transform={maskPhone} />
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
                  help="Optional"
                  note="Not guaranteed."
                  inputMode="numeric"
                  maxLength={2}
                  transform={(v) => v.replace(/\D/g, '').slice(0, 2)}
                />
                <TextField f={f} k="previousClub" label="Previous club" help="Optional" maxLength={LIMITS.short} />
              </div>
            </Part>

            <Part
              n={++n}
              title="Identity documents"
              desc="Kept private. Seen only by the Secretary and senior committee, never shown on the website."
            >
              <div className="frow">
                <TextField
                  f={f}
                  k="aadhaarNumber"
                  label="Aadhaar number"
                  required
                  placeholder="XXXX XXXX XXXX"
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={14}
                  transform={maskAadhaar}
                />
                <TextField
                  f={f}
                  k="panNumber"
                  label="PAN"
                  required={!minor}
                  help={minor ? 'Optional for under-18s' : '10 characters'}
                  placeholder="ABCPE1234F"
                  autoComplete="off"
                  maxLength={10}
                  transform={maskPan}
                />
              </div>
              <div className="frow">
                <ImageDrop f={f} k="aadhaarImage" label="Aadhaar card image" note="Front side, all four corners visible." required doc />
                <ImageDrop
                  f={f}
                  k="panImage"
                  label="PAN card image"
                  help={minor ? 'Optional for under-18s' : undefined}
                  note="Front side, all four corners visible."
                  required={!minor}
                  doc
                />
              </div>
            </Part>

            <Part n={++n} title="Education" desc="All optional.">
              <TextField f={f} k="schoolName" label="School name" help="Optional" maxLength={LIMITS.school} />
              <div className="frow">
                <SelectField f={f} k="bachelorDegree" label="Bachelor’s degree" options={BACHELOR_OPTS} />
                <TextField f={f} k="bachelorCollege" label="College name" help="Optional" maxLength={LIMITS.school} />
              </div>
              <div className="frow">
                <SelectField f={f} k="masterDegree" label="Master’s degree" options={MASTER_OPTS} />
                <TextField f={f} k="masterCollege" label="College name" help="Optional" maxLength={LIMITS.school} />
              </div>
              <TextAreaField
                f={f}
                k="otherQualifications"
                label="Other qualifications"
                help="Optional"
                note="Diplomas, certificates, coaching or refereeing licences."
                maxLength={LIMITS.otherQualifications}
              />
            </Part>

            <Part n={++n} title="Emergency and medical" desc="Kept private. Shared only with coaches and first-aid staff.">
              <div className="frow">
                <TextField f={f} k="emergencyName" label="Emergency contact name" required autoComplete="off" />
                <TextField f={f} k="emergencyRelationship" label="Relationship" required placeholder="e.g. Mother" />
              </div>
              <TextField f={f} k="emergencyPhone" label="Emergency contact phone" type="tel" required inputMode="tel" maxLength={16} transform={maskPhone} />
              <TextAreaField
                f={f}
                k="medical"
                label="Medical conditions"
                help="Optional"
                note="Include any allergies or injuries."
                maxLength={LIMITS.medical}
              />
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
