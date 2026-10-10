import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { canEditFinance, canViewFinance } from '@/access/roles'
import { Submit } from '@/components/dash/client'
import { Field, Flash, fmtDate, fmtMoney, nameOf, SectionTitle } from '@/components/dash/ui'
import { requireUser } from '@/lib/auth'
import { dashContext } from '@/lib/dashboard'
import { saveFinance } from '../../actions'

const day = (v: string | null | undefined) => (v ? v.slice(0, 10) : '')

export default async function FinanceSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  await requireUser(canViewFinance, `/dashboard/finance/${id}`)
  const { user, payload, as } = await dashContext()
  const flash = await searchParams
  const edit = canEditFinance(user)
  const isNew = id === 'new'
  if (isNew && !edit) redirect('/dashboard/finance')
  const f = isNew ? null : await payload.findByID({ collection: 'financial-summaries', id, depth: 1, ...as }).catch(() => null)
  if (!isNew && !f) notFound()

  const back = (
    <Link href="/dashboard/finance" className="btn btn-tertiary">
      All summaries
    </Link>
  )

  if (!edit && f)
    return (
      <section>
        <SectionTitle title={f.period} desc={`${fmtDate(f.periodStart)} – ${fmtDate(f.periodEnd)}`} actions={back} />
        <div className="dcard">
          <dl className="dl">
            <dt>Opening balance</dt>
            <dd>{fmtMoney(f.openingBalance)}</dd>
            <dt>Total income</dt>
            <dd>{fmtMoney(f.totalIncome)}</dd>
            <dt>Total expenses</dt>
            <dd>{fmtMoney(f.totalExpenses)}</dd>
            <dt>Closing balance</dt>
            <dd>
              <strong>{fmtMoney(f.closingBalance)}</strong>
            </dd>
            <dt>Notes</dt>
            <dd>{f.notes || '—'}</dd>
            <dt>Supporting papers</dt>
            <dd>{f.supportingReference || '—'}</dd>
            <dt>Prepared by</dt>
            <dd>
              {nameOf(f.createdBy)} · last updated by {nameOf(f.updatedBy)} on {fmtDate(f.updatedAt, true)}
            </dd>
          </dl>
        </div>
      </section>
    )

  return (
    <section>
      <SectionTitle title={f ? `Edit ${f.period}` : 'New financial summary'} desc="Closing balance must equal opening balance + income − expenses." actions={back} />
      <Flash params={flash} />
      <div className="dcard">
        <form action={saveFinance} className="dform">
          {f && <input type="hidden" name="id" value={f.id} />}
          <Field label="Reporting period" help="e.g. April 2026">
            <input name="period" className="ctl" required maxLength={120} defaultValue={f?.period} />
          </Field>
          <div className="dform-row">
            <Field label="Period start">
              <input name="periodStart" type="date" className="ctl" required defaultValue={day(f?.periodStart)} />
            </Field>
            <Field label="Period end">
              <input name="periodEnd" type="date" className="ctl" required defaultValue={day(f?.periodEnd)} />
            </Field>
          </div>
          <div className="dform-row r4">
            <Field label="Opening balance (₹)">
              <input name="openingBalance" type="number" step="0.01" className="ctl" required defaultValue={f?.openingBalance} />
            </Field>
            <Field label="Total income (₹)">
              <input name="totalIncome" type="number" step="0.01" min="0" className="ctl" required defaultValue={f?.totalIncome} />
            </Field>
            <Field label="Total expenses (₹)">
              <input name="totalExpenses" type="number" step="0.01" min="0" className="ctl" required defaultValue={f?.totalExpenses} />
            </Field>
            <Field label="Closing balance (₹)">
              <input name="closingBalance" type="number" step="0.01" className="ctl" required defaultValue={f?.closingBalance} />
            </Field>
          </div>
          <Field label="Summary notes">
            <textarea name="notes" className="ctl" maxLength={2000} defaultValue={f?.notes ?? ''} />
          </Field>
          <Field label="Supporting document reference" help="Where the papers are kept. Never paste bank details.">
            <input name="supportingReference" className="ctl" maxLength={200} defaultValue={f?.supportingReference ?? ''} />
          </Field>
          <div className="dacts">
            <Submit icon="check">Save summary</Submit>
          </div>
        </form>
      </div>
    </section>
  )
}
