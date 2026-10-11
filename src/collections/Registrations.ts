import { APIError, type CollectionConfig, type Field, type TextFieldSingleValidation } from 'payload'
import { email as emailValidation } from 'payload/shared'
import {
  allow,
  allowField,
  allowOrOwn,
  canManagePlayers,
  canViewPlayerRecords,
  canViewSensitivePlayerData,
  checkOrOwner,
  isSuperAdmin,
  nobody,
  nobodyField,
  sameId,
  sensitiveOrOwner,
  type RoleUser,
} from '../access'
import { auditHooks } from '../hooks/audit'
import {
  BACHELOR_DEGREES,
  BLOOD_GROUPS,
  COMMITTEE_ROLES,
  FEET,
  MASTER_DEGREES,
  MEMBERSHIP_STATUSES,
  PREFERRED_POSITIONS,
  REGISTRATION_MODES,
  REGISTRATION_STATUSES,
  TEAMS,
} from '../lib/constants'
import { nextPlayerId } from '../lib/playerId'
import { isAadhaar, isPan, maskAadhaar, maskPan, normalisePhone } from '../lib/validation'

const opts = (list: readonly { label: string; value: string }[]) => list.map(({ label, value }) => ({ label, value }))
const readOnly = { readOnly: true }
/** Personal details: hidden from the Treasurer and the public, visible to the player themself. */
const personal = { read: sensitiveOrOwner() }
/** Internal review fields: never shown to the player or the Treasurer. */
const internal = { read: allowField(canViewSensitivePlayerData) }
/** Set only by the server when the status changes (spec §11.4). */
const stamped = { read: allowField(canViewPlayerRecords), create: nobodyField, update: nobodyField }

/** Admin text input that formats as you type (lib/validation masks). */
const masked = (mask: 'aadhaar' | 'pan' | 'phone') => ({
  Field: { path: '@/components/admin/MaskedTextField#MaskedTextField', clientProps: { mask } },
})

/**
 * Rules shared with the Register form. Old records saved before a rule existed stay editable:
 * a value is checked only when it is new or has changed.
 */
const unchanged = (value: unknown, previousValue: unknown) => value === previousValue
const validPhone: TextFieldSingleValidation = (value, { previousValue }) =>
  !value || unchanged(value, previousValue) || Boolean(normalisePhone(value)) || 'Enter a 10-digit Indian mobile number, with optional +91'
const validAadhaar: TextFieldSingleValidation = (value, { previousValue }) =>
  !value || unchanged(value, previousValue) || isAadhaar(value) || 'Enter a valid 12-digit Aadhaar number (XXXX XXXX XXXX)'
const validPan: TextFieldSingleValidation = (value, { previousValue }) =>
  !value || unchanged(value, previousValue) || isPan(value) || 'Enter a valid PAN: 5 letters, 4 digits, 1 letter (ABCPE1234F)'

/** Email is required on new records; older records without one can still be edited. */
const requiredEmail: Field = {
  name: 'email',
  type: 'email',
  access: personal,
  validate: (value, args) => {
    const v = value as string | null | undefined
    if (!v) return args.operation === 'create' || args.previousValue ? 'Enter an email address' : true
    return emailValidation(v, args)
  },
  admin: { description: 'Required for new registrations.' },
}

const audit = auditHooks({
  label: (d) => d.fullName as string,
  status: [
    {
      field: 'applicationStatus',
      action: (to, from) =>
        to === 'approved'
          ? 'approve'
          : to === 'rejected'
            ? 'reject'
            : to === 'changes_requested'
              ? 'request-changes'
              : to === 'pending' && from === 'changes_requested'
                ? 'resubmit'
                : undefined,
    },
    { field: 'membershipStatus' },
  ],
})

/**
 * Private player records (spec §4.1 `Players`, §5). Created by the public Register form
 * as `pending`, reviewed and approved by the Secretary or Joint Secretary. Approval never
 * publishes anything: the public squad page reads only published Public profiles.
 */
