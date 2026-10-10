import Link from 'next/link'
import { notFound } from 'next/navigation'
import { canManagePlayers, canViewAudit, canViewPlayerRecords, idOf } from '@/access/roles'
import { InviteLogin, Submit } from '@/components/dash/client'
import { adminHref, Empty, Field, Flash, fmtDate, nameOf, SectionTitle, Select, Tag } from '@/components/dash/ui'
import { AUDIT_ACTIONS } from '@/hooks/audit'
import { requireUser } from '@/lib/auth'
import {
  FEET,
  labelFor,
  MEMBERSHIP_STATUSES,
  POSITIONS,
  PREFERRED_POSITIONS,
  PUBLICATION_STATUSES,
  REGISTRATION_MODES,
  REGISTRATION_STATUSES,
  TEAMS,
} from '@/lib/constants'
import { dashContext } from '@/lib/dashboard'
import type { RegistrationPhoto } from '@/payload-types'
import {
  inviteLogin,
  preparePublicProfile,
  saveReviewNotes,
  setApplicationStatus,
  setArchived,
  setPublication,
} from '../../actions'

const PREFERRED_TO_POSITION: Record<string, string> = { gk: 'goalkeeper', defender: 'defender', midfielder: 'midfielder', forward: 'forward' }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined) return null
  return (
    <>
      <dt>{label}</dt>
      <dd>{value === null || value === '' ? '—' : value}</dd>
    </>
  )
}

