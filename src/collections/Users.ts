import type { CollectionConfig } from 'payload'
import { admins, adminsField, isAdminUser } from '../access'

/** Club staff accounts for /admin. No public accounts (PRD §J.7). */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Admin',
  },
  auth: true,
  access: {
    read: ({ req: { user } }) =>
      isAdminUser(user) ? true : user ? { id: { equals: user.id } } : false,
    create: admins,
    update: ({ req: { user } }) =>
      isAdminUser(user) ? true : user ? { id: { equals: user.id } } : false,
    delete: admins,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        // The very first account is always an Admin so the club can't lock itself out.
        if (operation === 'create' && data) {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            overrideAccess: true,
          })
          if (totalDocs === 0) data.role = 'admin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: { update: adminsField },
      admin: {
        description:
          'Admins manage everything including users. Editors manage content and the inbox.',
      },
    },
  ],
}
