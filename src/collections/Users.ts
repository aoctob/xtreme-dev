import { APIError, type CollectionConfig, type PayloadRequest, type Where } from 'payload'
import {
  allowField,
  ASSIGNABLE_ROLES,
  canCreateBasicAccounts,
  canReadUsers,
  canUseAdmin,
  isSuperAdmin,
  nobodyField,
  POSITION_ROLES,
  REGISTRAR_ASSIGNABLE,
  roleLabel,
  sameId,
  type RoleUser,
} from '../access'
import { writeAudit } from '../hooks/audit'
import { siteUrl } from '../lib/media'

const MIN_PASSWORD = 10

const isBasic = (u: { roles?: (string | null)[] | null; positions?: (string | null)[] | null } | undefined) =>
  !(u?.positions ?? []).length && (u?.roles ?? []).every((r) => r && REGISTRAR_ASSIGNABLE.includes(r as never))

const list = (v: unknown) => (Array.isArray(v) ? (v as string[]).filter(Boolean).sort() : [])

/**
 * Login accounts for everyone: Super Admin, committee, conservators, mentors,
 * content editors, players and members (spec §2, §6, §11.9).
 * Players and Members cannot open /admin; they use /account.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'roles', 'positions', 'accountStatus'],
    group: 'Committee',
    description:
      'Committee, conservator and mentor powers come from active appointments (Committee → Appointments), not from this page.',
  },
  auth: {
    tokenExpiration: 8 * 60 * 60,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    forgotPassword: {
      generateEmailSubject: () => 'Set your XTREME CLUB password',
      generateEmailHTML: (args) => {
        const url = `${siteUrl()}/account/reset?token=${encodeURIComponent(args?.token ?? '')}`
        return `<p>Use this link to set a new password for your XTREME CLUB account:</p><p><a href="${url}">${url}</a></p><p>If you did not ask for this, ignore this email.</p>`
      },
    },
  },
  access: {
    admin: ({ req: { user } }) => canUseAdmin(user as RoleUser),
    read: ({ req: { user } }) => (canReadUsers(user as RoleUser) ? true : user ? { id: { equals: user.id } } : false),
    create: ({ req: { user } }) => canCreateBasicAccounts(user as RoleUser),
    update: ({ req: { user } }) =>
      isSuperAdmin(user as RoleUser) || canCreateBasicAccounts(user as RoleUser) ? true : user ? { id: { equals: user.id } } : false,
    delete: ({ req: { user } }) => canCreateBasicAccounts(user as RoleUser),
    unlock: ({ req: { user } }) => isSuperAdmin(user as RoleUser),
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user?.accountStatus === 'disabled') throw new APIError('This account is disabled.', 403, undefined, true)
        return user
      },
    ],
    beforeValidate: [
      async ({ data, operation, req }) => {
        // The very first account is always a Super Admin so the club can't lock itself out.
        if (operation === 'create' && data) {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
          if (totalDocs === 0) {
            data.roles = ['super-admin']
            data.accountStatus = 'active'
          }
        }
        if (typeof data?.password === 'string' && data.password.length < MIN_PASSWORD)
          throw new APIError(`Use a password of at least ${MIN_PASSWORD} characters.`, 400, undefined, true)
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const actor = req.user as RoleUser
        // Hooks, scripts and the first-user screen run without a signed-in user.
        if (!actor || isSuperAdmin(actor)) return data
        const rolesChanged = operation === 'create' || ('roles' in data && list(data.roles).join() !== list(originalDoc?.roles).join())
        const statusChanged = 'accountStatus' in data && data.accountStatus !== (originalDoc?.accountStatus ?? 'active')
        // API requests can never change `positions` (field access resets it to the stored
        // value), so a change here is the server syncing appointments (syncPositions).
        const positionsChanged = operation === 'update' && list(data.positions).join() !== list(originalDoc?.positions).join()
        if (positionsChanged && !rolesChanged && !statusChanged) return data
        const self = operation === 'update' && sameId(originalDoc, actor)
        if (self) {
          if (rolesChanged || statusChanged) throw new APIError('You cannot change your own roles or account status.', 403, undefined, true)
          return data
        }
        // Secretary / Joint Secretary: Player and Member accounts only (spec §11.9).
        if (!canCreateBasicAccounts(actor)) throw new APIError('Not allowed.', 403, undefined, true)
        if (operation === 'update' && !isBasic(originalDoc))
          throw new APIError('Only a Super Admin can change this account.', 403, undefined, true)
        if (operation === 'create' && !list(data.roles).length) data.roles = ['member']
        if (!isBasic({ roles: data.roles ?? originalDoc?.roles, positions: [] }))
          throw new APIError('You can only give the Player or Member role.', 403, undefined, true)
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const actor = req.user as RoleUser
        if (!actor || isSuperAdmin(actor)) return
        if (sameId(id, actor)) throw new APIError('You cannot delete your own account.', 403, undefined, true)
        const target = await req.payload.findByID({ collection: 'users', id, overrideAccess: true, req, depth: 0 })
        if (!isBasic(target)) throw new APIError('Only a Super Admin can delete this account.', 403, undefined, true)
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (req.context?.skipAudit) return doc
        const label = doc.name ? `${doc.name} (${doc.email})` : doc.email
        if (operation === 'create') {
          await writeAudit(req, {
            action: 'create',
            collection: 'users',
            recordId: doc.id,
            recordLabel: label,
            summary: `Roles: ${list(doc.roles).map(roleLabel).join(', ') || 'none'}`,
          })
          return doc
        }
        const before = [...list(previousDoc?.roles), ...list(previousDoc?.positions)].map(roleLabel).join(', ')
        const after = [...list(doc.roles), ...list(doc.positions)].map(roleLabel).join(', ')
        if (before !== after || previousDoc?.accountStatus !== doc.accountStatus)
          await writeAudit(req, {
            action: 'role-change',
            collection: 'users',
            recordId: doc.id,
            recordLabel: label,
            summary: `${before || 'none'} → ${after || 'none'}${previousDoc?.accountStatus !== doc.accountStatus ? ` · account ${doc.accountStatus}` : ''}`,
            reason: (req.context?.auditReason as string | undefined) ?? null,
          })
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await writeAudit(req, { action: 'delete', collection: 'users', recordId: doc.id, recordLabel: doc.email })
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['member'],
      options: ASSIGNABLE_ROLES.map(({ label, value }) => ({ label, value })),
      access: {
        create: allowField(canCreateBasicAccounts),
        update: allowField(canCreateBasicAccounts),
      },
      admin: {
        description:
          'Super Admin has full authority. Content editors manage matches, gallery and sponsors. Players and Members sign in at /login and use their account page. The Secretary can only give Player or Member.',
      },
    },
    {
      name: 'positions',
      label: 'Positions (from appointments)',
      type: 'select',
      hasMany: true,
      options: POSITION_ROLES.map(({ label, value }) => ({ label, value })),
      access: { create: nobodyField, update: nobodyField },
      admin: {
        readOnly: true,
        description: 'Set automatically from active committee, conservator and mentor appointments.',
      },
    },
    {
      name: 'accountStatus',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Disabled', value: 'disabled' },
      ],
      access: { create: allowField(canCreateBasicAccounts), update: allowField(canCreateBasicAccounts) },
      admin: { position: 'sidebar', description: 'A disabled account cannot sign in and has no access.' },
    },
  ],
}

/** Recompute a user's derived positions from their active appointments (spec §6). */
export async function syncPositions(req: PayloadRequest, userId: number | string | null | undefined) {
  if (userId == null) return
  const where: Where = { and: [{ user: { equals: userId } }, { status: { equals: 'active' } }] }
  const [committee, conservators, mentors] = await Promise.all([
    req.payload.find({ collection: 'committee-members', where, depth: 0, limit: 10, overrideAccess: true, req }),
    req.payload.count({ collection: 'conservators', where, overrideAccess: true, req }),
    req.payload.count({ collection: 'mentors', where, overrideAccess: true, req }),
  ])
  const positions = [
    ...new Set([
      ...committee.docs.map((d) => d.position),
      ...(conservators.totalDocs ? ['conservator' as const] : []),
      ...(mentors.totalDocs ? ['mentor' as const] : []),
    ]),
  ]
  const user = await req.payload
    .findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true, req })
    .catch(() => null)
  if (!user || list(user.positions).join() === [...positions].sort().join()) return
  await req.payload.update({
    collection: 'users',
    id: userId,
    data: { positions },
    overrideAccess: true,
    req,
  })
}
