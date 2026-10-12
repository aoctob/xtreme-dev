/**
 * Club roles and what each one may do (docs/xtreme-club-roles-permissions.md §2–3).
 * Pure functions on the signed-in user, shared by Payload access control, server
 * actions and the dashboard UI, so every layer applies the same rules.
 *
 * A user's effective roles are `roles` (assigned by a Super Admin, or Player/Member by
 * the Secretary) plus `positions`, which are derived from active appointment records
 * and can never be edited directly. Ending or deleting an appointment revokes its powers.
 */

export const ROLES = [
  { label: 'Super Admin', value: 'super-admin' },
  { label: 'President', value: 'president' },
  { label: 'Vice President', value: 'vice-president' },
  { label: 'Secretary', value: 'secretary' },
  { label: 'Joint Secretary', value: 'joint-secretary' },
  { label: 'Treasurer', value: 'treasurer' },
  { label: 'Conservator', value: 'conservator' },
  { label: 'Mentor', value: 'mentor' },
  { label: 'Content editor', value: 'editor' },
  { label: 'Player', value: 'player' },
  { label: 'Member', value: 'member' },
] as const

export type Role = (typeof ROLES)[number]['value']

/** Roles set directly on a user account. */
export const ASSIGNABLE_ROLES = ROLES.filter((r) => ['super-admin', 'editor', 'player', 'member'].includes(r.value))
/** Roles that come only from an active appointment record. */
export const POSITION_ROLES = ROLES.filter((r) =>
  ['president', 'vice-president', 'secretary', 'joint-secretary', 'treasurer', 'conservator', 'mentor'].includes(r.value),
)
/** The Secretary and Joint Secretary may create accounts with these roles only. */
export const REGISTRAR_ASSIGNABLE: Role[] = ['player', 'member']

export const COMMITTEE_POSITIONS = [
  { label: 'President', value: 'president' },
  { label: 'Vice President', value: 'vice-president' },
  { label: 'Secretary', value: 'secretary' },
  { label: 'Joint Secretary', value: 'joint-secretary' },
  { label: 'Treasurer', value: 'treasurer' },
] as const

export const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r

export type RoleUser =
  | {
      id?: number | string
      roles?: (string | null)[] | null
      positions?: (string | null)[] | null
      accountStatus?: string | null
    }
  | null
  | undefined

export function rolesOf(user: RoleUser): Set<Role> {
  if (!user || user.accountStatus === 'disabled') return new Set()
  return new Set([...(user.roles ?? []), ...(user.positions ?? [])].filter(Boolean) as Role[])
}

const any =
  (...allowed: Role[]) =>
  (user: RoleUser): boolean => {
    const r = rolesOf(user)
    return allowed.some((a) => r.has(a))
  }

const COMMITTEE: Role[] = ['president', 'vice-president', 'secretary', 'joint-secretary', 'treasurer']

export const isSuperAdmin = any('super-admin')
export const isCommittee = any(...COMMITTEE)
export const isPlayer = any('player')
export const isMember = any('member')

/** Create, edit, delete player records; approve registrations; prepare and publish profiles. */
export const canManagePlayers = any('super-admin', 'secretary', 'joint-secretary')
/** Read detailed player records (Treasurer sees a reduced set of fields). */
export const canViewPlayerRecords = any(
  'super-admin',
  'secretary',
  'joint-secretary',
  'president',
  'vice-president',
  'treasurer',
  'conservator',
  'mentor',
)
/** Contact details, address, date of birth, medical, documents. Not the Treasurer. */
export const canViewSensitivePlayerData = any(
  'super-admin',
  'secretary',
  'joint-secretary',
  'president',
  'vice-president',
  'conservator',
  'mentor',
)

export const canManageMembers = any('super-admin', 'secretary', 'joint-secretary')
export const canViewMembers = any(
  'super-admin',
  'secretary',
  'joint-secretary',
  'president',
  'vice-president',
  'treasurer',
  'conservator',
  'mentor',
)

/** Committee members, conservators and mentors. */
export const canManageAppointments = any('super-admin', 'president', 'vice-president')

export const canManageAnnouncements = any('super-admin', ...COMMITTEE)

export const canEditFinance = any('super-admin', 'treasurer')
export const canViewFinance = any('super-admin', ...COMMITTEE, 'conservator', 'mentor')
export const canDeleteFinance = any('super-admin')

export const canViewAudit = any('super-admin', ...COMMITTEE, 'conservator')

/** Website content: matches, gallery, sponsors, staff, site text and the enquiry inbox. */
export const canManageContent = any('super-admin', ...COMMITTEE, 'editor')

/** Can read the user list (to link accounts to records and appointments). */
export const canReadUsers = any('super-admin', ...COMMITTEE)
/** Can create Player/Member accounts. */
export const canCreateBasicAccounts = any('super-admin', 'secretary', 'joint-secretary')

/** The committee dashboard at /dashboard. */
export const canUseDashboard = any('super-admin', ...COMMITTEE, 'conservator', 'mentor')

/** Payload admin at /admin. Players and Members use /account instead. */
export const canUseAdmin = any('super-admin', ...COMMITTEE, 'conservator', 'mentor', 'editor')

/**
 * Whether to show the general "Admin panel" entry point (dashboard sidebar, /account).
 * Committee roles get to /admin only through task-specific links on dashboard pages;
 * Content editors have no dashboard, so /account stays their way in.
 */
export const showAdminPanelLink = (user: RoleUser) => isSuperAdmin(user) || (canUseAdmin(user) && !canUseDashboard(user))

/** Normalise a relationship value (id or populated doc) to its id. */
export const idOf = (v: unknown): number | string | null => {
  if (v == null) return null
  if (typeof v === 'object') return ((v as { id?: number | string }).id ?? null) as number | string | null
  return v as number | string
}

export const sameId = (a: unknown, b: unknown) => {
  const x = idOf(a)
  const y = idOf(b)
  return x != null && y != null && String(x) === String(y)
}
