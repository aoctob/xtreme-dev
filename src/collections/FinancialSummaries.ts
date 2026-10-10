import { APIError, type CollectionConfig, type Field } from 'payload'
import { allow, canDeleteFinance, canEditFinance, canViewFinance, nobodyField } from '../access'
import { auditHooks } from '../hooks/audit'

const money = (name: string, label: string): Field => ({
  name,
  label,
  type: 'number',
  required: true,
  min: name === 'openingBalance' || name === 'closingBalance' ? undefined : 0,
  admin: { step: 0.01, description: '₹' },
})

const paise = (n: unknown) => Math.round(Number(n ?? 0) * 100)

/**
 * Treasurer-managed period summaries (spec §8). Not a ledger: no bank details,
 * receipts or personal transaction data. Treasurer and Super Admin edit; the other
 * committee members, conservators and mentors read; nobody else.
 */
export const FinancialSummaries: CollectionConfig = {
  slug: 'financial-summaries',
  labels: { singular: 'Financial summary', plural: 'Financial summaries' },
  admin: {
    group: 'Committee',
    useAsTitle: 'period',
    defaultColumns: ['period', 'periodStart', 'totalIncome', 'totalExpenses', 'closingBalance', 'updatedAt'],
    description: 'Closing balance must equal opening balance + income − expenses.',
  },
  access: {
    read: allow(canViewFinance),
    create: allow(canEditFinance),
    update: allow(canEditFinance),
    delete: allow(canDeleteFinance),
  },
  defaultSort: '-periodStart',
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        const d = { ...originalDoc, ...data }
        if (data && ['openingBalance', 'totalIncome', 'totalExpenses', 'closingBalance'].every((k) => d[k] != null)) {
          const expected = paise(d.openingBalance) + paise(d.totalIncome) - paise(d.totalExpenses)
          if (expected !== paise(d.closingBalance))
            throw new APIError(
              `The figures do not reconcile: opening + income − expenses = ₹${(expected / 100).toFixed(2)}, but the closing balance is ₹${Number(d.closingBalance).toFixed(2)}.`,
              400,
              undefined,
              true,
            )
        }
        if (d.periodStart && d.periodEnd && new Date(d.periodEnd) < new Date(d.periodStart))
          throw new APIError('The period end is before its start.', 400, undefined, true)
        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create') data.createdBy = req.user?.id
        data.updatedBy = req.user?.id
        return data
      },
    ],
    ...auditHooks({ label: (d) => d.period as string, updateAction: 'finance-update' }),
  },
  fields: [
    { name: 'period', label: 'Reporting period', type: 'text', required: true, admin: { description: 'e.g. “April 2026” or “Season 2026–27, Q1”.' } },
    {
      type: 'row',
      fields: [
        { name: 'periodStart', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'periodEnd', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
      ],
    },
    {
      type: 'row',
      fields: [money('openingBalance', 'Opening balance'), money('totalIncome', 'Total income'), money('totalExpenses', 'Total expenses'), money('closingBalance', 'Closing balance')],
    },
    { name: 'notes', label: 'Summary notes', type: 'textarea', maxLength: 2000 },
    {
      name: 'supportingReference',
      label: 'Supporting document reference',
      type: 'text',
      admin: { description: 'Where the supporting papers are kept (e.g. “Treasurer file, April 2026”). Do not paste bank details.' },
    },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', access: { create: nobodyField, update: nobodyField }, admin: { position: 'sidebar', readOnly: true } },
    { name: 'updatedBy', type: 'relationship', relationTo: 'users', access: { create: nobodyField, update: nobodyField }, admin: { position: 'sidebar', readOnly: true } },
  ],
}
