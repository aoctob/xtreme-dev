import type { CollectionConfig } from 'payload'
import { admins, nobody, staff } from '../access'
import {
  APPLICATION_STATUSES,
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  EXPERIENCE_LEVELS,
  PREFERRED_POSITIONS,
  SPONSOR_INTERESTS,
} from '../lib/constants'

/**
 * The club inbox (PRD §D.12, §J.5). Records are created only by the form
 * Server Actions through the Local API; the public API cannot create or read them.
 */
const inboxAccess = {
  create: nobody,
  read: staff,
  update: staff,
  delete: admins,
}

const readOnly = { readOnly: true }

const fingerprint = {
  name: 'fingerprint',
  type: 'text' as const,
  index: true,
  admin: { hidden: true },
}

export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'fullName',
    group: 'Inbox',
    defaultColumns: ['fullName', 'phone', 'preferredPosition', 'status', 'createdAt'],
    listSearchableFields: ['fullName', 'phone', 'email'],
    description: 'Trial applications from the Join page. Update the status as you follow up.',
  },
  access: inboxAccess,
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: APPLICATION_STATUSES.map(({ label, value }) => ({ label, value })),
      admin: { position: 'sidebar' },
    },
    { name: 'fullName', type: 'text', required: true, admin: readOnly },
    { name: 'dateOfBirth', type: 'date', required: true, admin: { ...readOnly, date: { pickerAppearance: 'dayOnly' } } },
    { name: 'phone', type: 'text', required: true, admin: readOnly },
    { name: 'email', type: 'email', admin: readOnly },
    {
      name: 'preferredPosition',
      type: 'select',
      options: PREFERRED_POSITIONS.map(({ label, value }) => ({ label, value })),
      admin: readOnly,
    },
    {
      name: 'experienceLevel',
      type: 'select',
      options: EXPERIENCE_LEVELS.map(({ label, value }) => ({ label, value })),
      admin: readOnly,
    },
    { name: 'previousClub', type: 'text', admin: readOnly },
    { name: 'preferredTrialDate', type: 'text', admin: readOnly },
    { name: 'message', type: 'textarea', admin: readOnly },
    {
      name: 'guardian',
      type: 'group',
      admin: { ...readOnly, description: 'Required for applicants under 18.' },
      fields: [
        { name: 'name', type: 'text', admin: readOnly },
        { name: 'phone', type: 'text', admin: readOnly },
      ],
    },
    { name: 'isMinor', type: 'checkbox', admin: { ...readOnly, position: 'sidebar' } },
    { name: 'consent', type: 'checkbox', required: true, admin: { ...readOnly, position: 'sidebar' } },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes (not shared with the applicant).' } },
    fingerprint,
  ],
}

export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  admin: {
    useAsTitle: 'name',
    group: 'Inbox',
    defaultColumns: ['name', 'type', 'businessName', 'status', 'createdAt'],
    listSearchableFields: ['name', 'email', 'phone', 'businessName'],
    description: 'Messages from the Contact and Sponsors pages.',
  },
  access: inboxAccess,
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: ENQUIRY_STATUSES.map(({ label, value }) => ({ label, value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: ENQUIRY_TYPES.map(({ label, value }) => ({ label, value })),
      admin: { ...readOnly, position: 'sidebar' },
    },
    { name: 'name', type: 'text', required: true, admin: readOnly },
    { name: 'businessName', type: 'text', admin: readOnly },
    { name: 'email', type: 'email', admin: readOnly },
    { name: 'phone', type: 'text', admin: readOnly },
    {
      name: 'interest',
      type: 'select',
      options: SPONSOR_INTERESTS.map(({ label, value }) => ({ label, value })),
      admin: readOnly,
    },
    { name: 'message', type: 'textarea', admin: readOnly },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes.' } },
    fingerprint,
  ],
}

/** Postgres-backed rate limit counter keyed by hashed IP (PRD §J.5). Never exposed. */
export const RateLimits: CollectionConfig = {
  slug: 'rate-limits',
  admin: { hidden: true },
  access: { create: nobody, read: nobody, update: nobody, delete: nobody },
  fields: [{ name: 'key', type: 'text', required: true, index: true }],
}
