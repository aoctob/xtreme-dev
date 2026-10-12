import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'
import { roleLabel, rolesOf, type RoleUser } from '../access/roles'

export const AUDIT_ACTIONS = [
  { label: 'Created', value: 'create' },
  { label: 'Updated', value: 'update' },
  { label: 'Deleted', value: 'delete' },
  { label: 'Approved', value: 'approve' },
  { label: 'Rejected', value: 'reject' },
  { label: 'Changes requested', value: 'request-changes' },
  { label: 'Status changed', value: 'status-change' },
  { label: 'Resubmitted', value: 'resubmit' },
  { label: 'Published', value: 'publish' },
  { label: 'Unpublished', value: 'unpublish' },
  { label: 'Role changed', value: 'role-change' },
  { label: 'Appointed', value: 'appoint' },
  { label: 'Appointment ended', value: 'end-appointment' },
  { label: 'Finance updated', value: 'finance-update' },
  { label: 'Account invited', value: 'invite' },
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]['value']

export type AuditEntry = {
  action: AuditAction
  collection: string
  recordId?: string | number | null
  recordLabel?: string | null
  summary?: string | null
  reason?: string | null
}

/** Write one audit entry inside the request's transaction. If it cannot be written, the action fails. */
export async function writeAudit(req: PayloadRequest, entry: AuditEntry) {
  const user = req.user as (RoleUser & { id: number; email?: string; name?: string | null }) | null
  try {
    await req.payload.create({
      collection: 'audit-logs',
      overrideAccess: true,
      // No `context` here: Payload merges it into the shared request and it would leak
      // into every later hook of the same operation.
      req,
      data: {
        action: entry.action,
        targetCollection: entry.collection,
        recordId: entry.recordId != null ? String(entry.recordId) : undefined,
        recordLabel: entry.recordLabel?.slice(0, 200) || undefined,
        actor: user?.id,
        actorName: user ? user.name || user.email || `User ${user.id}` : 'Public form / system',
        actorRoles: user ? [...rolesOf(user)].map(roleLabel).join(', ') : undefined,
        summary: entry.summary?.slice(0, 500) || undefined,
        reason: entry.reason?.slice(0, 1000) || undefined,
      },
    })
  } catch (err) {
    // A failed insert aborts the database transaction, so fail the whole action loudly
    // rather than let it look saved while Postgres rolls it back.
    req.payload.logger.error(`Audit log write failed: ${(err as Error).message}`)
    throw err
  }
}

type Doc = Record<string, unknown> & { id?: number | string }

const IGNORED = new Set([
  'updatedAt', 'createdAt', 'id', 'sizes', 'fingerprint', 'hash', 'salt', 'sessions', 'loginAttempts', 'lockUntil',
  'resetPasswordToken', 'resetPasswordExpiration',
  // Join fields and server stamps that only move with a change already logged.
  'publicProfile', 'reviewedBy', 'reviewedAt', 'approvedBy', 'approvedAt', 'resubmittedAt', 'publishedAt', 'publishedBy',
  'lastModifiedBy', 'createdBy', 'updatedBy', 'appointedBy', 'endedBy', 'submittedBy',
])

/** Relationships arrive populated on one side and as ids on the other; compare by id. */
const norm = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(norm) : v && typeof v === 'object' && 'id' in v ? (v as { id: unknown }).id : (v ?? null)
const same = (a: unknown, b: unknown) => JSON.stringify(norm(a)) === JSON.stringify(norm(b))

/** Names of top-level fields that changed. Values are never logged, only field names. */
export function changedFields(doc: Doc, prev: Doc | undefined): string[] {
  if (!prev) return []
  const keys = new Set([...Object.keys(doc), ...Object.keys(prev)])
  return [...keys].filter((k) => !IGNORED.has(k) && !same(doc[k], prev[k]))
}

type StatusRule = {
  field: string
  /** Maps the new value to an audit action, or undefined for a plain status change. */
  action?: (to: string, from: string | undefined) => AuditAction | undefined
}

/**
 * afterChange/afterDelete hooks that record who changed what on a collection.
 * `status` lists fields whose transitions get their own action (approve, publish…).
 */
export function auditHooks({
  label,
  status = [],
  updateAction = 'update',
  createAction = () => 'create',
}: {
  label: (doc: Doc) => string | null | undefined
  status?: StatusRule[]
  updateAction?: AuditAction
  createAction?: (doc: Doc) => AuditAction
}): { afterChange: CollectionAfterChangeHook[]; afterDelete: CollectionAfterDeleteHook[] } {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, collection }) => {
    if (req.context?.skipAudit) return doc
    const recordLabel = label(doc)
    if (operation === 'create') {
      await writeAudit(req, { action: createAction(doc), collection: collection.slug, recordId: doc.id, recordLabel })
      return doc
    }
    const changed = changedFields(doc, previousDoc)
    if (!changed.length) return doc
    for (const rule of status) {
      const from = previousDoc?.[rule.field] as string | undefined
      const to = doc[rule.field] as string | undefined
      if (from !== to && to) {
        await writeAudit(req, {
          action: rule.action?.(to, from) ?? 'status-change',
          collection: collection.slug,
          recordId: doc.id,
          recordLabel,
          summary: `${rule.field}: ${from ?? '—'} → ${to}`,
          reason: (req.context?.auditReason as string | undefined) ?? null,
        })
      }
    }
    const rest = changed.filter((f) => !status.some((s) => s.field === f))
    if (rest.length)
      await writeAudit(req, {
        action: updateAction,
        collection: collection.slug,
        recordId: doc.id,
        recordLabel,
        summary: `Changed: ${rest.join(', ')}`,
      })
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
    if (req.context?.skipAudit) return doc
    await writeAudit(req, {
      action: 'delete',
      collection: collection.slug,
      recordId: doc.id,
      recordLabel: label(doc),
      reason: (req.context?.auditReason as string | undefined) ?? null,
    })
    return doc
  }
  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}

/** Publication transitions shared by public profiles and announcements. */
export const publishRule = (field: string): StatusRule => ({
  field,
  action: (to, from) => (to === 'published' ? 'publish' : from === 'published' ? 'unpublish' : undefined),
})
