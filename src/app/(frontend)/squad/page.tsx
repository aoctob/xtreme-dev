import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CountUp } from '@/components/kit/motion'
import { SquadView } from '@/components/kit/widgets'
import { ErrorState, JoinBand, PageHero } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { getPlayers, getSiteSettings, getStaff } from '@/lib/queries'
import { guestVM, playerVM, staffVM } from '@/lib/view'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Squad',
  description: `Meet the ${CLUB_NAME} squad: goalkeepers, defenders, midfielders, forwards, guest players and staff.`,
  alternates: { canonical: '/squad' },
}

export default async function SquadPage() {
  const [players, staff, settings] = await Promise.all([getPlayers(), getStaff(), getSiteSettings()])
  const squad = (players ?? []).filter((p) => p.squadRole !== 'guest').map(playerVM)
  const guests = (players ?? []).filter((p) => p.squadRole === 'guest').map(guestVM)
  const crew = (staff ?? []).map(staffVM)
  return (
    <div>
      <PageHero title="Squad" crumbs={[{ label: 'Home', href: '/' }, { label: 'Squad' }]}>
        {players !== null && (
          <p className="phero-desc">
            <span className="tnum neon-num">
              <CountUp value={squad.length} />
            </span>{' '}
            players ·{' '}
            <span className="tnum neon-num">
              <CountUp value={guests.length} />
            </span>{' '}
            guests ·{' '}
            <span className="tnum neon-num">
              <CountUp value={crew.length} />
            </span>{' '}
            staff
          </p>
        )}
      </PageHero>
      {players === null ? (
        <section className="sec">
          <div className="wrap">
            <ErrorState title="Squad could not be loaded" description="Check your connection and try again." retryHref="/squad" />
          </div>
        </section>
      ) : (
        <Suspense>
          <SquadView players={squad} guests={guests} staff={crew} />
        </Suspense>
      )}
      <JoinBand text={settings?.joinCtaText} />
    </div>
  )
}
