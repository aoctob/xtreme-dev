import type { Access, FieldAccess, Where } from 'payload'
import { canManageContent, canViewSensitivePlayerData, isSuperAdmin, sameId, type RoleUser } from './roles'

export * from './roles'

/** Turns a capability check into a Payload collection access function. */
export const allow =
  (check: (user: RoleUser) => boolean): Access =>
  ({ req: { user } }) =>
    check(user as RoleUser)

/** Turns a capability check into a Payload field access function. */
export const allowField =
  (check: (user: RoleUser) => boolean): FieldAccess =>
  ({ req: { user } }) =>
    check(user as RoleUser)

/** Website content managers: Super Admin, the five committee roles and content editors. */
export const staff: Access = allow(canManageContent)

export const admins: Access = allow(isSuperAdmin)

/** Nobody through the API. Server code uses the Local API with overrideAccess. */
export const nobody: Access = () => false
export const nobodyField: FieldAccess = () => false

export const anyone: Access = () => true

/** Content managers see drafts; everyone else sees published documents only. */
export const publishedOrStaff: Access = ({ req: { user } }) => {
  if (canManageContent(user as RoleUser)) return true
  const where: Where = { _status: { equals: 'published' } }
  return where
}

/** Full access for `check`, otherwise only documents whose `field` points at the user. */
export const allowOrOwn =
  (check: (user: RoleUser) => boolean, field = 'user'): Access =>
  ({ req: { user } }) => {
    if (check(user as RoleUser)) return true
    if (!user || (user as RoleUser)?.accountStatus === 'disabled') return false
    return { [field]: { equals: user.id } }
  }

/** Sensitive personal fields: oversight roles, or the person the record belongs to. */
export const sensitiveOrOwner = (field = 'user'): FieldAccess => checkOrOwner(canViewSensitivePlayerData, field)

/** Field readable by `check`, or by the person whose record it is. */
export const checkOrOwner =
  (check: (user: RoleUser) => boolean, field = 'user'): FieldAccess =>
  ({ req: { user }, doc }) =>
    check(user as RoleUser) || (Boolean(user) && (user as RoleUser)?.accountStatus !== 'disabled' && sameId(doc?.[field], user))
