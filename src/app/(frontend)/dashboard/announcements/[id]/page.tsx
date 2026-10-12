import Link from 'next/link'
import { notFound } from 'next/navigation'
import { canManageAnnouncements } from '@/access/roles'
import { Submit } from '@/components/dash/client'
import { Field, Flash, fmtDate, nameOf, SectionTitle, Select, Tag } from '@/components/dash/ui'
import { requireUser } from '@/lib/auth'
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_STATUSES, labelFor, TIME_ZONE } from '@/lib/constants'
import { dashContext } from '@/lib/dashboard'
import { deleteAnnouncement, saveAnnouncement } from '../../actions'

/** ISO → value for <input type="datetime-local"> in club time. */
const localInput = (iso: string | null | undefined) => {
  if (!iso) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const g = (t: string) => parts.find((p) => p.type === t)?.value
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`
}

export default async function AnnouncementEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  await requireUser(canManageAnnouncements, `/dashboard/announcements/${id}`)
  const { payload, as } = await dashContext()
  const flash = await searchParams
  const isNew = id === 'new'
  const a = isNew ? null : await payload.findByID({ collection: 'announcements', id, depth: 1, ...as }).catch(() => null)
  if (!isNew && !a) notFound()

  return (
    <section>
      <SectionTitle
        title={a ? 'Edit announcement' : 'New announcement'}
        desc={
          a ? (
            <>
              <Tag value={a.status} label={labelFor(ANNOUNCEMENT_STATUSES, a.status)} /> Created by {nameOf(a.createdBy)} · last edited by {nameOf(a.lastModifiedBy)}
              {a.publishedAt ? ` · published ${fmtDate(a.publishedAt, true)} by ${nameOf(a.publishedBy)}` : ''}
            </>
          ) : (
            'Saved as a draft until you publish it.'
          )
        }
        actions={
          <Link href="/dashboard/announcements" className="btn btn-tertiary">
            All announcements
          </Link>
        }
      />
      <Flash params={flash} />
      <div className="dcard">
        <form action={saveAnnouncement} className="dform">
          {a && <input type="hidden" name="id" value={a.id} />}
          <Field label="Title">
            <input name="title" className="ctl" required maxLength={140} defaultValue={a?.title} />
          </Field>
          <div className="dform-row">
            <Field label="Category">
              <Select name="category" required defaultValue={a?.category ?? 'club'} options={ANNOUNCEMENT_CATEGORIES} />
            </Field>
            <Field label="Expires" help="Hidden from the public after this time (IST).">
              <input name="expiresAt" type="datetime-local" className="ctl" defaultValue={localInput(a?.expiresAt)} />
            </Field>
          </div>
          <Field label="Announcement" help="Plain text. Blank lines start a new paragraph.">
            <textarea name="content" className="ctl" required maxLength={4000} rows={10} defaultValue={a?.content} />
          </Field>
          <p className="caption" style={{ margin: 0 }}>
            To add a featured image, open this announcement in the admin panel after saving.
          </p>
          <div className="dacts">
            <Submit name="intent" value="save" variant="secondary">
              Save draft
            </Submit>
            {a?.status !== 'published' ? (
              <Submit name="intent" value="publish" icon="megaphone">
                Publish
              </Submit>
            ) : (
              <>
                <Submit name="intent" value="save">
                  Save changes
                </Submit>
                <Submit name="intent" value="unpublish" variant="secondary">
                  Unpublish
                </Submit>
              </>
            )}
          </div>
        </form>
      </div>
      {a && (
        <form action={deleteAnnouncement} style={{ marginTop: 16 }}>
          <input type="hidden" name="id" value={a.id} />
          <Submit variant="tertiary" confirm="Delete this announcement? This cannot be undone; the deletion is recorded in the audit log.">
            Delete announcement
          </Submit>
        </form>
      )}
    </section>
  )
}
