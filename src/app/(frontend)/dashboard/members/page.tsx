import Link from 'next/link'
import type { Where } from 'payload'
import { canManageMembers, canViewMembers, idOf } from '@/access/roles'
import { InviteLogin } from '@/components/dash/client'
import { adminHref, Empty, Flash, fmtDate, Select, SectionTitle, Tag } from '@/components/dash/ui'
import { Icon } from '@/components/kit/Icon'
import { requireUser } from '@/lib/auth'
import { labelFor, MEMBERSHIP_STATUSES, MEMBERSHIP_TYPES } from '@/lib/constants'
import { dashContext } from '@/lib/dashboard'
import { inviteLogin } from '../actions'

export default async function MembersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser(canViewMembers, '/dashboard/members')
  const { user, payload, as } = await dashContext()
  const params = await searchParams
  const manage = canManageMembers(user)
  const and: Where[] = [{ archived: { not_equals: true } }]
  if (params.q) and.push({ or: [{ fullName: { like: params.q } }, { phone: { like: params.q } }] })
  if (params.status) and.push({ membershipStatus: { equals: params.status } })
  const { docs, totalDocs } = await payload.find({ collection: 'members', where: { and }, sort: 'fullName', limit: 200, depth: 0, ...as })

  return (
    <section>
      <SectionTitle
        title="Members"
        desc={`${totalDocs} member${totalDocs === 1 ? '' : 's'}. ${manage ? 'Add or edit members in the admin panel.' : 'Read-only for your role.'}`}
        actions={
          manage && (
            <a className="btn btn-secondary btn-sm" href={adminHref('members')}>
              <Icon name="plus" size={16} /> Add member
            </a>
          )
        }
      />
      <Flash params={params} />
      <form className="dfilters" role="search">
        <input className="ctl" type="search" name="q" defaultValue={params.q} placeholder="Search name or phone" aria-label="Search members" />
        <Select name="status" defaultValue={params.status} options={MEMBERSHIP_STATUSES} ariaLabel="Membership status" />
        <button className="btn btn-primary btn-sm" type="submit">
          Filter
        </button>
        <Link href="/dashboard/members" className="btn btn-tertiary">
          Clear
        </Link>
      </form>
      {docs.length ? (
        <div className="dtable-w">
          <table className="dtable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Renewal due</th>
                <th>Login</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((m) => (
                <tr key={m.id}>
                  <td>{manage ? <a href={adminHref('members', m.id)}>{m.fullName}</a> : m.fullName}</td>
                  <td className="muted">{labelFor(MEMBERSHIP_TYPES, m.membershipType) || '—'}</td>
                  <td>
                    <Tag value={m.membershipStatus} label={labelFor(MEMBERSHIP_STATUSES, m.membershipStatus)} />
                  </td>
                  <td className="muted">{fmtDate(m.joinedOn)}</td>
                  <td className="muted">{fmtDate(m.renewalDue)}</td>
                  <td style={{ minWidth: 180 }}>
                    {idOf(m.user) ? (
                      <span className="muted">Linked</span>
                    ) : manage && m.email ? (
                      <InviteLogin action={inviteLogin.bind(null, 'members', String(m.id))} />
                    ) : (
                      <span className="muted">{m.email ? '—' : 'No email'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No members match.</Empty>
      )}
    </section>
  )
}
