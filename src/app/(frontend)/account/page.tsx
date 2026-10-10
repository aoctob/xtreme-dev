import type { Metadata } from 'next'
import Link from 'next/link'
import { canUseAdmin, canUseDashboard, canViewPlayerRecords } from '@/access/roles'
import { Submit } from '@/components/dash/client'
import { DashHeader, Empty, Field, fmtDate, Flash, SectionTitle, Tag } from '@/components/dash/ui'
import { Icon } from '@/components/kit/Icon'
import { requireUser } from '@/lib/auth'
import {
  labelFor,
  MEMBERSHIP_STATUSES,
  MEMBERSHIP_TYPES,
  PREFERRED_POSITIONS,
  REGISTRATION_STATUSES,
  TEAMS,
} from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'
import { logout, resubmitRegistration } from './actions'
import '../dash.css'

export const metadata: Metadata = { title: 'My account', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const STATUS_HELP: Record<string, string> = {
  pending: 'Received. The Secretary will review it.',
  under_review: 'The Secretary is reviewing it.',
  changes_requested: 'The club needs something from you. See below.',
  approved: 'Approved. Your public profile is prepared separately and appears once the club publishes it.',
  rejected: 'Not accepted this time. Contact the club if you have questions.',
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser()
  const params = await searchParams
  const payload = await getPayloadClient()
  const as = { user: me, overrideAccess: false } as const
  // For a player the access rules already return only their own records, with private
  // review fields removed (they may not query by the `user` field itself). Committee
  // users can read every record, so for them filter to their own.
  const own = canViewPlayerRecords(me) ? { where: { user: { equals: me.id } } } : {}
  const [records, memberships] = await Promise.all([
    payload.find({ collection: 'registrations', ...own, sort: '-createdAt', limit: 10, depth: 0, ...as }),
    payload.find({ collection: 'members', where: { user: { equals: me.id } }, limit: 5, depth: 0, ...as }),
  ])
  const profiles = records.docs.length
    ? await payload.find({
        collection: 'players',
        where: { and: [{ publicationStatus: { equals: 'published' } }, { record: { in: records.docs.map((r) => r.id) } }] },
        depth: 0,
        limit: 10,
        overrideAccess: true,
        select: { slug: true, record: true, squadRole: true },
      })
    : null

  return (
    <div>
      <DashHeader eyebrow="Members area" title="My account" user={me} />
      <div className="wrap" style={{ padding: '40px var(--gut) 96px', display: 'flex', flexDirection: 'column', gap: 40 }}>
        {params.denied && (
          <div className="notice notice-warn" role="alert">
            <Icon name="alert-circle" size={18} />
            <span>Your role does not include that page.</span>
          </div>
        )}
        <Flash params={params} />

        {(canUseDashboard(me) || canUseAdmin(me)) && (
          <section className="dacts">
            {canUseDashboard(me) && (
              <Link href="/dashboard" className="btn btn-primary">
                <Icon name="layout-dashboard" size={16} /> Committee dashboard
              </Link>
            )}
            {canUseAdmin(me) && (
              <a href="/admin" className="btn btn-secondary">
                Admin panel
              </a>
            )}
          </section>
        )}

        <section>
          <SectionTitle title="My registration" desc="You can see your application here. To change your details, contact the Secretary." />
          {records.docs.length ? (
            <div className="stack">
              {records.docs.map((r) => {
                const profile = profiles?.docs.find((p) => String(typeof p.record === 'object' ? p.record?.id : p.record) === String(r.id))
                return (
                  <div className="dcard" key={r.id}>
                    <div className="dsec-h" style={{ marginBottom: 12 }}>
                      <h3 className="h4" style={{ margin: 0 }}>
                        {r.fullName}
                      </h3>
                      <Tag value={r.applicationStatus} label={labelFor(REGISTRATION_STATUSES, r.applicationStatus)} />
                    </div>
                    <p className="muted" style={{ marginTop: 0 }}>
                      {STATUS_HELP[r.applicationStatus]}
                    </p>
                    <dl className="dl">
                      <dt>Submitted</dt>
                      <dd>{fmtDate(r.createdAt)}</dd>
                      <dt>Team</dt>
                      <dd>{labelFor(TEAMS, r.team) || '—'}</dd>
                      <dt>Position</dt>
                      <dd>{labelFor(PREFERRED_POSITIONS, r.position) || '—'}</dd>
                      <dt>Phone</dt>
                      <dd>{r.phone || '—'}</dd>
                      <dt>Email</dt>
                      <dd>{r.email || '—'}</dd>
                      {r.membershipStatus && (
                        <>
                          <dt>Membership</dt>
                          <dd>{labelFor(MEMBERSHIP_STATUSES, r.membershipStatus)}</dd>
                        </>
                      )}
                      {profile && (
                        <>
                          <dt>Public profile</dt>
                          <dd>
                            <Link href={profile.squadRole === 'guest' ? '/squad?pos=guests' : `/squad/${profile.slug}`} className="btn btn-tertiary">
                              View on the Squad page
                            </Link>
                          </dd>
                        </>
                      )}
                    </dl>
                    {r.applicationStatus === 'changes_requested' && (
                      <form action={resubmitRegistration} className="dform" style={{ marginTop: 24 }}>
                        <div className="notice notice-warn">
                          <Icon name="alert-circle" size={18} />
                          <span style={{ whiteSpace: 'pre-line' }}>{r.changesRequested || 'The club asked for changes.'}</span>
                        </div>
                        <input type="hidden" name="id" value={r.id} />
                        <Field label="Your reply" help="Say what you changed or answer the question.">
                          <textarea name="playerResponse" className="ctl" required maxLength={2000} />
                        </Field>
                        <div className="dform-row">
                          <Field label="Updated phone (optional)">
                            <input name="phone" className="ctl" inputMode="tel" autoComplete="tel" />
                          </Field>
                          <Field label="Updated email (optional)">
                            <input name="email" type="email" className="ctl" autoComplete="email" />
                          </Field>
                        </div>
                        <Field label="Updated home address (optional)">
                          <textarea name="address" className="ctl" maxLength={300} style={{ minHeight: 80 }} />
                        </Field>
                        <Submit icon="arrow-right">Send to the club</Submit>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <Empty>
              No registration is linked to this account.{' '}
              <Link href="/register" className="btn btn-tertiary">
                Register as a player
              </Link>
            </Empty>
          )}
        </section>

        {memberships.docs.length > 0 && (
          <section>
            <SectionTitle title="My membership" desc="Read-only. Contact the Secretary if anything is wrong." />
            {memberships.docs.map((m) => (
              <div className="dcard" key={m.id}>
                <dl className="dl">
                  <dt>Name</dt>
                  <dd>{m.fullName}</dd>
                  <dt>Type</dt>
                  <dd>{labelFor(MEMBERSHIP_TYPES, m.membershipType) || '—'}</dd>
                  <dt>Status</dt>
                  <dd>
                    <Tag value={m.membershipStatus} label={labelFor(MEMBERSHIP_STATUSES, m.membershipStatus)} />
                  </dd>
                  <dt>Joined</dt>
                  <dd>{fmtDate(m.joinedOn)}</dd>
                  <dt>Renewal due</dt>
                  <dd>{fmtDate(m.renewalDue)}</dd>
                </dl>
              </div>
            ))}
          </section>
        )}

        <section>
          <SectionTitle title="Sign-in" />
          <div className="dacts">
            <span className="muted">{me.email}</span>
            <Link href="/account/forgot" className="btn btn-tertiary">
              Change password
            </Link>
            <form action={logout}>
              <Submit variant="secondary" icon="log-out">
                Sign out
              </Submit>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
