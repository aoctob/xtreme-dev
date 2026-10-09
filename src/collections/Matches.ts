import type { CollectionConfig } from 'payload'
import { publishedOrStaff, staff } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { MATCH_STATUSES } from '../lib/constants'

export const Matches: CollectionConfig = {
  slug: 'matches',
  labels: { singular: 'Match', plural: 'Matches' },
  admin: {
    useAsTitle: 'opponentName',
    group: 'Club',
    defaultColumns: ['opponentName', 'kickoffUtc', 'competition', 'status', 'scoreFor', 'scoreAgainst'],
    description: 'Fixtures and results. Times are entered in your local time and shown on the site in IST.',
    preview: (doc) =>
      doc?.slug ? `/preview?path=${encodeURIComponent(`/fixtures/${doc.slug}`)}` : null,
  },
  access: { read: publishedOrStaff, create: staff, update: staff, delete: staff },
  defaultSort: '-kickoffUtc',
  versions: { drafts: true, maxPerDoc: 20 },
  hooks: revalidateCollection<{ slug?: string | null }>((doc) => [
    '/',
    '/fixtures',
    `/fixtures/${doc.slug}`,
  ]),
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'opponentName', type: 'text', required: true },
        {
          name: 'homeOrAway',
          type: 'select',
          required: true,
          defaultValue: 'home',
          options: [
            { label: 'Home', value: 'home' },
            { label: 'Away', value: 'away' },
          ],
        },
      ],
    },
    {
      name: 'kickoffUtc',
      label: 'Kickoff',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayAndTime', timeIntervals: 15 } },
    },
    slugField((d) => {
      if (!d.opponentName) return undefined
      const date = d.kickoffUtc ? new Date(String(d.kickoffUtc)).toISOString().slice(0, 10) : ''
      return `${d.opponentName} ${date}`
    }),
    {
      type: 'row',
      fields: [
        { name: 'competition', type: 'text', admin: { description: 'e.g. league or friendly.' } },
        { name: 'venueName', type: 'text' },
        {
          name: 'venueMapUrl',
          type: 'text',
          admin: { description: 'Google Maps link for "Get directions".' },
        },
      ],
    },
    { name: 'opponentCrest', type: 'upload', relationTo: 'media' },
    {
      name: 'status',
      type: 'select',
      // Own enum name: the default would clash with the drafts "_status" enum in Postgres.
      enumName: 'enum_matches_match_status',
      required: true,
      defaultValue: 'scheduled',
      index: true,
      options: MATCH_STATUSES.map(({ label, value }) => ({ label, value })),
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'scoreFor',
          label: 'Xtreme FC score',
          type: 'number',
          min: 0,
          admin: { condition: (_, s) => s?.status === 'fulltime' || s?.status === 'live' },
        },
        {
          name: 'scoreAgainst',
          label: 'Opponent score',
          type: 'number',
          min: 0,
          admin: { condition: (_, s) => s?.status === 'fulltime' || s?.status === 'live' },
        },
      ],
    },
    {
      name: 'scorers',
      type: 'array',
      admin: { description: 'Only if known. Leave empty to hide.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'minute', type: 'number', min: 1, max: 130 },
            {
              name: 'side',
              type: 'select',
              defaultValue: 'us',
              options: [
                { label: 'Xtreme FC', value: 'us' },
                { label: 'Opponent', value: 'them' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'report',
      label: 'Match report',
      type: 'relationship',
      relationTo: 'posts',
      admin: { description: 'Link a News post (category: Match Report).' },
    },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 6 },
  ],
}
