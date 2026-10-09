import type { CollectionConfig } from 'payload'
import { anyone, staff } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { POSITIONS, SQUAD_ROLES } from '../lib/constants'

export const Players: CollectionConfig = {
  slug: 'players',
  admin: {
    useAsTitle: 'fullName',
    group: 'Club',
    defaultColumns: ['fullName', 'shirtNumber', 'position', 'isActive', 'consentOnFile'],
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  defaultSort: 'shirtNumber',
  hooks: revalidateCollection<{ slug?: string | null }>((doc) => [
    '/',
    '/squad',
    `/squad/${doc.slug}`,
  ]),
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
  ],
}
