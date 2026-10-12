'use client'

/**
 * Form engine from kit-forms.jsx: blur + submit validation, error summary, required-field
 * progress, honeypot, double-submit guard and network-error banner. Validation rules are
 * shared with the Server Action (lib/validation.ts), which checks everything again.
 */
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { submitForm } from '@/app/(frontend)/actions'
import { track } from '@/lib/analytics'
import { HONEYPOT, validate, type Errors, type FormKind, type Values } from '@/lib/validation'
import { Icon } from './Icon'
import { Button } from './ui'

export type Option = { label: string; value: string }

const scrollToEl = (el: Element | null) =>
  el && window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' })

export type Form = ReturnType<typeof useForm>

export function useForm({
  kind,
  initial,
  labels,
  startEvent,
  successEvent,
  errorEvent,
}: {
  kind: FormKind
  initial: Values
  labels: Record<string, string>
  startEvent?: string
  successEvent: string
  errorEvent: string
}) {
  const [v, setV] = useState<Values>(initial)
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [serverErrs, setServerErrs] = useState<Errors>({})
  const [errorMessage, setErrorMessage] = useState('')
  const started = useRef(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  // Attached files count as 'file' for validation, so required uploads use the same rules.
  const fileFlags = Object.fromEntries(Object.entries(files).map(([k, file]) => [k, file ? 'file' : '']))
  const errs: Errors = { ...validate(kind, { ...v, ...fileFlags }), ...serverErrs }

  const setValue = (k: string, val: string) => {
    setV((s) => ({ ...s, [k]: val }))
    setServerErrs((e) => {
      if (!(k in e)) return e
      const n = { ...e }
      delete n[k]
      return n
    })
    if (!started.current) {
      started.current = true
      if (startEvent) track(startEvent)
    }
  }
  const setFile = (k: string, file: File | null) => {
    setFiles((s) => ({ ...s, [k]: file }))
    setTouched((t) => ({ ...t, [k]: true }))
    setServerErrs((e) => {
      if (!(k in e)) return e
      const n = { ...e }
      delete n[k]
      return n
    })
  }
  const set = (k: string) => (e: { target: { value: string } }) => setValue(k, e.target.value)
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }))
  const err = (k: string) => (touched[k] || submitted ? errs[k] : undefined)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    const honeypot = (e.currentTarget.elements.namedItem(HONEYPOT) as HTMLInputElement | null)?.value
    setSubmitted(true)
    if (Object.keys(errs).length) {
      track(errorEvent, { reason: 'validation' })
      setTimeout(() => summaryRef.current?.focus(), 0)
      return
    }
    setStatus('sending')
    const fd = new FormData()
    Object.entries(v).forEach(([k, val]) => fd.append(k, val))
    if (honeypot) fd.append(HONEYPOT, honeypot)
    Object.entries(files).forEach(([k, file]) => file && fd.append(k, file))
    try {
      const res = await submitForm(kind, fd)
      if (res.status === 'success') {
        setStatus('success')
        track(successEvent)
        const top = boxRef.current ? boxRef.current.getBoundingClientRect().top + window.scrollY - 120 : 0
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      } else if (res.status === 'invalid') {
        setServerErrs(res.errors)
        setStatus('idle')
        track(errorEvent, { reason: 'validation' })
        setTimeout(() => summaryRef.current?.focus(), 0)
      } else {
        setErrorMessage(res.message)
        setStatus('error')
        track(errorEvent, { reason: 'server' })
      }
    } catch {
      setErrorMessage('')
      setStatus('error')
      track(errorEvent, { reason: 'network' })
    }
  }
  const reset = (keep: Values = {}) => {
    setV({ ...initial, ...keep })
    setFiles({})
    setTouched({})
    setSubmitted(false)
    setServerErrs({})
    setStatus('idle')
    started.current = false
  }
  return { v, set, setValue, blur, err, errs, submit, status, submitted, summaryRef, boxRef, reset, labels, files, setFile, errorMessage }
}

/* --------------------------------- Fields --------------------------------- */

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null
  return (
    <span id={id} className="ferr">
      <Icon name="alert-circle" size={16} />
      {msg}
    </span>
  )
}

type FieldProps = {
  f: Form
  k: string
  label: string
  required?: boolean
  help?: string
  className?: string
}

