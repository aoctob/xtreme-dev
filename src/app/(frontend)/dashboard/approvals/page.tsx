import Link from 'next/link'
import type { Where } from 'payload'
import { canManagePlayers, canViewPlayerRecords } from '@/access/roles'
import { RecordTable } from '@/components/dash/RecordTable'
import { Flash, SectionTitle } from '@/components/dash/ui'
import { requireUser } from '@/lib/auth'
import { dashContext } from '@/lib/dashboard'

const QUEUES = [
  { key: 'open', label: 'To review', where: { applicationStatus: { in: ['pending', 'under_review'] } } },
  { key: 'changes_requested', label: 'Waiting on player', where: { applicationStatus: { equals: 'changes_requested' } } },
  { key: 'approved', label: 'Approved', where: { applicationStatus: { equals: 'approved' } } },
  { key: 'rejected', label: 'Rejected', where: { applicationStatus: { equals: 'rejected' } } },
] as const

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser(canViewPlayerRecords, '/dashboard/approvals')
  const { user, payload, as } = await dashContext()
  const params = await searchParams
  const queue = QUEUES.find((q) => q.key === params.status) ?? QUEUES[0]
  const where: Where = { and: [queue.where as Where, { archived: { not_equals: true } }] }
  const { docs } = await payload.find({ collection: 'registrations', where, sort: queue.key === 'open' ? 'createdAt' : '-updatedAt', limit: 100, depth: 1, ...as })

  return (
    <section>
      <SectionTitle
        title="Player approvals"
        desc={
          canManagePlayers(user)
            ? 'Open a registration to review it, ask for changes, approve or reject. Approving never publishes a profile.'
            : 'Read-only. The Secretary and Joint Secretary approve registrations.'
        }
      />
      <Flash params={params} />
      <div className="dfilters chips" role="group" aria-label="Queue">
        {QUEUES.map((q) => (
          <Link key={q.key} href={`/dashboard/approvals?status=${q.key}`} className="chip" aria-current={q.key === queue.key}>
            {q.label}
          </Link>
        ))}
      </div>
      <RecordTable docs={docs} empty="Nothing in this queue." />
    </section>
  )
}