export default async function PlayerRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  await requireUser(canViewPlayerRecords, `/dashboard/players/${id}`)
  const { user, payload, as } = await dashContext()
  const flash = await searchParams
  const r = await payload.findByID({ collection: 'registrations', id, depth: 1, ...as }).catch(() => null)
  if (!r) notFound()

  const manage = canManagePlayers(user)
  const [profiles, history] = await Promise.all([
    payload.find({ collection: 'players', where: { record: { equals: r.id } }, depth: 0, limit: 5, ...as }),
    canViewAudit(user)
      ? payload.find({
          collection: 'audit-logs',
          where: { and: [{ targetCollection: { equals: 'registrations' } }, { recordId: { equals: String(r.id) } }] },
          sort: '-createdAt',
          limit: 50,
          depth: 0,
          ...as,
        })
      : null,
  ])
  const profile = profiles.docs[0]
  const photo = r.photo && typeof r.photo === 'object' ? (r.photo as RegistrationPhoto) : null
  const back = `/dashboard/players/${r.id}`
  const status = r.applicationStatus

  return (
    <>
      <section>
        <SectionTitle
          title={r.fullName}
          desc={
            <>
              <Tag value={status} label={labelFor(REGISTRATION_STATUSES, status)} />{' '}
              {r.membershipStatus && <Tag value={r.membershipStatus} label={`Membership: ${labelFor(MEMBERSHIP_STATUSES, r.membershipStatus)}`} />}{' '}
              {r.archived && <Tag value="inactive" label="Archived" />}
            </>
          }
          actions={
            <>
              <Link href="/dashboard/players" className="btn btn-tertiary">
                All players
              </Link>
              {manage && (
                <a href={adminHref('registrations', r.id)} className="btn btn-secondary btn-sm">
                  Edit details
                </a>
              )}
            </>
          }
        />
        <Flash params={flash} />
      </section>

      <div className="dgrid">
        <div className="dmain">
          <div className="dcard">
            <h3>Application</h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {photo?.url && (
                // Served through Payload's access check, never from a public URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.sizes?.thumb?.url || photo.url} alt={`Photo of ${r.fullName}`} className="dphoto" />
              )}
              <dl className="dl" style={{ flex: 1, minWidth: 260 }}>
                <Row label="Registered by" value={labelFor(REGISTRATION_MODES, r.mode)} />
                {r.mode === 'committee' && <Row label="Committee member" value={[r.registeredBy?.name, r.registeredBy?.phone].filter(Boolean).join(' · ')} />}
                <Row label="Date of birth" value={r.dateOfBirth === undefined ? undefined : fmtDate(r.dateOfBirth)} />
                <Row label="Phone" value={r.phone} />
                <Row label="Email" value={r.email} />
                <Row label="Address" value={r.address} />
                {r.isMinor && <Row label="Guardian" value={r.guardian === undefined ? undefined : [r.guardian?.name, r.guardian?.phone].filter(Boolean).join(' · ')} />}
                <Row label="Team" value={labelFor(TEAMS, r.team)} />
                <Row label="Position" value={[labelFor(PREFERRED_POSITIONS, r.position), labelFor(PREFERRED_POSITIONS, r.secondPosition)].filter(Boolean).join(' / ')} />
                <Row label="Preferred foot" value={labelFor(FEET, r.foot)} />
                <Row label="Shirt number" value={r.shirtNumber ?? null} />
                <Row label="Previous club" value={r.previousClub} />
                <Row label="Emergency contact" value={r.emergency === undefined ? undefined : [r.emergency?.name, r.emergency?.relationship, r.emergency?.phone].filter(Boolean).join(' · ')} />
                <Row label="Medical" value={r.medical} />
                <Row label="Documents" value={r.documents === undefined ? undefined : `${(r.documents ?? []).length} on file`} />
                <Row label="Submitted" value={fmtDate(r.createdAt, true)} />
              </dl>
            </div>
            {r.dateOfBirth === undefined && (
              <p className="caption" style={{ marginTop: 16 }}>
                Personal details are hidden for your role.
              </p>
            )}
          </div>

          {(r.changesRequested || r.playerResponse) && (
            <div className="dcard">
              <h3>Correction request</h3>
              <dl className="dl">
                <Row label="Asked of player" value={r.changesRequested} />
                <Row label="Player replied" value={r.playerResponse} />
                <Row label="Resubmitted" value={r.resubmittedAt ? fmtDate(r.resubmittedAt, true) : null} />
              </dl>
            </div>
          )}

          {history && (
            <div className="dcard">
              <h3>Decision history</h3>
              {history.docs.length ? (
                <ul className="dtimeline">
                  {history.docs.map((e) => (
                    <li key={e.id}>
                      <i />
                      <div>
                        <strong>{labelFor(AUDIT_ACTIONS, e.action)}</strong>
                        {e.summary && <span className="muted"> · {e.summary}</span>}
                        {e.reason && <div className="muted">“{e.reason}”</div>}
                        <small>
                          {e.actorName}
                          {e.actorRoles ? ` (${e.actorRoles})` : ''} · {fmtDate(e.createdAt, true)}
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No history yet.</Empty>
              )}
            </div>
          )}
        </div>

        <div className="dmain">
          <div className="dcard">
            <h3>Decision</h3>
            <dl className="dl" style={{ marginBottom: manage ? 20 : 0 }}>
              <Row label="Reviewed by" value={r.reviewedBy ? `${nameOf(r.reviewedBy)} · ${fmtDate(r.reviewedAt, true)}` : null} />
              <Row label="Approved by" value={r.approvedBy ? `${nameOf(r.approvedBy)} · ${fmtDate(r.approvedAt, true)}` : null} />
              <Row label="Rejection reason" value={r.rejectionReason} />
            </dl>
            {manage ? (
              <div className="stack">
                {status === 'pending' && (
                  <form action={setApplicationStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="under_review" />
                    <Submit variant="secondary">Start review</Submit>
                  </form>
                )}
                {status !== 'approved' && (
                  <form action={setApplicationStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="approved" />
                    <Submit icon="check" confirm={`Approve ${r.fullName}? This does not publish a public profile.`}>
                      Approve
                    </Submit>
                  </form>
                )}
                <details>
                  <summary className="btn btn-tertiary">Request changes</summary>
                  <form action={setApplicationStatus} className="dform" style={{ marginTop: 12 }}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="changes_requested" />
                    <Field label="What needs to change" help="The player sees this on their account page.">
                      <textarea name="message" className="ctl" required maxLength={2000} defaultValue={r.changesRequested ?? ''} />
                    </Field>
                    <Submit variant="secondary">Send request</Submit>
                  </form>
                </details>
                {status !== 'rejected' && (
                  <details>
                    <summary className="btn btn-tertiary">Reject</summary>
                    <form action={setApplicationStatus} className="dform" style={{ marginTop: 12 }}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <Field label="Reason" help="Kept internal. Not shown to the player.">
                        <textarea name="message" className="ctl" required maxLength={2000} />
                      </Field>
                      <Submit variant="secondary" confirm={`Reject ${r.fullName}?`}>
                        Reject application
                      </Submit>
                    </form>
                  </details>
                )}
              </div>
            ) : (
              <p className="caption">Only the Secretary and Joint Secretary make decisions. Your access is read-only.</p>
            )}
          </div>

          {r.reviewNotes !== undefined && (
            <div className="dcard">
              <h3>Internal notes</h3>
              {manage ? (
                <form action={saveReviewNotes} className="dform">
                  <input type="hidden" name="id" value={r.id} />
                  <textarea name="reviewNotes" className="ctl" defaultValue={r.reviewNotes ?? ''} aria-label="Internal review notes" maxLength={4000} />
                  <Submit variant="secondary">Save notes</Submit>
                </form>
              ) : (
                <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{r.reviewNotes || '—'}</p>
              )}
            </div>
          )}

          <div className="dcard">
            <h3>Public profile</h3>
            {profile ? (
              <div className="stack">
                <div>
                  <Tag value={profile.publicationStatus} label={labelFor(PUBLICATION_STATUSES, profile.publicationStatus)} />{' '}
                  <span className="muted">
                    {profile.fullName} · {labelFor(POSITIONS, profile.position)}
                    {profile.shirtNumber ? ` · #${profile.shirtNumber}` : ''}
                  </span>
                </div>
                {manage && (
                  <div className="dacts">
                    <a href={adminHref('players', profile.id)} className="btn btn-secondary btn-sm">
                      Edit profile
                    </a>
                    {profile.publicationStatus !== 'published' ? (
                      <form action={setPublication}>
                        <input type="hidden" name="id" value={profile.id} />
                        <input type="hidden" name="status" value="published" />
                        <input type="hidden" name="back" value={back} />
                        <Submit confirm="Publish this profile on the public Squad page? Check the photo and fields are approved for publication.">Publish</Submit>
                      </form>
                    ) : (
                      <form action={setPublication}>
                        <input type="hidden" name="id" value={profile.id} />
                        <input type="hidden" name="status" value="unpublished" />
                        <input type="hidden" name="back" value={back} />
                        <Submit variant="secondary">Unpublish</Submit>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : status === 'approved' && manage ? (
              <form action={preparePublicProfile} className="dform">
                <input type="hidden" name="id" value={r.id} />
                <p className="caption" style={{ margin: 0 }}>
                  Prepare the limited public profile. It starts as a draft; nothing is public until you publish it.
                </p>
                <Field label="Display name">
                  <input name="fullName" className="ctl" defaultValue={r.fullName} maxLength={100} required />
                </Field>
                <div className="dform-row">
                  <Field label="Position">
                    <Select name="position" required defaultValue={PREFERRED_TO_POSITION[r.position ?? ''] ?? 'midfielder'} options={POSITIONS} />
                  </Field>
                  <Field label="Shirt number">
                    <input name="shirtNumber" className="ctl" type="number" min={1} max={99} defaultValue={r.shirtNumber ?? undefined} />
                  </Field>
                </div>
                <Submit variant="secondary">Create draft profile</Submit>
              </form>
            ) : (
              <p className="caption" style={{ margin: 0 }}>
                {status === 'approved' ? 'No public profile yet.' : 'A public profile can be prepared once the registration is approved.'}
              </p>
            )}
          </div>

          <div className="dcard">
            <h3>Player login</h3>
            {idOf(r.user) ? (
              <p style={{ margin: 0 }}>Linked to {nameOf(r.user)}. They can follow this application at /account.</p>
            ) : manage ? (
              <>
                <p className="caption" style={{ marginTop: 0 }}>
                  Give the player an account so they can see their status and answer correction requests. They cannot edit their record.
                </p>
                <InviteLogin action={inviteLogin.bind(null, 'registrations', String(r.id))} />
              </>
            ) : (
              <p className="caption" style={{ margin: 0 }}>
                No login linked.
              </p>
            )}
          </div>

          {manage && (
            <form action={setArchived}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="collection" value="registrations" />
              <input type="hidden" name="archived" value={r.archived ? 'false' : 'true'} />
              <input type="hidden" name="back" value={back} />
              <Submit variant="tertiary" confirm={r.archived ? undefined : 'Archive this record? It stays as history and can be restored.'}>
                {r.archived ? 'Restore record' : 'Archive record'}
              </Submit>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
