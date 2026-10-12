import Link from 'next/link'
import type { ReactNode } from 'react'
import { roleLabel, rolesOf, type RoleUser } from '@/access/roles'
import { Icon } from '@/components/kit/Icon'
import { TIME_ZONE } from '@/lib/constants'

/* ------------------------------- Formatting ------------------------------- */

export const fmtDate = (v: string | null | undefined, withTime = false) =>
  v
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
        timeZone: TIME_ZONE,
      }).format(new Date(v))
    : '—'

export const fmtMoney = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v)

export const nameOf = (u: unknown): string => {
  if (!u || typeof u !== 'object') return '—'
  const x = u as { name?: string | null; email?: string }
  return x.name || x.email || '—'
}

/* --------------------------------- Status --------------------------------- */

const TONES: Record<string, 'neon' | 'ok' | 'warn' | 'bad' | 'info' | undefined> = {
  pending: 'warn',
  under_review: 'info',
  changes_requested: 'warn',
  approved: 'ok',
  rejected: 'bad',
  draft: undefined,
  pending_publication: 'info',
  published: 'neon',
  unpublished: 'bad',
  active: 'ok',
  suspended: 'bad',
  inactive: undefined,
  ended: undefined,
}

export function Tag({ value, label }: { value: string | null | undefined; label?: string }) {
  const tone = value ? TONES[value] : undefined
  return <span className={'rtag' + (tone ? ` rtag-${tone}` : '')}>{label ?? (value ? value.replace(/[_-]/g, ' ') : '—')}</span>
}

export function RoleTags({ user }: { user: RoleUser }) {
  const roles = [...rolesOf(user)]
  return (
    <div className="dhead-roles">
      {roles.length ? (
        roles.map((r) => (
          <span key={r} className={'rtag' + (r === 'super-admin' ? ' rtag-neon' : '')}>
            {roleLabel(r)}
          </span>
        ))
      ) : (
        <span className="rtag">No role yet</span>
      )}
    </div>
  )
}

/* --------------------------------- Layout --------------------------------- */

export function DashHeader({ eyebrow, title, user, children }: { eyebrow: string; title: string; user?: RoleUser & { name?: string | null; email?: string }; children?: ReactNode }) {
  return (
    <section className="dhead">
      <div className="phero-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="wrap dhead-in">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="h1">{title}</h1>
        </div>
        {user && (
          <div className="dhead-who">
            <span className="muted" style={{ fontSize: 14 }}>
              Signed in as <strong style={{ color: 'var(--color-text-primary)' }}>{user.name || user.email}</strong>
            </span>
            <RoleTags user={user} />
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export function SectionTitle({ title, desc, actions }: { title: string; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="dsec-h">
      <div>
        <h2 className="h3">{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="dacts">{actions}</div>}
    </div>
  )
}

/** Shows the `?ok=` / `?error=` message a server action redirected back with. */
export function Flash({ params }: { params: { ok?: string; error?: string } }) {
  if (params.error)
    return (
      <div className="notice notice-error" role="alert">
        <Icon name="alert-circle" size={18} />
        <span>{params.error}</span>
      </div>
    )
  if (params.ok)
    return (
      <div className="notice" role="status">
        <Icon name="check" size={18} />
        <span>{params.ok}</span>
      </div>
    )
  return null
}

export function Stat({ value, label, href, alert, small }: { value: ReactNode; label: string; href?: string; alert?: boolean; small?: boolean }) {
  const body = (
    <>
      <div className="dstat-v tnum">{value}</div>
      <div className="dstat-l">{label}</div>
    </>
  )
  const cls = 'dstat' + (alert ? ' dstat-alert' : '') + (small ? ' dstat-sm' : '')
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="dempty">{children}</div>
}

export function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <label className="fld">
      <span className="lbl">
        <span className="lbl-t">{label}</span>
        {help && <> <span className="lbl-h">{help}</span></>}
      </span>
      <span className="fld-b">{children}</span>
    </label>
  )
}

export function Select({ name, defaultValue, options, required, ariaLabel }: { name: string; defaultValue?: string | null; options: readonly { label: string; value: string }[]; required?: boolean; ariaLabel?: string }) {
  return (
    <div className="sel">
      <select name={name} defaultValue={defaultValue ?? ''} required={required} className="ctl" aria-label={ariaLabel}>
        {!required && <option value="">—</option>}
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
  )
}

export const adminHref = (collection: string, id?: string | number) => `/admin/collections/${collection}${id != null ? `/${id}` : '/create'}`
