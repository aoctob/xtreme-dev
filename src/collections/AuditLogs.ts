import type { CollectionConfig } from 'payload'
import { allow, canViewAudit, nobody } from '../access'
import { AUDIT_ACTIONS } from '../hooks/audit'

/**
 * Append-only record of permission-sensitive actions (spec §11.11). Written only by
 * server hooks; nobody can edit or delete an entry through the API or the admin.
 * Field values are never copied in, only field names and status transitions.
 */
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: { singular: 'Audit log entry', plural: 'Audit log' },
  admin: {
    group: 'Committee',
    useAsTitle: 'recordLabel',
    defaultColumns: ['createdAt', 'action', 'targetCollection', 'recordLabel', 'actorName'],
    description: 'Every approval, publication, deletion, role change and finance update. Read-only.',
  },
  access: { read: allow(canViewAudit), create: nobody, update: nobody, delete: nobody },
  defaultSort: '-createdAt',
  fields: [
    { name: 'action', type: 'select', required: true, index: true, options: AUDIT_ACTIONS.map(({ label, value }) => ({ label, value })) },
    { name: 'targetCollection', label: 'Collection', type: 'text', required: true, index: true },
    { name: 'recordId', type: 'text', index: true },
    { name: 'recordLabel', label: 'Record', type: 'text' },
    { name: 'actor', type: 'relationship', relationTo: 'users' },
    { name: 'actorName', label: 'By', type: 'text' },
    { name: 'actorRoles', type: 'text' },
    { name: 'summary', type: 'text' },
    { name: 'reason', type: 'textarea' },
  ],
}
