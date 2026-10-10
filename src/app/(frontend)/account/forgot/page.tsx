import type { Metadata } from 'next'
import Link from 'next/link'
import { Submit } from '@/components/dash/client'
import { DashHeader, Field, Flash } from '@/components/dash/ui'
import { requestReset } from '../actions'
import '../../dash.css'

export const metadata: Metadata = { title: 'Reset password', robots: { index: false, follow: false } }

export default async function ForgotPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  return (
    <div>
      <DashHeader eyebrow="Members area" title="Reset password" />
      <div className="wrap auth">
        <div className="form-box">
          <h2 className="h3">Forgot your password?</h2>
          <form action={requestReset} className="dform">
            <Flash params={params} />
            {!params.ok && (
              <>
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                  Enter your account email and we will send a link to set a new password. If email is not set up yet, ask the Secretary for a link.
                </p>
                <Field label="Email">
                  <input name="email" type="email" className="ctl" required autoComplete="username" inputMode="email" />
                </Field>
                <Submit icon="mail">Send link</Submit>
              </>
            )}
            <Link href="/login" className="btn btn-tertiary">
              Back to sign in
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}
