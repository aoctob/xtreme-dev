import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import {
  canManageAnnouncements,
  canViewAudit,
  canViewFinance,
  canViewMembers,
  canViewPlayerRecords,
  showAdminPanelLink,
} from '@/access/roles'
import { DashNav, type NavItem } from '@/components/dash/client'
import { DashHeader } from '@/components/dash/ui'
import { dashContext } from '@/lib/dashboard'
import '../dash.css'

export const metadata: Metadata = { title: 'Committee dashboard', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await dashContext()
  const items: (NavItem | 'sep')[] = [
    { href: '/dashboard', label: 'Overview', icon: 'layout-dashboard' },
    ...(canViewPlayerRecords(user)
      ? ([
          { href: '/dashboard/approvals', label: 'Approvals', icon: 'user-check' },
          { href: '/dashboard/players', label: 'Players', icon: 'shirt' },
        ] as NavItem[])
      : []),
    ...(canViewMembers(user) ? [{ href: '/dashboard/members', label: 'Members', icon: 'users' } as NavItem] : []),
    { href: '/dashboard/appointments', label: 'Appointments', icon: 'shield' },
    ...(canManageAnnouncements(user) ? [{ href: '/dashboard/announcements', label: 'Announcements', icon: 'megaphone' } as NavItem] : []),
    ...(canViewFinance(user) ? [{ href: '/dashboard/finance', label: 'Finance', icon: 'wallet' } as NavItem] : []),
    ...(canViewAudit(user) ? [{ href: '/dashboard/audit', label: 'Audit log', icon: 'history' } as NavItem] : []),
    'sep',
    ...(showAdminPanelLink(user) ? [{ href: '/admin', label: 'Admin panel', icon: 'arrow-up-right', external: true } as NavItem] : []),
    { href: '/account', label: 'My account', icon: 'user' },
  ]
  return (
    <div>
      <DashHeader eyebrow="Committee" title="Dashboard" user={user} />
      <div className="wrap dash">
        <DashNav items={items} />
        <div className="dmain">{children}</div>
      </div>
    </div>
  )
}
