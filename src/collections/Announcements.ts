import type { CollectionConfig, Where } from 'payload'
import { allow, allowField, canManageAnnouncements, nobodyField, type RoleUser } from '../access'
import { auditHooks, publishRule } from '../hooks/audit'
import { revalidateCollection } from '../hooks/revalidate'
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_STATUSES } from '../lib/constants'

const site = revalidateCollection(() => ['/', '/announcements'])
const audit = auditHooks({ label: (d) => d.title as string, status: [publishRule('status')] })
const stamp = { read: allowField(canManageAnnouncements), create: nobodyField, update: nobodyField }

/** Public filter shared by the access rule and the site's queries. */
export const livePublicAnnouncements = (): Where => ({
  and: [
    { status: { equals: 'published' } },
    { or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: new Date().toISOString() } }] },
  ],
})

/**
 * Committee announcements (spec §7). All five committee members and the Super Admin
 * create, edit, publish, unpublish and delete; the public sees published, unexpired ones.
 */
export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    group: 'Committee',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt', 'expiresAt'],
  },
  access: {
    read: ({ req: { user } }) => (canManageAnnouncements(user as RoleUser) ? true : livePublicAnnouncements()),
    create: allow(canManageAnnouncements),
    update: allow(canManageAnnouncements),
    delete: allow(canManageAnnouncements),
  },
  defaultSort: '-publishedAt',
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation, req }) => {
        const by = req.user?.id
        if (operation === 'create') data.createdBy = by
        data.lastModifiedBy = by
        if (data.status === 'published' && originalDoc?.status !== 'published') {
          data.publishedBy = by
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [...site.afterChange, ...audit.afterChange],
    afterDelete: [...site.afterDelete, ...audit.afterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 140 },
    { name: 'content', type: 'textarea', required: true, maxLength: 4000, admin: { rows: 10 } },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'club',
      options: ANNOUNCEMENT_CATEGORIES.map(({ label, value }) => ({ label, value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: ANNOUNCEMENT_STATUSES.map(({ label, value }) => ({ label, value })),
      admin: { position: 'sidebar' },
    },
    { name: 'publishedAt', type: 'date', index: true, access: { create: nobodyField, update: nobodyField }, admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'expiresAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'Optional. Hidden from the public after this time.' },
    },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', access: stamp, admin: { position: 'sidebar', readOnly: true } },
    { name: 'lastModifiedBy', type: 'relationship', relationTo: 'users', access: stamp, admin: { position: 'sidebar', readOnly: true } },
    { name: 'publishedBy', type: 'relationship', relationTo: 'users', access: stamp, admin: { position: 'sidebar', readOnly: true } },
  ],
}
