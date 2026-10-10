import type { Metadata } from 'next'
import Link from 'next/link'
import { Submit } from '@/components/dash/client'
import { DashHeader, Field, Flash } from '@/components/dash/ui'
import { resetPassword } from '../actions'
import '../../dash.css'

export const metadata: Metadata = { title: 'Set password', robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default async function ResetPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  return (
    <div>
      <DashHeader eyebrow="Members area" title="Set password" />
      <div className="wrap auth">
        <div className="form-box">
          <h2 className="h3">Choose a password</h2>
          {params.token ? (
            <form action={resetPassword} className="dform">
              <Flash params={params} />
              <input type="hidden" name="token" value={params.token} />
              <Field label="New password" help="At least 10 characters.">
                <input name="password" type="password" className="ctl" required minLength={10} autoComplete="new-password" />
              </Field>
              <Field label="Repeat password">
                <input name="confirm" type="password" className="ctl" required minLength={10} autoComplete="new-password" />
              </Field>
              <Submit icon="key-round">Set password and sign in</Submit>
            </form>
          ) : (
            <div className="dform">
              <p className="muted">This link is incomplete. Ask for a new one.</p>
              <Link href="/account/forgot" className="btn btn-tertiary">
                Request a new link
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
