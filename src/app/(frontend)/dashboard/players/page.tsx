import Link from 'next/link'
import type { Where } from 'payload'
import { canManagePlayers, canViewPlayerRecords } from '@/access/roles'
import { RecordTable } from '@/components/dash/RecordTable'
import { Flash, Select, SectionTitle } from '@/components/dash/ui'
import { Icon } from '@/components/kit/Icon'
import { REGISTRATION_STATUSES, TEAMS } from '@/lib/constants'
import { requireUser } from '@/lib/auth'
import { dashContext } from '@/lib/dashboard'

export default async function PlayersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser(canViewPlayerRecords, '/dashboard/players')
  const { user, payload, as } = await dashContext()
  const params = await searchParams
  const and: Where[] = []
  if (params.q) and.push({ or: [{ fullName: { like: params.q } }, { phone: { like: params.q } }] })
  if (params.status) and.push({ applicationStatus: { equals: params.status } })
  if (params.team) and.push({ team: { equals: params.team } })
  if (params.archived !== '1') and.push({ archived: { not_equals: true } })
  const { docs, totalDocs } = await payload.find({ collection: 'registrations', where: and.length ? { and } : {}, sort: 'fullName', limit: 200, depth: 1, ...as })

  return (
    <section>
      <SectionTitle
        title="Player records"
        desc={`${totalDocs} record${totalDocs === 1 ? '' : 's'}. Private: never shown on the public site.`}
        actions={
          canManagePlayers(user) && (
            // Committee registrations go through the same form and checks as players use.
            <Link className="btn btn-secondary btn-sm" href="/register">
              <Icon name="plus" size={16} /> Register a player
            </Link>
          )
        }
      />
      <Flash params={params} />
      <form className="dfilters" role="search">
        <input className="ctl" type="search" name="q" defaultValue={params.q} placeholder="Search name or phone" aria-label="Search players" />
        <Select name="status" defaultValue={params.status} options={REGISTRATION_STATUSES} ariaLabel="Status" />
        <Select name="team" defaultValue={params.team} options={TEAMS} ariaLabel="Team" />
        <label className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" name="archived" value="1" defaultChecked={params.archived === '1'} /> Archived
        </label>
        <button className="btn btn-primary btn-sm" type="submit">
          Filter
        </button>
        <Link href="/dashboard/players" className="btn btn-tertiary">
          Clear
        </Link>
      </form>
      <RecordTable docs={docs} empty="No player records match." />
    </section>
  )
}
