import { APIError, type CollectionConfig, type Where } from 'payload'
import { allow, allowField, canManagePlayers, canViewPlayerRecords, canViewSensitivePlayerData, idOf, nobodyField, type RoleUser } from '../access'
import { slugField } from '../fields/slug'
import { auditHooks, publishRule } from '../hooks/audit'
import { revalidateCollection } from '../hooks/revalidate'
import { POSITIONS, PUBLICATION_STATUSES, SQUAD_ROLES } from '../lib/constants'

const site = revalidateCollection<{ slug?: string | null }>((doc) => ['/', '/squad', `/squad/${doc.slug}`])
const audit = auditHooks({ label: (d) => d.fullName as string, status: [publishRule('publicationStatus')] })

/**
 * Public player profiles (spec §4.2 `PublicPlayers`). Deliberately limited fields,
 * linked to the private Player record. The public API and the squad pages see
 * published profiles only; publishing needs an approved record.
 */
export const Players: CollectionConfig = {
  slug: 'players',
  labels: { singular: 'Public profile', plural: 'Public profiles' },
  admin: {
    useAsTitle: 'fullName',
    group: 'Players and members',
    defaultColumns: ['fullName', 'shirtNumber', 'position', 'publicationStatus', 'isActive'],
    description: 'What the public sees on the Squad pages. Only “Published” profiles appear.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (canViewPlayerRecords(user as RoleUser)) return true
      const where: Where = { publicationStatus: { equals: 'published' } }
      return where
    },
    create: allow(canManagePlayers),
    update: allow(canManagePlayers),
    delete: allow(canManagePlayers),
  },
  defaultSort: 'shirtNumber',
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const to = data.publicationStatus ?? originalDoc?.publicationStatus
        const from = originalDoc?.publicationStatus
        const recordId = idOf(data.record ?? originalDoc?.record)
        if (to === 'published' && recordId != null) {
          const record = await req.payload.findByID({ collection: 'registrations', id: recordId, depth: 0, overrideAccess: true, req })
          if (record.applicationStatus !== 'approved')
            throw new APIError('The player’s registration must be approved before the profile can be published.', 400, undefined, true)
        }
        if (to === 'published' && from !== 'published') {
          data.publishedAt = new Date().toISOString()
          data.publishedBy = req.user?.id
        }
        return data
      },
    ],
    afterChange: [...site.afterChange, ...audit.afterChange],
    afterDelete: [...site.afterDelete, ...audit.afterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'fullName', type: 'text', required: true },
        { name: 'shirtNumber', type: 'number', min: 1, max: 99 },
        {
          name: 'position',
          type: 'select',
          required: true,
          options: POSITIONS.map(({ label, value }) => ({ label, value })),
        },
      ],
    },
    slugField((d) => d.fullName as string | undefined),
    {
      type: 'row',
      fields: [
        {
          name: 'squadRole',
          type: 'select',
          required: true,
          defaultValue: 'squad',
          options: SQUAD_ROLES.map(({ label, value }) => ({ label, value })),
          admin: {
            description: 'Guest players featured in selected tournaments without joining the permanent squad.',
          },
        },
        {
          name: 'guestAppearances',
          type: 'number',
          min: 0,
          admin: { condition: (_, s) => s?.squadRole === 'guest' },
        },
        {
          name: 'guestEvent',
          type: 'text',
          admin: { condition: (_, s) => s?.squadRole === 'guest', description: 'e.g. "Winter Cup 2026"' },
        },
      ],
    },
    {
      name: 'consentOnFile',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Tick only when the club holds written consent to publish this player (parent/guardian consent for under-18s). A photo cannot be added until this is ticked.',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Portrait, 4:5 ratio, shoulders-up (PRD §F.4).' },
      validate: (value: unknown, { siblingData }: { siblingData: Partial<{ consentOnFile: boolean }> }) =>
        !value || siblingData?.consentOnFile === true || 'Tick "Consent on file" before adding a photo.',
    },
    {
      name: 'bio',
      type: 'textarea',
      maxLength: 300,
      admin: {
        description:
          'Facts only, 40 words or fewer: joined year, previous clubs, playing style as agreed with the player.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'dateOfBirth',
          type: 'date',
          access: { read: allowField(canViewSensitivePlayerData) },
          admin: {
            date: { pickerAppearance: 'dayOnly' },
            description: 'Stored for the club. Shown only as age, and only if "Show age" is ticked.',
          },
        },
        {
          name: 'showAge',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Club has approved showing the age.' },
        },
        { name: 'nationality', type: 'text' },
      ],
    },
    {
      name: 'stats',
      type: 'group',
      admin: {
        description: "Only from the club's own records. Leave empty to hide the stats row.",
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'appearances', type: 'number', min: 0 },
            { name: 'goals', type: 'number', min: 0 },
            { name: 'assists', type: 'number', min: 0 },
          ],
        },
      ],
    },
    {
      name: 'socialHandle',
      type: 'text',
      admin: { description: "Optional, only with the player's consent. Never for under-18s." },
    },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 6 },
    { name: 'isActive', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show on the home page (4–6 players).' },
    },
    {
      name: 'publicationStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: PUBLICATION_STATUSES.map(({ label, value }) => ({ label, value })),
      admin: { position: 'sidebar', description: 'Approval does not publish. Set “Published” when the public fields and photo are approved.' },
    },
    {
      name: 'record',
      label: 'Player record',
      type: 'relationship',
      relationTo: 'registrations',
      index: true,
      access: { read: allowField(canViewPlayerRecords) },
      admin: { position: 'sidebar', description: 'The private record this profile comes from. Required before publishing new players.' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      access: { read: allowField(canViewPlayerRecords), create: nobodyField, update: nobodyField },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'publishedBy',
      type: 'relationship',
      relationTo: 'users',
      access: { read: allowField(canViewPlayerRecords), create: nobodyField, update: nobodyField },
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
