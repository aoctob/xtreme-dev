import type { Access, FieldAccess, Where } from 'payload'

type Role = 'admin' | 'editor'
type StaffUser = { role?: Role | null } | null | undefined

export const isAdminUser = (user: StaffUser): boolean => user?.role === 'admin'
export const isStaffUser = (user: StaffUser): boolean => Boolean(user)

/** Any signed-in club staff member (Admin or Editor). */
export const staff: Access = ({ req: { user } }) => isStaffUser(user)

/** Admins only. */
export const admins: Access = ({ req: { user } }) => isAdminUser(user)

export const adminsField: FieldAccess = ({ req: { user } }) => isAdminUser(user)

/** Nobody through the API. Server code uses the Local API with overrideAccess. */
export const nobody: Access = () => false

export const anyone: Access = () => true

/** Staff see drafts; the public sees published documents only. */
export const publishedOrStaff: Access = ({ req: { user } }) => {
  if (isStaffUser(user)) return true
  const where: Where = { _status: { equals: 'published' } }
  return where
}
