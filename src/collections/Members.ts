import type { CollectionConfig } from 'payload'
import { allow, allowField, allowOrOwn, canManageMembers, canViewMembers, sensitiveOrOwner } from '../access'
import { auditHooks } from '../hooks/audit'
import { MEMBERSHIP_STATUSES, MEMBERSHIP_TYPES } from '../lib/constants'

const opts = (list: readonly { label: string; value: string }[]) => list.map(({ label, value }) => ({ label, value }))

/**
 * Private membership records (spec §3, §10). The Secretary and Joint Secretary manage
 * them; leadership, Treasurer, conservators and mentors can view; a member sees only
 * their own record and cannot edit it (no self-correction flow by default).
 */
export const Members: CollectionConfig = {
  slug: 'members',
  admin: {
    group: 'Players and members',
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'membershipType', 'membershipStatus', 'joinedOn', 'user'],
    listSearchableFields: ['fullName', 'email', 'phone'],
  },
  access: {
    read: allowOrOwn(canViewMembers),
    create: allow(canManageMembers),
    update: allow(canManageMembers),
    delete: allow(canManageMembers),
  },
  defaultSort: 'fullName',
  hooks: auditHooks({
    label: (d) => d.fullName as string,
    status: [{ field: 'membershipStatus' }],
  }),
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'fullName', type: 'text', required: true },
        { name: 'membershipType', type: 'select', options: opts(MEMBERSHIP_TYPES) },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'address',
      type: 'textarea',
      access: { read: sensitiveOrOwner() },
    },
    {
      type: 'row',
      fields: [
        { name: 'joinedOn', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'renewalDue', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
      ],
    },
    {
      name: 'membershipStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: opts(MEMBERSHIP_STATUSES),
      admin: { position: 'sidebar' },
    },
    {
      name: 'user',
      label: 'Login account',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { position: 'sidebar', description: 'The member’s own account, so they can see this record at /account.' },
    },
    {
      name: 'playerRecord',
      type: 'relationship',
      relationTo: 'registrations',
      admin: { position: 'sidebar', description: 'If this member is also a registered player.' },
    },
    {
      name: 'notes',
      label: 'Internal notes',
      type: 'textarea',
      access: { read: allowField(canViewMembers) },
      admin: { description: 'Not shown to the member.' },
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar', description: 'Prefer archiving to deleting: the record stays as history.' },
    },
  ],
}