export const Registrations: CollectionConfig = {
  slug: 'registrations',
  labels: { singular: 'Player record', plural: 'Player records' },
  admin: {
    useAsTitle: 'fullName',
    group: 'Players and members',
    defaultColumns: ['fullName', 'team', 'position', 'applicationStatus', 'createdAt'],
    listSearchableFields: ['fullName', 'phone', 'email'],
    description:
      'Private player records and registrations. Approving a player does not publish them: prepare and publish a Public profile separately.',
  },
  access: {
    read: allowOrOwn(canViewPlayerRecords),
    create: allow(canManagePlayers),
    update: allow(canManagePlayers),
    delete: allow(canManagePlayers),
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeValidate: [
      // Store numbers in one format whichever way they were typed (form, admin or API).
      ({ data }) => {
        if (!data) return data
        for (const k of ['phone', 'whatsapp'] as const)
          if (typeof data[k] === 'string' && data[k]) data[k] = normalisePhone(data[k]) ?? data[k].trim()
        if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase() || null
        const id = data.identity as { aadhaarNumber?: string | null; panNumber?: string | null } | undefined
        if (id) {
          if (typeof id.aadhaarNumber === 'string') id.aadhaarNumber = maskAadhaar(id.aadhaarNumber) || null
          if (typeof id.panNumber === 'string') id.panNumber = maskPan(id.panNumber) || null
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const actor = req.user as RoleUser
        const now = new Date().toISOString()
        if (operation === 'create') {
          if (actor?.id) data.submittedBy = actor.id
          // Applicants never choose their own status (spec §5 step 1).
          if (!canManagePlayers(actor)) data.applicationStatus = 'pending'
        }
        const from = operation === 'create' ? 'pending' : originalDoc?.applicationStatus
        const to = data.applicationStatus ?? from
        if (to === from) return data

        const resubmit = req.context?.resubmission === true && from === 'changes_requested' && to === 'pending'
        if (resubmit) {
          data.resubmittedAt = now
          return data
        }
        if (!canManagePlayers(actor)) throw new APIError('Only the Secretary or Joint Secretary can change an application status.', 403, undefined, true)
        if (to === 'approved' && !isSuperAdmin(actor) && sameId(data.user ?? originalDoc?.user, actor))
          throw new APIError('You cannot approve your own registration.', 403, undefined, true)
        if (to === 'rejected' && !(data.rejectionReason ?? originalDoc?.rejectionReason))
          throw new APIError('Give a reason before rejecting an application.', 400, undefined, true)
        if (to === 'changes_requested' && !(data.changesRequested ?? originalDoc?.changesRequested))
          throw new APIError('Say what the player needs to change.', 400, undefined, true)
        data.reviewedBy = actor?.id
        data.reviewedAt = now
        if (to === 'approved') {
          data.approvedBy = actor?.id
          data.approvedAt = now
          // Player ID is given once, on first approval, and kept if approval is later withdrawn.
          if (!originalDoc?.playerId) data.playerId = await nextPlayerId(req)
        }
        return data
      },
    ],
    afterChange: [
      ...audit.afterChange,
      // Approval withdrawn: take any published profile down (spec §5 step 4).
      async ({ doc, previousDoc, req }) => {
        if (previousDoc?.applicationStatus === 'approved' && doc.applicationStatus !== 'approved') {
          const { docs } = await req.payload.find({
            collection: 'players',
            where: { and: [{ record: { equals: doc.id } }, { publicationStatus: { equals: 'published' } }] },
            depth: 0,
            overrideAccess: true,
            req,
          })
          for (const p of docs)
            await req.payload.update({
              collection: 'players',
              id: p.id,
              data: { publicationStatus: 'unpublished' },
              overrideAccess: true,
              req,
              context: { auditReason: 'Registration no longer approved' },
            })
        }
        return doc
      },
    ],
    afterDelete: audit.afterDelete,
  },
  fields: [
    {
      name: 'playerId',
      label: 'Player ID',
      type: 'text',
      unique: true,
      index: true,
      access: { read: checkOrOwner(canViewPlayerRecords), create: nobodyField, update: nobodyField },
      validate: (value: string | null | undefined) => !value || /^xfc-\d{2}-\d{4,}$/.test(value) || 'Player IDs look like xfc-26-0001',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Given automatically when the registration is first approved (xfc-YY-0001). Never reused.',
      },
    },
    {
      name: 'applicationStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: opts(REGISTRATION_STATUSES),
      admin: { position: 'sidebar' },
    },
    {
      name: 'membershipStatus',
      type: 'select',
      options: opts(MEMBERSHIP_STATUSES),
      admin: { position: 'sidebar' },
    },
    {
      name: 'user',
      label: 'Player login',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { read: checkOrOwner(canViewPlayerRecords) },
      admin: { position: 'sidebar', description: 'The player’s own account, so they can follow their application at /account.' },
    },
    {
      name: 'publicProfile',
      type: 'join',
      collection: 'players',
      on: 'record',
      access: { read: allowField(canViewPlayerRecords) },
      admin: { description: 'The limited public profile prepared from this record, if any.' },
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
      type: 'tabs',
      tabs: [
        {
          label: 'Application',
          fields: [
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
                { name: 'fullName', type: 'text', required: true },
                {
                  name: 'dateOfBirth',
                  type: 'date',
                  required: true,
                  access: personal,
                  admin: { date: { pickerAppearance: 'dayOnly' } },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'phone',
                  label: 'Calling phone',
                  type: 'text',
                  validate: validPhone,
                  admin: { placeholder: '+91 98765 43210', components: masked('phone') },
                },
                {
                  name: 'whatsapp',
                  label: 'WhatsApp number',
                  type: 'text',
                  access: personal,
                  validate: validPhone,
                  admin: { placeholder: '+91 98765 43210', components: masked('phone') },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                requiredEmail,
                { name: 'bloodGroup', type: 'select', options: opts(BLOOD_GROUPS), access: personal },
              ],
            },
            { name: 'address', label: 'Home address', type: 'textarea', required: true, access: personal },
            { name: 'photo', type: 'upload', relationTo: 'registration-photos', access: personal },
            {
              name: 'guardian',
              type: 'group',
              access: personal,
              admin: { condition: (d) => Boolean(d?.isMinor) },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text' },
                    { name: 'phone', type: 'text' },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'team', type: 'select', options: opts(TEAMS) },
                { name: 'foot', label: 'Preferred foot', type: 'select', options: opts(FEET) },
                { name: 'position', label: 'Main position', type: 'select', options: opts(PREFERRED_POSITIONS) },
                {
                  name: 'secondPosition',
                  type: 'select',
                  options: opts(PREFERRED_POSITIONS.filter((p) => p.value !== 'not-sure')),
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'shirtNumber', label: 'Requested shirt number', type: 'number' },
                { name: 'previousClub', type: 'text' },
              ],
            },
            {
              name: 'emergency',
              label: 'Emergency contact',
              type: 'group',
              access: personal,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text' },
                    { name: 'relationship', type: 'text' },
                    { name: 'phone', type: 'text' },
                  ],
                },
              ],
            },
            { name: 'medical', label: 'Medical conditions, allergies or injuries', type: 'textarea', access: personal },
            {
              name: 'education',
              label: 'Educational background',
              type: 'group',
              access: personal,
              admin: { description: 'All optional.' },
              fields: [
                { name: 'schoolName', type: 'text' },
                {
                  name: 'bachelors',
                  label: 'Bachelor’s degree',
                  type: 'group',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'degree', type: 'select', options: opts(BACHELOR_DEGREES) },
                        { name: 'college', label: 'College name', type: 'text' },
                      ],
                    },
                  ],
                },
                {
                  name: 'masters',
                  label: 'Master’s degree',
                  type: 'group',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'degree', type: 'select', options: opts(MASTER_DEGREES) },
                        { name: 'college', label: 'College name', type: 'text' },
                      ],
                    },
                  ],
                },
                { name: 'other', label: 'Other qualifications', type: 'textarea', admin: { description: 'Diplomas, certificates, coaching or refereeing licences.' } },
              ],
            },
            {
              name: 'identity',
              label: 'Identity documents',
              type: 'group',
              access: personal,
              admin: { description: 'Aadhaar and PAN. Private: never on the public profile, and hidden from the Treasurer.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'aadhaarNumber',
                      type: 'text',
                      validate: validAadhaar,
                      admin: { placeholder: 'XXXX XXXX XXXX', components: masked('aadhaar') },
                    },
                    {
                      name: 'aadhaarImage',
                      label: 'Aadhaar card image',
                      type: 'upload',
                      relationTo: 'player-documents',
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'panNumber',
                      label: 'PAN',
                      type: 'text',
                      validate: validPan,
                      admin: { placeholder: 'ABCPE1234F', components: masked('pan') },
                    },
                    { name: 'panImage', label: 'PAN card image', type: 'upload', relationTo: 'player-documents' },
                  ],
                },
              ],
            },
            {
              name: 'documents',
              type: 'upload',
              relationTo: 'player-documents',
              hasMany: true,
              access: personal,
              admin: { description: 'Other private documents (consent forms, certificates). Never public.' },
            },
          ],
        },
        {
          label: 'Review',
          fields: [
            {
              name: 'changesRequested',
              label: 'Changes requested from the player',
              type: 'textarea',
              access: personal,
              admin: { description: 'Shown to the player on their account page when the status is “Changes requested”.' },
            },
            {
              name: 'playerResponse',
              type: 'textarea',
              access: personal,
              admin: { readOnly: true, description: 'The player’s reply when they resubmitted.' },
            },
            { name: 'resubmittedAt', type: 'date', access: stamped, admin: readOnly },
            { name: 'reviewNotes', label: 'Internal review notes', type: 'textarea', access: internal },
            {
              name: 'rejectionReason',
              type: 'textarea',
              access: internal,
              admin: { description: 'Required to reject. Not shown to the player.' },
            },
            {
              type: 'row',
              fields: [
                { name: 'reviewedBy', type: 'relationship', relationTo: 'users', access: stamped, admin: readOnly },
                { name: 'reviewedAt', type: 'date', access: stamped, admin: { ...readOnly, date: { pickerAppearance: 'dayAndTime' } } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'approvedBy', type: 'relationship', relationTo: 'users', access: stamped, admin: readOnly },
                { name: 'approvedAt', type: 'date', access: stamped, admin: { ...readOnly, date: { pickerAppearance: 'dayAndTime' } } },
              ],
            },
            { name: 'submittedBy', type: 'relationship', relationTo: 'users', access: stamped, admin: readOnly },
          ],
        },
      ],
    },
    { name: 'isMinor', type: 'checkbox', admin: { ...readOnly, position: 'sidebar' } },
    { name: 'guardianConsent', type: 'checkbox', admin: { ...readOnly, position: 'sidebar' } },
    {
      name: 'committeeConfirmed',
      type: 'checkbox',
      admin: { ...readOnly, position: 'sidebar', description: 'Committee member confirmed the player or guardian agreed.' },
    },
    { name: 'consent', type: 'checkbox', required: true, admin: { ...readOnly, position: 'sidebar' } },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar', description: 'Prefer archiving to deleting: the record stays as history.' },
    },
    { name: 'fingerprint', type: 'text', index: true, admin: { hidden: true } },
  ],
}

