import type { CollectionConfig } from 'payload'
import { admins, nobody, staff } from '../access'
import {
  COMMITTEE_ROLES,
  FEET,
  PREFERRED_POSITIONS,
  REGISTRATION_MODES,
  REGISTRATION_STATUSES,
  TEAMS,
} from '../lib/constants'

const opts = (list: readonly { label: string; value: string }[]) =>
  list.map(({ label, value }) => ({ label, value }))
const readOnly = { readOnly: true }

/**
 * Season player registrations from /register. Created only by the register Server Action.
 * Holds home addresses, emergency contacts and medical notes, so it is never public.
 */
export const Registrations: CollectionConfig = {
  slug: 'registrations',
  labels: { singular: 'Player registration', plural: 'Player registrations' },
  admin: {
    useAsTitle: 'fullName',
    group: 'Inbox',
    defaultColumns: ['fullName', 'team', 'position', 'mode', 'status', 'createdAt'],
    listSearchableFields: ['fullName', 'phone', 'email'],
    description:
      'Season registrations from the Register page. Medical and emergency details are private: share only with coaches and first-aid staff.',
  },
  access: { create: nobody, read: staff, update: staff, delete: admins },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: opts(REGISTRATION_STATUSES),
      admin: { position: 'sidebar' },
    },
    {
      name: 'mode',
      label: 'Registered by',
      type: 'select',
      required: true,
      options: opts(REGISTRATION_MODES),
      admin: { ...readOnly, position: 'sidebar' },
    },
    {
      name: 'registeredBy',
      label: 'Committee member',
      type: 'group',
      admin: { ...readOnly, condition: (d) => d?.mode === 'committee' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', admin: readOnly },
            { name: 'role', type: 'select', options: opts(COMMITTEE_ROLES), admin: readOnly },
            { name: 'phone', type: 'text', admin: readOnly },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'fullName', type: 'text', required: true, admin: readOnly },
        {
          name: 'dateOfBirth',
          type: 'date',
          required: true,
          admin: { ...readOnly, date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', admin: readOnly },
        { name: 'email', type: 'email', admin: readOnly },
      ],
    },
    { name: 'address', label: 'Home address', type: 'textarea', required: true, admin: readOnly },
    { name: 'photo', type: 'upload', relationTo: 'registration-photos', admin: readOnly },
    {
      name: 'guardian',
      type: 'group',
      admin: { ...readOnly, condition: (d) => Boolean(d?.isMinor) },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', admin: readOnly },
            { name: 'phone', type: 'text', admin: readOnly },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'team', type: 'select', options: opts(TEAMS), admin: readOnly },
        { name: 'foot', label: 'Preferred foot', type: 'select', options: opts(FEET), admin: readOnly },
        { name: 'position', label: 'Main position', type: 'select', options: opts(PREFERRED_POSITIONS), admin: readOnly },
        {
          name: 'secondPosition',
          type: 'select',
          options: opts(PREFERRED_POSITIONS.filter((p) => p.value !== 'not-sure')),
          admin: readOnly,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'shirtNumber', label: 'Requested shirt number', type: 'number', admin: readOnly },
        { name: 'previousClub', type: 'text', admin: readOnly },
      ],
    },
    {
      name: 'emergency',
      label: 'Emergency contact',
      type: 'group',
      admin: readOnly,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', admin: readOnly },
            { name: 'relationship', type: 'text', admin: readOnly },
            { name: 'phone', type: 'text', admin: readOnly },
          ],
        },
      ],
    },
    { name: 'medical', label: 'Medical conditions, allergies or injuries', type: 'textarea', admin: readOnly },
    { name: 'isMinor', type: 'checkbox', admin: { ...readOnly, position: 'sidebar' } },
    { name: 'guardianConsent', type: 'checkbox', admin: { ...readOnly, position: 'sidebar' } },
    {
      name: 'committeeConfirmed',
      type: 'checkbox',
      admin: {
        ...readOnly,
        position: 'sidebar',
        description: 'Committee member confirmed the player or guardian agreed.',
      },
    },
    { name: 'consent', type: 'checkbox', required: true, admin: { ...readOnly, position: 'sidebar' } },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes.' } },
    { name: 'fingerprint', type: 'text', index: true, admin: { hidden: true } },
  ],
}

/** Photos sent with a registration. Staff-only, never listed publicly. */
export const RegistrationPhotos: CollectionConfig = {
  slug: 'registration-photos',
  labels: { singular: 'Registration photo', plural: 'Registration photos' },
  admin: { group: 'Inbox', hidden: true },
  access: { create: nobody, read: staff, update: staff, delete: admins },
  fields: [{ name: 'alt', type: 'text' }],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageSizes: [
      {
        name: 'thumb',
        width: 320,
        height: 400,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
    adminThumbnail: 'thumb',
  },
}