export function TextField({
  f,
  k,
  label,
  required,
  help,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  max,
  maxLength,
  transform,
  className = '',
}: FieldProps & {
  type?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: 'tel' | 'email' | 'numeric' | 'text'
  max?: string
  maxLength?: number
  transform?: (v: string) => string
}) {
  const e = f.err(k)
  return (
    <div className={'fld ' + className} onBlur={f.blur(k)}>
      <label className="lbl" htmlFor={'f-' + k}>
        <span className="lbl-t">
          {label}
          {required && ' (required)'}
        </span>
        {help && <> <span className="lbl-h">{help}</span></>}
      </label>
      <div className="fld-b">
        <input
          id={'f-' + k}
          name={k}
          className="ctl"
          type={type}
          value={f.v[k] ?? ''}
          onChange={(ev) => f.setValue(k, transform ? transform(ev.target.value) : ev.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          max={max}
          maxLength={maxLength}
          aria-required={required || undefined}
          aria-invalid={e ? true : undefined}
          aria-describedby={e ? 'e-' + k : undefined}
        />
        <FieldError id={'e-' + k} msg={e} />
      </div>
    </div>
  )
}

export function SelectField({ f, k, label, required, options, className = '' }: FieldProps & { options: Option[] }) {
  const e = f.err(k)
  return (
    <div className={'fld ' + className} onBlur={f.blur(k)}>
      <label className="lbl" htmlFor={'f-' + k}>
        <span className="lbl-t">
          {label}
          {required && ' (required)'}
        </span>
      </label>
      <div className="fld-b">
        <div className="sel">
          <select
            id={'f-' + k}
            name={k}
            className="ctl"
            value={f.v[k] ?? ''}
            onChange={f.set(k)}
            aria-invalid={e ? true : undefined}
            aria-describedby={e ? 'e-' + k : undefined}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span>
            <Icon name="chevron-right" size={16} />
          </span>
        </div>
        <FieldError id={'e-' + k} msg={e} />
      </div>
    </div>
  )
}

export function TextAreaField({ f, k, label, required, help, maxLength }: FieldProps & { maxLength: number }) {
  const e = f.err(k)
  return (
    <div className="fld" onBlur={f.blur(k)}>
      <label className="lbl" htmlFor={'f-' + k}>
        <span className="lbl-t">
          {label}
          {required && ' (required)'}
        </span>
        {help && <> <span className="lbl-h">{help}</span></>}
      </label>
      <div className="fld-b">
        <textarea
          id={'f-' + k}
          name={k}
          className="ctl"
          value={f.v[k] ?? ''}
          onChange={f.set(k)}
          maxLength={maxLength}
          aria-required={required || undefined}
          aria-invalid={e ? true : undefined}
          aria-describedby={e ? 'e-' + k : undefined}
        />
        <FieldError id={'e-' + k} msg={e} />
        <span className="counter tnum">
          {(f.v[k] ?? '').length} / {maxLength}
        </span>
      </div>
    </div>
  )
}

/** Custom checkbox with the drawn tick (kit-forms.jsx Consent). */
export function Consent({ f, k, label }: { f: Form; k: string; label: ReactNode }) {
  const on = f.v[k] === 'true'
  const e = f.err(k)
  const toggle = () => f.setValue(k, on ? '' : 'true')
  return (
    <div className="fld">
      <div
        id={'f-' + k}
        role="checkbox"
        aria-checked={on}
        aria-invalid={e ? true : undefined}
        aria-describedby={e ? 'e-' + k : undefined}
        tabIndex={0}
        className={'consent' + (on ? ' on' : '') + (e ? ' bad' : '')}
        onClick={(ev) => {
          if ((ev.target as HTMLElement).closest('a')) return
          toggle()
        }}
        onKeyDown={(ev) => {
          if (ev.key === ' ' || ev.key === 'Enter') {
            ev.preventDefault()
            toggle()
          }
        }}
        onBlur={f.blur(k)}
      >
        <span className="cbox" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span>{label}</span>
      </div>
      <FieldError id={'e-' + k} msg={e} />
    </div>
  )
}

/* ------------------------------ Form chrome ------------------------------- */

export function ErrorSummary({ f }: { f: Form }) {
  const list = Object.entries(f.errs)
  if (!f.submitted || !list.length) return null
  return (
    <div ref={f.summaryRef} tabIndex={-1} role="alert" className="esum">
      <div className="esum-h">
        <Icon name="alert-circle" size={20} />
        <span>{list.length === 1 ? 'There is 1 problem' : `There are ${list.length} problems`}</span>
      </div>
      <ul>
        {list.map(([k, msg]) => (
          <li key={k}>
            <a
              href={'#f-' + k}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById('f-' + k)
                if (el) {
                  scrollToEl(el)
                  el.focus({ preventScroll: true })
                }
              }}
            >
              {(f.labels[k] || k) + ': ' + msg}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ErrorBanner({ f, what, contact }: { f: Form; what: string; contact: string }) {
  if (f.status !== 'error') return null
  return (
    <div role="alert" className="ebanner">
      <Icon name="alert-circle" size={20} />
      <span>
        Your {what} was not sent. {f.errorMessage && f.errorMessage + ' '}Please try again or contact us at {contact}. Your answers are
        still here.
      </span>
    </div>
  )
}

export function Progress({ f, keys }: { f: Form; keys: string[] }) {
  const ok = keys.filter((k) => !f.errs[k]).length
  return (
    <div className="fprog" aria-live="polite">
      <div className="fprog-t">
        <span>Required fields</span>
        <span className="tnum">
          {ok} / {keys.length}
        </span>
      </div>
      <div className="fprog-bar">
        <span style={{ transform: `scaleX(${keys.length ? ok / keys.length : 0})` }} />
      </div>
    </div>
  )
}

export function Honeypot() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Website
        <input name={HONEYPOT} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  )
}

export function Success({
  title,
  children,
  steps,
  actions,
}: {
  title: string
  children: ReactNode
  steps?: string[]
  actions?: ReactNode
}) {
  return (
    <div className="success" role="status">
      <svg className="success-mark" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" />
        <path d="M19 33l9 9 18-19" />
      </svg>
      <h3 className="h3">{title}</h3>
      <div className="success-body">{children}</div>
      {steps && (
        <>
          <div className="eyebrow" style={{ marginTop: 28 }}>
            What happens next
          </div>
          <ol className="nextsteps">
            {steps.map((s, i) => (
              <li key={i} style={{ animationDelay: 300 + i * 90 + 'ms' }}>
                <span className="ns-n tnum">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      {actions && (
        <div className="btnrow" style={{ marginTop: 28 }}>
          {actions}
        </div>
      )}
    </div>
  )
}

export function SubmitBtn({ f, children }: { f: Form; children: ReactNode }) {
  const sending = f.status === 'sending'
  return (
    <Button
      type="submit"
      size="large"
      fullWidth
      loading={sending}
      disabled={sending}
      icon={sending ? 'loader-2' : 'arrow-right'}
      iconPosition={sending ? 'left' : 'right'}
    >
      {children}
    </Button>
  )
}
