import { APIError, type CollectionConfig, type Field, type Where } from 'payload'
import { allow, allowField, canManageAppointments, canUseDashboard, COMMITTEE_POSITIONS, idOf, isSuperAdmin, sameId, type RoleUser } from '../access'
import { auditHooks } from '../hooks/audit'
import { revalidateCollection } from '../hooks/revalidate'
import { syncPositions } from './Users'

type Kind = 'committee-members' | 'conservators' | 'mentors'

/**
 * Committee members, conservators and mentors (spec §6). President, Vice President and
 * Super Admin manage them. An active appointment linked to a login gives that user the
 * position's powers; ending or deleting it takes them away on the next request.
 * The public sees name, position, photo and bio of active appointments only.
 */
function appointmentCollection({
  slug,
  singular,
  plural,
  maxActive,
  extraFields = [],
  description,
}: {
  slug: Kind
  singular: string
  plural: string
  maxActive: number
  extraFields?: Field[]
  description: string
}): CollectionConfig {
  const manage = allow(canManageAppointments)
  const audit = auditHooks({
    label: (d) => d.name as string,
    status: [{ field: 'status', action: (to) => (to === 'active' ? 'appoint' : 'end-appointment') }],
    createAction: (d) => (d.status === 'active' ? 'appoint' : 'create'),
  })
  const site = revalidateCollection(() => ['/about'])
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Appointments',
      useAsTitle: 'name',
      defaultColumns: ['name', ...(slug === 'committee-members' ? ['position'] : []), 'status', 'startDate', 'user'],
      description,
    },
    access: {
      read: ({ req: { user } }) => {
        if (canUseDashboard(user as RoleUser)) return true
        const where: Where = { status: { equals: 'active' } }
        return where
      },
      create: manage,
      update: manage,
      delete: manage,
    },
    defaultSort: slug === 'committee-members' ? 'order' : 'name',
    hooks: {
      beforeChange: [
        async ({ data, originalDoc, operation, req }) => {
          const actor = req.user as RoleUser
          const next = { ...originalDoc, ...data }
          // Nobody can appoint themselves (spec §6: no self-granted permissions).
          if (actor && !isSuperAdmin(actor) && sameId(next.user, actor) && (operation === 'create' || !sameId(originalDoc?.user, next.user)))
            throw new APIError('You cannot link an appointment to your own account.', 403, undefined, true)
          if (next.status === 'active') {
            const clash: Where[] = [{ status: { equals: 'active' } }]
            if (originalDoc?.id) clash.push({ id: { not_equals: originalDoc.id } })
            if (slug === 'committee-members') {
              const { totalDocs } = await req.payload.count({
                collection: slug,
                where: { and: [...clash, { position: { equals: next.position } }] },
                overrideAccess: true,
                req,
              })
              if (totalDocs > 0)
                throw new APIError(
                  `There is already an active ${COMMITTEE_POSITIONS.find((p) => p.value === next.position)?.label}. End that appointment first.`,
                  400,
                  undefined,
                  true,
                )
            } else {
              const { totalDocs } = await req.payload.count({ collection: slug, where: { and: clash }, overrideAccess: true, req })
              if (totalDocs >= maxActive)
                throw new APIError(`The club has ${maxActive} ${plural.toLowerCase()} positions and they are all filled.`, 400, undefined, true)
            }
          }
          if (operation === 'create') data.appointedBy = actor?.id
          if (originalDoc?.status === 'active' && data.status === 'ended') {
            data.endedBy = actor?.id
            data.endDate ??= new Date().toISOString()
          }
          return data
        },
      ],
      afterChange: [
        ...audit.afterChange,
        ...site.afterChange,
        async ({ doc, previousDoc, req }) => {
          await syncPositions(req, idOf(doc.user))
          if (previousDoc && !sameId(previousDoc.user, doc.user)) await syncPositions(req, idOf(previousDoc.user))
          return doc
        },
      ],
      afterDelete: [
        ...audit.afterDelete,
        ...site.afterDelete,
        async ({ doc, req }) => {
          await syncPositions(req, idOf(doc.user))
          return doc
        },
      ],
    },
    fields: [
      { name: 'name', type: 'text', required: true },
      ...extraFields,
      {
        name: 'status',
        type: 'select',
        required: true,
        defaultValue: 'active',
        index: true,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Ended', value: 'ended' },
        ],
        admin: { position: 'sidebar', description: 'Ending an appointment removes its permissions straight away. The record stays as history.' },
      },
      {
        name: 'user',
        label: 'Login account',
        type: 'relationship',
        relationTo: 'users',
        access: { read: allowField(canManageAppointments) },
        admin: {
          position: 'sidebar',
          description: 'The account that gets this position’s permissions. Leave empty for a public listing only.',
        },
      },
      {
        type: 'row',
        fields: [
          { name: 'startDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
          { name: 'endDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        ],
      },
      { name: 'photo', type: 'upload', relationTo: 'media' },
      { name: 'bio', type: 'textarea', maxLength: 400, admin: { description: 'Public biography (optional).' } },
      {
        name: 'handoverNotes',
        type: 'textarea',
        access: { read: allowField(canManageAppointments) },
        admin: { description: 'Private: vacancy and handover notes for the next holder.' },
      },
      {
        name: 'appointedBy',
        type: 'relationship',
        relationTo: 'users',
        access: { read: allowField(canManageAppointments), create: () => false, update: () => false },
        admin: { readOnly: true, position: 'sidebar' },
      },
      {
        name: 'endedBy',
        type: 'relationship',
        relationTo: 'users',
        access: { read: allowField(canManageAppointments), create: () => false, update: () => false },
        admin: { readOnly: true, position: 'sidebar', condition: (d) => d?.status === 'ended' },
      },
    ],
  }
}

export const CommitteeMembers = appointmentCollection({
  slug: 'committee-members',
  singular: 'Committee member',
  plural: 'Committee members',
  maxActive: 5,
  description: 'The five committee positions. Managed by the President, Vice President and Super Admin.',
  extraFields: [
    {
      type: 'row',
      fields: [
        {
          name: 'position',
          type: 'select',
          required: true,
          index: true,
          options: COMMITTEE_POSITIONS.map(({ label, value }) => ({ label, value })),
        },
        { name: 'order', type: 'number', defaultValue: 0, admin: { description: 'Lower numbers show first.' } },
      ],
    },
  ],
})

export const Conservators = appointmentCollection({
  slug: 'conservators',
  singular: 'Conservator',
  plural: 'Conservators',
  maxActive: 3,
  description: 'Three conservator positions with read-only oversight of player data and finances.',
})

export const Mentors = appointmentCollection({
  slug: 'mentors',
  singular: 'Mentor',
  plural: 'Mentors',
  maxActive: 2,
  description: 'Two committee mentor positions. They advise the committee and have read-only access.',
})
