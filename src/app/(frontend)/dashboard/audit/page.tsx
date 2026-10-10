import Link from 'next/link'
import type { Where } from 'payload'
import { canViewAudit } from '@/access/roles'
import { Empty, fmtDate, Select, SectionTitle } from '@/components/dash/ui'
import { AUDIT_ACTIONS } from '@/hooks/audit'
import { requireUser } from '@/lib/auth'
import { labelFor } from '@/lib/constants'
import { dashContext } from '@/lib/dashboard'

const AREAS = [
  { label: 'Player records', value: 'registrations' },
  { label: 'Public profiles', value: 'players' },
  { label: 'Members', value: 'members' },
  { label: 'Users and roles', value: 'users' },
  { label: 'Committee', value: 'committee-members' },
  { label: 'Conservators', value: 'conservators' },
  { label: 'Mentors', value: 'mentors' },
  { label: 'Announcements', value: 'announcements' },
  { label: 'Finance', value: 'financial-summaries' },
  { label: 'Documents', value: 'player-documents' },
]

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser(canViewAudit, '/dashboard/audit')
  const { payload, as } = await dashContext()
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const and: Where[] = []
  if (params.action) and.push({ action: { equals: params.action } })
  if (params.area) and.push({ targetCollection: { equals: params.area } })
  const res = await payload.find({ collection: 'audit-logs', where: and.length ? { and } : {}, sort: '-createdAt', limit: 50, page, depth: 0, ...as })
  const qs = (p: number) =>
    `?${new URLSearchParams({ ...(params.action ? { action: params.action } : {}), ...(params.area ? { area: params.area } : {}), page: String(p) })}`

  return (
    <section>
      <SectionTitle title="Audit log" desc="Approvals, publication changes, deletions, role changes and finance updates. Entries cannot be edited or deleted." />
      <form className="dfilters">
        <Select name="action" defaultValue={params.action} options={AUDIT_ACTIONS} ariaLabel="Action" />
        <Select name="area" defaultValue={params.area} options={AREAS} ariaLabel="Area" />
        <button className="btn btn-primary btn-sm" type="submit">
          Filter
        </button>
        <Link href="/dashboard/audit" className="btn btn-tertiary">
          Clear
        </Link>
      </form>
      {res.docs.length ? (
        <div className="dtable-w">
          <table className="dtable">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Record</th>
                <th>Details</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {res.docs.map((e) => (
                <tr key={e.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {fmtDate(e.createdAt, true)}
                  </td>
                  <td>{labelFor(AUDIT_ACTIONS, e.action)}</td>
                  <td>
                    {e.targetCollection === 'registrations' && e.recordId ? (
                      <Link href={`/dashboard/players/${e.recordId}`}>{e.recordLabel || e.recordId}</Link>
                    ) : (
                      e.recordLabel || e.recordId
                    )}
                    <div className="caption">{labelFor(AREAS, e.targetCollection) || e.targetCollection}</div>
                  </td>
                  <td className="muted">
                    {e.summary}
                    {e.reason && <div>“{e.reason}”</div>}
                  </td>
                  <td>
                    {e.actorName}
                    {e.actorRoles && <div className="caption">{e.actorRoles}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No entries.</Empty>
      )}
      {res.totalPages > 1 && (
        <div className="dacts" style={{ marginTop: 16 }}>
          {res.hasPrevPage && (
            <Link className="btn btn-secondary btn-sm" href={qs(page - 1)}>
              Newer
            </Link>
          )}
          <span className="muted">
            Page {page} of {res.totalPages}
          </span>
          {res.hasNextPage && (
            <Link className="btn btn-secondary btn-sm" href={qs(page + 1)}>
              Older
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