const privateUpload = {
  read: allow(canViewSensitivePlayerData),
  create: nobody,
  update: allow(canManagePlayers),
  delete: allow(canManagePlayers),
}

/** Photos sent with a registration. Never public; files are served only through Payload's access check. */
export const RegistrationPhotos: CollectionConfig = {
  slug: 'registration-photos',
  labels: { singular: 'Registration photo', plural: 'Registration photos' },
  admin: { group: 'Players and members', hidden: true },
  access: privateUpload,
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

/** Identity and consent documents attached to player records (spec §4.1, §11.6). */
export const PlayerDocuments: CollectionConfig = {
  slug: 'player-documents',
  labels: { singular: 'Player document', plural: 'Player documents' },
  admin: { group: 'Players and members', useAsTitle: 'title' },
  access: { ...privateUpload, create: allow(canManagePlayers) },
  hooks: auditHooks({ label: (d) => (d.title as string) || (d.filename as string) }),
  fields: [{ name: 'title', type: 'text', required: true }],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
}

/** Player ID counters, one row per year. Written only by lib/playerId.ts. */
export const PlayerIdSequences: CollectionConfig = {
  slug: 'player-id-sequences',
  labels: { singular: 'Player ID counter', plural: 'Player ID counters' },
  admin: { group: 'Players and members', hidden: true },
  access: { read: allow(isSuperAdmin), create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'year', type: 'number', required: true, unique: true },
    { name: 'last', type: 'number', required: true, defaultValue: 0 },
  ],
}
