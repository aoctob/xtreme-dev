import type { CollectionConfig } from 'payload'
import { anyone, staff } from '../access'
import { revalidateCollection } from '../hooks/revalidate'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  admin: {
    useAsTitle: 'name',
    group: 'Club',
    defaultColumns: ['name', 'tier', 'permissionOnFile', 'order'],
    description: 'Only real partners. A sponsor appears on the site only when "Permission on file" is ticked.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  defaultSort: 'order',
  hooks: revalidateCollection(() => ['/', '/sponsors']),
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'SVG preferred; PNG at least 600 px wide. Without a logo the name is shown.' },
    },
    {
      name: 'logoOnWhite',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Tick if the logo only works on a white background.' },
    },
    { name: 'url', type: 'text', admin: { description: "Sponsor's website (https://…)." } },
    { name: 'tier', type: 'text', admin: { description: 'Optional, only if the club defines tiers.' } },
    {
      name: 'permissionOnFile',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Written permission to display the logo.' },
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
