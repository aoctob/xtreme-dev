import { canManageAppointments, COMMITTEE_POSITIONS, roleLabel } from '@/access/roles'
import { Submit } from '@/components/dash/client'
import { adminHref, Empty, Flash, fmtDate, nameOf, SectionTitle, Tag } from '@/components/dash/ui'
import { Icon } from '@/components/kit/Icon'
import { dashContext } from '@/lib/dashboard'
import type { CommitteeMember, Conservator, Mentor } from '@/payload-types'
import { endAppointment } from '../actions'

type Appt = CommitteeMember | Conservator | Mentor
type Slug = 'committee-members' | 'conservators' | 'mentors'
type Row = Appt | { vacant: string }

function EndForm({ collection, a }: { collection: Slug; a: Appt }) {
  return (
    <details>
      <summary className="btn btn-tertiary">End</summary>
      <form action={endAppointment} className="dform" style={{ marginTop: 8, minWidth: 240 }}>
        <input type="hidden" name="collection" value={collection} />
        <input type="hidden" name="id" value={a.id} />
        <textarea name="reason" className="ctl" placeholder="Handover note" aria-label="Handover note" maxLength={500} />
        <Submit variant="secondary" confirm={`End the appointment of ${a.name}? Their permissions are removed immediately.`}>
          End appointment
        </Submit>
      </form>
    </details>
  )
}

function Table({ rows, collection, manage, position }: { rows: Row[]; collection: Slug; manage: boolean; position?: boolean }) {
  return (
    <div className="dtable-w">
      <table className="dtable">
        <thead>
          <tr>
            {position && <th>Position</th>}
            <th>Name</th>
            <th>Since</th>
            {manage && <th>Login</th>}
            {manage && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) =>
            'vacant' in a ? (
              <tr key={`v${i}`}>
                {position && <td>{a.vacant}</td>}
                <td colSpan={manage ? 4 : 2}>
                  <Tag value="pending" label="Vacant" />
                </td>
              </tr>
            ) : (
              <tr key={a.id}>
                {position && <td>{roleLabel((a as CommitteeMember).position)}</td>}
                <td>{manage ? <a href={adminHref(collection, a.id)}>{a.name}</a> : a.name}</td>
                <td className="muted">{fmtDate(a.startDate)}</td>
                {manage && <td className="muted">{a.user ? nameOf(a.user) : 'Not linked'}</td>}
                {manage && (
                  <td>
                    <EndForm collection={collection} a={a} />
                  </td>
                )}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}

const KIND_LABEL: Record<Slug, string> = { 'committee-members': 'Committee', conservators: 'Conservator', mentors: 'Mentor' }

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { user, payload, as } = await dashContext()
  const params = await searchParams
  const manage = canManageAppointments(user)
  const active = { status: { equals: 'active' } }
  const [committee, conservators, mentors, ended] = await Promise.all([
    payload.find({ collection: 'committee-members', where: active, sort: 'order', limit: 10, depth: 1, ...as }),
    payload.find({ collection: 'conservators', where: active, sort: 'name', limit: 10, depth: 1, ...as }),
    payload.find({ collection: 'mentors', where: active, sort: 'name', limit: 10, depth: 1, ...as }),
    Promise.all(
      (['committee-members', 'conservators', 'mentors'] as const).map((c) =>
        payload
          .find({ collection: c, where: { status: { equals: 'ended' } }, sort: '-endDate', limit: 20, depth: 0, ...as })
          .then((r) => r.docs.map((d) => ({ doc: d as Appt, kind: c }))),
      ),
    ).then((x) => x.flat().sort((a, b) => String(b.doc.endDate ?? '').localeCompare(String(a.doc.endDate ?? '')))),
  ])

  const committeeRows: Row[] = COMMITTEE_POSITIONS.map((p) => committee.docs.find((d) => d.position === p.value) ?? { vacant: p.label })
  const pad = (docs: Appt[], n: number): Row[] => [...docs, ...Array.from({ length: Math.max(0, n - docs.length) }, () => ({ vacant: '' }))]
  const addBtn = (slug: Slug) =>
    manage && (
      <a className="btn btn-secondary btn-sm" href={adminHref(slug)}>
        <Icon name="plus" size={16} /> Appoint
      </a>
    )

  return (
    <>
      <section>
        <SectionTitle
          title="Committee"
          desc={
            manage
              ? 'An active appointment linked to a login gives that person the position’s permissions. Ending it removes them straight away. Nobody can appoint themselves.'
              : 'Managed by the President, Vice President and Super Admin.'
          }
          actions={addBtn('committee-members')}
        />
        <Flash params={params} />
        <Table rows={committeeRows} collection="committee-members" manage={manage} position />
      </section>
      <section>
        <SectionTitle title={`Conservators · ${conservators.totalDocs}/3`} actions={addBtn('conservators')} />
        <Table rows={pad(conservators.docs, 3)} collection="conservators" manage={manage} />
      </section>
      <section>
        <SectionTitle title={`Mentors · ${mentors.totalDocs}/2`} actions={addBtn('mentors')} />
        <Table rows={pad(mentors.docs, 2)} collection="mentors" manage={manage} />
      </section>
      <section>
        <SectionTitle title="Appointment history" />
        {ended.length ? (
          <div className="dtable-w">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>From</th>
                  <th>To</th>
                </tr>
              </thead>
              <tbody>
                {ended.map(({ doc, kind }) => (
                  <tr key={`${kind}${doc.id}`}>
                    <td>{doc.name}</td>
                    <td className="muted">{kind === 'committee-members' ? roleLabel((doc as CommitteeMember).position) : KIND_LABEL[kind]}</td>
                    <td className="muted">{fmtDate(doc.startDate)}</td>
                    <td className="muted">{fmtDate(doc.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No past appointments recorded.</Empty>
        )}
      </section>
    </>
  )
}
