import Link from 'next/link'
import { canManageAnnouncements } from '@/access/roles'
import { Empty, Flash, fmtDate, SectionTitle, Tag } from '@/components/dash/ui'
import { Icon } from '@/components/kit/Icon'
import { requireUser } from '@/lib/auth'
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_STATUSES, labelFor } from '@/lib/constants'
import { dashContext } from '@/lib/dashboard'

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser(canManageAnnouncements, '/dashboard/announcements')
  const { payload, as } = await dashContext()
  const params = await searchParams
  const { docs } = await payload.find({ collection: 'announcements', sort: '-updatedAt', limit: 100, depth: 0, ...as })
  const now = Date.now()

  return (
    <section>
      <SectionTitle
        title="Announcements"
        desc="Any committee member can write, publish, unpublish and delete. Published announcements appear on the public Announcements page."
        actions={
          <Link className="btn btn-primary btn-sm" href="/dashboard/announcements/new">
            <Icon name="plus" size={16} /> New announcement
          </Link>
        }
      />
      <Flash params={params} />
      {docs.length ? (
        <div className="dtable-w">
          <table className="dtable">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Published</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((a) => {
                const expired = a.expiresAt && new Date(a.expiresAt).getTime() < now
                return (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/dashboard/announcements/${a.id}`}>{a.title}</Link>
                    </td>
                    <td className="muted">{labelFor(ANNOUNCEMENT_CATEGORIES, a.category)}</td>
                    <td>
                      <Tag value={expired ? 'inactive' : a.status} label={expired ? 'Expired' : labelFor(ANNOUNCEMENT_STATUSES, a.status)} />
                    </td>
                    <td className="muted">{fmtDate(a.publishedAt)}</td>
                    <td className="muted">{fmtDate(a.expiresAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No announcements yet.</Empty>
      )}
    </section>
  )
}
