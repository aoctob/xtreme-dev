import Link from 'next/link'
import type { Registration } from '@/payload-types'
import { labelFor, PREFERRED_POSITIONS, REGISTRATION_STATUSES, TEAMS } from '@/lib/constants'
import { Empty, fmtDate, nameOf, Tag } from './ui'

export function RecordTable({ docs, empty }: { docs: Registration[]; empty: string }) {
  if (!docs.length) return <Empty>{empty}</Empty>
  return (
    <div className="dtable-w">
      <table className="dtable">
        <thead>
          <tr>
            <th>Player</th>
            <th>Team</th>
            <th>Position</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>Reviewer</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/dashboard/players/${r.id}`}>{r.fullName}</Link>
                {r.archived && <span className="rtag" style={{ marginLeft: 8 }}>Archived</span>}
              </td>
              <td className="muted">{labelFor(TEAMS, r.team) || '—'}</td>
              <td className="muted">{labelFor(PREFERRED_POSITIONS, r.position) || '—'}</td>
              <td className="muted">{fmtDate(r.createdAt)}</td>
              <td>
                <Tag value={r.applicationStatus} label={labelFor(REGISTRATION_STATUSES, r.applicationStatus)} />
              </td>
              <td className="muted">{r.reviewedBy ? nameOf(r.reviewedBy) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
