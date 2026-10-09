import type { CollectionConfig } from 'payload'
import { anyone, staff } from '../access'
import { revalidateCollection } from '../hooks/revalidate'

export const Staff: CollectionConfig = {
  slug: 'staff',
  labels: { singular: 'Staff member', plural: 'Staff' },
  admin: { useAsTitle: 'name', group: 'Club', defaultColumns: ['name', 'role', 'order'] },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  defaultSort: 'order',
  hooks: revalidateCollection(() => ['/about', '/squad']),
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'textarea', maxLength: 300 },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers show first.' },
    },
  ],
}
