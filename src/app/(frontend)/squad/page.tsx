import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { EmptyState, ErrorBox, JoinCta, PageHero } from '@/components/Basics'
import { PlayerCard, StaffCard } from '@/components/Player'
import { SquadFilter, type SquadGroup } from '@/components/SquadFilter'
import { POSITIONS } from '@/lib/constants'
import { getPlayers, getSiteSettings, getStaff } from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Squad & staff',
  description: 'Meet the Xtreme FC squad: goalkeepers, defenders, midfielders, forwards and coaching staff.',
  alternates: { canonical: '/squad' },
}

export default async function SquadPage() {
  const [players, staff, settings] = await Promise.all([getPlayers(), getStaff(), getSiteSettings()])

  if (players === null) {
    return (
      <>
        <PageHero title="Squad" />
        <section className="section">
          <div className="container">
            <ErrorBox what="The squad" href="/squad" />
          </div>
        </section>
      </>
    )
  }

  const groups: SquadGroup[] = POSITIONS.map((pos) => {
    const list = players.filter((p) => p.position === pos.value)
    return {
      key: pos.value,
      query: pos.query,
      title: pos.plural,
      count: list.length,
      content: (
        <ul role="list" className="player-grid">
          {list.map((p) => (
            <li key={p.id}>
              <PlayerCard player={p} />
            </li>
          ))}
        </ul>
      ),
    }
  })
  if (staff && staff.length) {
    groups.push({
      key: 'staff',
      query: 'staff',
      title: 'Staff',
      count: staff.length,
      content: (
        <ul role="list" className="player-grid">
          {staff.map((s) => (
            <li key={s.id}>
              <StaffCard person={s} />
            </li>
          ))}
        </ul>
      ),
    })
  }

  return (
    <>
      <PageHero
        title="Squad"
        description={players.length ? `${players.length} ${players.length === 1 ? 'player' : 'players'}` : undefined}
      />
      <section className="section">
        <div className="container">
          <h2 className="sr-only">Players and staff</h2>
          {players.length === 0 && !staff?.length ? (
            <EmptyState icon={<Users aria-hidden="true" />} title="Squad coming soon">
              <p>The club is preparing player profiles.</p>
            </EmptyState>
          ) : (
            <SquadFilter groups={groups} />
          )}
        </div>
      </section>
      <JoinCta text={settings?.joinCtaText} />
    </>
  )
}
