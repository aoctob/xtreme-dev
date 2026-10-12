'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useActionState, type MouseEvent, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Icon, type IconName } from '@/components/kit/Icon'
import { Button } from '@/components/kit/ui'

export type NavItem = { href: string; label: string; icon: IconName; external?: boolean }

export function DashNav({ items }: { items: (NavItem | 'sep')[] }) {
  const path = usePathname() || ''
  return (
    <nav className="dnav" aria-label="Dashboard">
      {items.map((it, i) =>
        it === 'sep' ? (
          <span key={`sep${i}`} className="dnav-sep" aria-hidden="true" />
        ) : it.external ? (
          <a key={it.href} href={it.href}>
            <Icon name={it.icon} size={18} />
            {it.label}
          </a>
        ) : (
          <Link
            key={it.href}
            href={it.href}
            aria-current={(it.href === '/dashboard' ? path === it.href : path === it.href || path.startsWith(it.href + '/')) ? 'page' : undefined}
          >
            <Icon name={it.icon} size={18} />
            {it.label}
          </Link>
        ),
      )}
    </nav>
  )
}

/** Submit button with a pending state and an optional confirmation prompt. */
export function Submit({
  children,
  variant = 'primary',
  confirm,
  name,
  value,
  icon,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'tertiary'
  confirm?: string
  name?: string
  value?: string
  icon?: IconName
}) {
  const { pending } = useFormStatus()
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (confirm && !window.confirm(confirm)) e.preventDefault()
  }
  return (
    <Button type="submit" size="small" variant={variant} disabled={pending} aria-busy={pending || undefined} onClick={onClick} name={name} value={value} icon={icon} iconPosition="left">
      {pending ? 'Working…' : children}
    </Button>
  )
}

export type InviteState = { status: 'idle' | 'ok' | 'error'; message?: string; link?: string }

/** Creates (or links) a Player/Member login and shows the one-time set-password link. */
export function InviteLogin({ action, label = 'Create login' }: { action: (s: InviteState, fd: FormData) => Promise<InviteState>; label?: string }) {
  const [state, run] = useActionState(action, { status: 'idle' } as InviteState)
  return (
    <form action={run} className="dform">
      {state.status === 'idle' && <Submit icon="key-round">{label}</Submit>}
      {state.status !== 'idle' && (
        <div className={'notice' + (state.status === 'error' ? ' notice-error' : '')} role="status">
          <Icon name={state.status === 'error' ? 'alert-circle' : 'check'} size={18} />
          <span>
            {state.message}
            {state.link && (
              <>
                <br />
                <code>{state.link}</code>
                <br />
                <button type="button" className="btn btn-tertiary" onClick={() => navigator.clipboard?.writeText(state.link!)}>
                  Copy link
                </button>
              </>
            )}
          </span>
        </div>
      )}
    </form>
  )
}
