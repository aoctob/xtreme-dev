'use client'

import Link from 'next/link'
import { useRef, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { submitForm } from '@/app/(frontend)/actions'
import { track } from '@/lib/analytics'
import { HONEYPOT, isMinor, validate, type Errors, type FormKind, type Values } from '@/lib/validation'

export type FieldDef = {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'consent'
  required?: boolean
  /** Shown and required only when the date of birth gives age under 18. */
  minorOnly?: boolean
  options?: { label: string; value: string }[]
  help?: string
  autoComplete?: string
  inputMode?: 'tel' | 'email' | 'text'
  maxLength?: number
  full?: boolean
}

const EVENTS: Record<FormKind, { success: string; error?: string; start?: string }> = {
  join: { success: 'join_submit_success', error: 'join_submit_error', start: 'join_form_start' },
  sponsor: { success: 'sponsor_enquiry_success' },
  contact: { success: 'contact_success' },
}

/**
 * Accessible form with inline validation, error summary, success panel and a
 * retained-values error banner (PRD §D.10, US-07; design.md §E.12).
 */
export function Form({
  kind,
  fields,
  submitLabel,
  successTitle,
  successSteps,
  fallbackContact,
  note,
}: {
  kind: FormKind
  fields: FieldDef[]
  submitLabel: string
  successTitle: string
  successSteps: string[]
  fallbackContact: string
  note?: string
}) {
  const [values, setValues] = useState<Values>({})
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [summary, setSummary] = useState<string[] | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [serverMessage, setServerMessage] = useState('')
  const [started, setStarted] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)

  const minor = isMinor(values.dateOfBirth ?? '')
  const active = fields.filter((f) => !f.minorOnly || minor)

  const fieldError = (name: string, next: Values) => validate(kind, next)[name]

  const update = (name: string, value: string) => {
    const next = { ...values, [name]: value }
    setValues(next)
    // After a field has shown an error, re-check it as the user types.
    if (errors[name]) setErrors((e) => ({ ...e, [name]: fieldError(name, next) ?? '' }))
  }

  const blur = (name: string) => {
    setTouched((t) => ({ ...t, [name]: true }))
    setErrors((e) => ({ ...e, [name]: fieldError(name, values) ?? '' }))
  }

  const onFocus = () => {
    if (!started) {
      setStarted(true)
      const start = EVENTS[kind].start
      if (start) track(start)
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (state === 'sending') return
    const formData = new FormData(e.currentTarget)
    const all = validate(kind, values)
    const relevant = Object.fromEntries(
      Object.entries(all).filter(([k]) => active.some((f) => f.name === k)),
    )
    if (Object.keys(relevant).length > 0) {
      setErrors(relevant)
      setTouched(Object.fromEntries(active.map((f) => [f.name, true])))
      setSummary(Object.keys(relevant))
      if (EVENTS[kind].error) track(EVENTS[kind].error!, { reason: 'validation' })
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setSummary(null)
    setState('sending')
    try {
      const res = await submitForm(kind, formData)
      if (res.status === 'success') {
        setState('success')
        track(EVENTS[kind].success)
        requestAnimationFrame(() => successRef.current?.focus())
      } else if (res.status === 'invalid') {
        setState('idle')
        setErrors(res.errors)
        setSummary(Object.keys(res.errors))
        if (EVENTS[kind].error) track(EVENTS[kind].error!, { reason: 'server-validation' })
        requestAnimationFrame(() => summaryRef.current?.focus())
      } else {
        setState('error')
        setServerMessage(res.message)
        if (EVENTS[kind].error) track(EVENTS[kind].error!, { reason: 'server' })
        requestAnimationFrame(() => bannerRef.current?.focus())
      }
    } catch {
      setState('error')
      setServerMessage('We could not reach the server. Check your connection.')
      if (EVENTS[kind].error) track(EVENTS[kind].error!, { reason: 'network' })
      requestAnimationFrame(() => bannerRef.current?.focus())
    }
  }

  if (state === 'success') {
    return (
      <div className="success-panel" role="status">
        <div className="success-panel__head">
          <CheckCircle2 size={28} aria-hidden="true" />
          <h2 ref={successRef} tabIndex={-1}>
            {successTitle}
          </h2>
        </div>
        {(successSteps.length > 0 || minor) && (
          <>
            <p className="t-small t-secondary">What happens next</p>
            <ol>
              {minor && kind === 'join' && <li>We will contact your parent or guardian, not you directly.</li>}
              {successSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </>
        )}
      </div>
    )
  }

  const labelOf = (name: string) => {
    const f = fields.find((x) => x.name === name)
    return f?.type === 'consent' ? 'Consent' : (f?.label ?? name)
  }

  return (
    <form className="form" noValidate onSubmit={onSubmit} onFocus={onFocus}>
      {summary && summary.length > 0 && (
        <div ref={summaryRef} className="error-summary" tabIndex={-1} role="alert" aria-labelledby={`${kind}-summary-title`}>
          <h2 id={`${kind}-summary-title`}>
            Please fix {summary.length} {summary.length === 1 ? 'problem' : 'problems'}
          </h2>
          <ul>
            {summary.map((name) => (
              <li key={name}>
                <a href={`#${kind}-${name}`}>
                  {labelOf(name)}: {errors[name]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state === 'error' && (
        <div ref={bannerRef} className="banner-error" role="alert" tabIndex={-1}>
          <AlertCircle size={20} aria-hidden="true" />
          <p className="t-small">
            <strong>Your {kind === 'join' ? 'application' : 'message'} was not sent.</strong> {serverMessage} Please
            try again or contact us at {fallbackContact}.
          </p>
        </div>
      )}

      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${kind}-${HONEYPOT}`}>Leave this empty</label>
        <input id={`${kind}-${HONEYPOT}`} name={HONEYPOT} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="form-grid">
        {active.map((f) => (
          <Field
            key={f.name}
            kind={kind}
            def={f}
            value={values[f.name] ?? ''}
            error={touched[f.name] ? errors[f.name] : undefined}
            onChange={(v) => update(f.name, v)}
            onBlur={() => blur(f.name)}
            required={f.required || f.minorOnly}
          />
        ))}
      </div>

      <div className="form-submit stack">
        <button
          type="submit"
          className="btn btn--primary btn--lg"
          disabled={state === 'sending'}
          aria-busy={state === 'sending'}
        >
          {state === 'sending' ? (
            <>
              <span className="spinner" aria-hidden="true" /> Sending…
            </>
          ) : (
            submitLabel
          )}
        </button>
        {note && <p className="form-note">{note}</p>}
      </div>
    </form>
  )
}

function Field({
  kind,
  def,
  value,
  error,
  required,
  onChange,
  onBlur,
}: {
  kind: FormKind
  def: FieldDef
  value: string
  error?: string
  required?: boolean
  onChange: (v: string) => void
  onBlur: () => void
}) {
  const id = `${kind}-${def.name}`
  const errId = `${id}-error`
  const helpId = `${id}-help`
  const describedBy = [def.help ? helpId : null, error ? errId : null].filter(Boolean).join(' ') || undefined
  const common = {
    id,
    name: def.name,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    'aria-required': required || undefined,
    onBlur,
  }

  const errorEl = error ? (
    <p id={errId} className="field__error">
      <AlertCircle size={16} aria-hidden="true" />
      {error}
    </p>
  ) : null

  if (def.type === 'consent') {
    return (
      <div className="field field--full">
        <label className="checkbox" htmlFor={id}>
          <input
            {...common}
            type="checkbox"
            checked={value === 'on'}
            onChange={(e) => onChange(e.target.checked ? 'on' : '')}
          />
          <span>
            {def.label} <Link href="/privacy" target="_blank">Privacy Policy (opens in a new tab)</Link>.{' '}
            <span className="field__req">(required)</span>
          </span>
        </label>
        {errorEl}
      </div>
    )
  }

  return (
    <div className={`field${def.full || def.type === 'textarea' ? ' field--full' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {def.label} {required ? <span className="field__req">(required)</span> : <span className="field__req">(optional)</span>}
      </label>
      {def.help && (
        <p id={helpId} className="field__help">
          {def.help}
        </p>
      )}
      {def.type === 'select' ? (
        <select {...common} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : def.type === 'textarea' ? (
        <>
          <textarea
            {...common}
            className="input"
            value={value}
            maxLength={def.maxLength}
            onChange={(e) => onChange(e.target.value)}
          />
          {def.maxLength && (
            <span className="t-caption field__count" aria-live="off">
              {value.length} / {def.maxLength}
            </span>
          )}
        </>
      ) : (
        <input
          {...common}
          className="input"
          type={def.type}
          value={value}
          autoComplete={def.autoComplete}
          inputMode={def.inputMode}
          maxLength={def.maxLength}
          max={def.type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {errorEl}
    </div>
  )
}
