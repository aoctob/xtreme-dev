import Link from 'next/link'
import { canEditFinance, canViewFinance } from '@/access/roles'
import { Empty, Flash, fmtDate, fmtMoney, SectionTitle } from '@/components/dash/ui'
import { Icon } from '@/components/kit/Icon'
import { requireUser } from '@/lib/auth'
import { dashContext } from '@/lib/dashboard'

export default async function FinancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser(canViewFinance, '/dashboard/finance')
  const { user, payload, as } = await dashContext()
  const params = await searchParams
  const edit = canEditFinance(user)
  const { docs } = await payload.find({ collection: 'financial-summaries', sort: '-periodStart', limit: 100, depth: 0, ...as })

  return (
    <section>
      <SectionTitle
        title="Financial summaries"
        desc={
          edit
            ? 'Period summaries only: no bank details, receipts or personal transaction data. Totals must reconcile.'
            : 'Read-only. The Treasurer prepares these summaries.'
        }
        actions={
          edit && (
            <Link className="btn btn-primary btn-sm" href="/dashboard/finance/new">
              <Icon name="plus" size={16} /> New summary
            </Link>
          )
        }
      />
      <Flash params={params} />
      {docs.length ? (
        <div className="dtable-w">
          <table className="dtable">
            <thead>
              <tr>
                <th>Period</th>
                <th>Dates</th>
                <th className="num">Opening</th>
                <th className="num">Income</th>
                <th className="num">Expenses</th>
                <th className="num">Closing</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Link href={`/dashboard/finance/${f.id}`}>{f.period}</Link>
                  </td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {fmtDate(f.periodStart)} – {fmtDate(f.periodEnd)}
                  </td>
                  <td className="num">{fmtMoney(f.openingBalance)}</td>
                  <td className="num" style={{ color: 'var(--color-success)' }}>
                    {fmtMoney(f.totalIncome)}
                  </td>
                  <td className="num" style={{ color: 'var(--color-error)' }}>
                    {fmtMoney(f.totalExpenses)}
                  </td>
                  <td className="num">
                    <strong>{fmtMoney(f.closingBalance)}</strong>
                  </td>
                  <td className="muted">{fmtDate(f.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No financial summaries yet.</Empty>
      )}
    </section>
  )
}
