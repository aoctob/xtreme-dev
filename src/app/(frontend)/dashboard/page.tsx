import Link from 'next/link'
import {
  canManageAnnouncements,
  canManagePlayers,
  canViewAudit,
  canViewFinance,
  canViewMembers,
  canViewPlayerRecords,
} from '@/access/roles'
import { Empty, fmtDate, fmtMoney, SectionTitle, Stat } from '@/components/dash/ui'
import { labelFor } from '@/lib/constants'
import { AUDIT_ACTIONS } from '@/hooks/audit'
import { dashContext } from '@/lib/dashboard'

export default async function DashboardOverview() {
  const { user, payload, as } = await dashContext()
  const count = (collection: Parameters<typeof payload.count>[0]['collection'], where: object) =>
    payload.count({ collection, where: where as never, ...as }).then((r) => r.totalDocs)

  const players = canViewPlayerRecords(user)
  const [queue, changes, approved, published, members, drafts, finance, recent] = await Promise.all([
    players ? count('registrations', { applicationStatus: { in: ['pending', 'under_review'] }, archived: { not_equals: true } }) : null,
    players ? count('registrations', { applicationStatus: { equals: 'changes_requested' } }) : null,
    players ? count('registrations', { applicationStatus: { equals: 'approved' }, archived: { not_equals: true } }) : null,
    players ? count('players', { publicationStatus: { equals: 'published' } }) : null,
    canViewMembers(user) ? count('members', { membershipStatus: { equals: 'active' } }) : null,
    canManageAnnouncements(user) ? count('announcements', { status: { not_equals: 'published' } }) : null,
    canViewFinance(user)
      ? payload.find({ collection: 'financial-summaries', sort: '-periodStart', limit: 1, depth: 0, ...as }).then((r) => r.docs[0] ?? null)
      : null,
    canViewAudit(user)
      ? payload.find({ collection: 'audit-logs', sort: '-createdAt', limit: 8, depth: 0, ...as }).then((r) => r.docs)
      : null,
  ])

  return (
    <>
      <section>
        <SectionTitle
          title="Overview"
          desc={
            canManagePlayers(user)
              ? 'Registrations waiting for you, and the state of the club at a glance.'
              : 'A read-only view of the club. What you see here follows your role.'
          }
        />
        <div className="dstats">
          {queue !== null && <Stat value={queue} label="Waiting for review" href="/dashboard/approvals" alert={queue > 0} />}
          {changes !== null && <Stat value={changes} label="Waiting on the player" href="/dashboard/approvals?status=changes_requested" />}
          {approved !== null && <Stat value={approved} label="Approved players" href="/dashboard/players?status=approved" />}
          {published !== null && <Stat value={published} label="Published profiles" href="/squad" />}
          {members !== null && <Stat value={members} label="Active members" href="/dashboard/members" />}
          {drafts !== null && <Stat value={drafts} label="Unpublished announcements" href="/dashboard/announcements" />}
          {finance && <Stat small value={fmtMoney(finance.closingBalance)} label={`Closing balance · ${finance.period}`} href="/dashboard/finance" />}
        </div>
      </section>

      {recent && (
        <section>
          <SectionTitle
            title="Recent activity"
            actions={
              <Link href="/dashboard/audit" className="btn btn-tertiary">
                Full audit log
              </Link>
            }
          />
          {recent.length ? (
            <div className="dcard">
              <ul className="dtimeline">
                {recent.map((e) => (
                  <li key={e.id}>
                    <i />
                    <div>
                      <strong>{labelFor(AUDIT_ACTIONS, e.action)}</strong> · {e.recordLabel || e.targetCollection}
                      {e.summary && <span className="muted"> · {e.summary}</span>}
                      <small>
                        {e.actorName} · {fmtDate(e.createdAt, true)}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Empty>Nothing has happened yet.</Empty>
          )}
        </section>
      )}
    </>
  )
}
