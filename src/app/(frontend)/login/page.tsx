import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { canUseDashboard } from '@/access/roles'
import { Submit } from '@/components/dash/client'
import { DashHeader, Field, Flash } from '@/components/dash/ui'
import { getCurrentUser } from '@/lib/auth'
import { login } from '../account/actions'
import '../dash.css'

export const metadata: Metadata = { title: 'Club login', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(params.next && params.next.startsWith('/') && !params.next.startsWith('//') ? params.next : canUseDashboard(user) ? '/dashboard' : '/account')
  return (
    <div>
      <DashHeader eyebrow="Members area" title="Club login" />
      <div className="wrap auth">
        <div className="form-box">
          <h2 className="h3">Sign in</h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
            For committee, conservators, mentors, players and members. Accounts are created by the club.
          </p>
          <form action={login} className="dform">
            <Flash params={params} />
            <input type="hidden" name="next" value={params.next ?? ''} />
            <Field label="Email">
              <input name="email" type="email" className="ctl" required autoComplete="username" inputMode="email" />
            </Field>
            <Field label="Password">
              <input name="password" type="password" className="ctl" required autoComplete="current-password" />
            </Field>
            <Submit icon="key-round">Sign in</Submit>
            <Link href="/account/forgot" className="btn btn-tertiary">
              Forgot your password?
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}
