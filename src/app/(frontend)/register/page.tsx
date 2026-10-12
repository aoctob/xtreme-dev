import type { Metadata } from 'next'
import { RegisterForm } from '@/components/kit/RegisterForm'
import { PageHero } from '@/components/kit/ui'
import { committeeSubmitter } from '@/access/roles'
import { getCurrentUser } from '@/lib/auth'
import { CLUB_NAME } from '@/lib/constants'
import { getJoinPage, getSiteSettings } from '@/lib/queries'
import { contactLine, responseTime, socialUrl } from '@/lib/site'

// Reads the signed-in account to decide who is registering, so it renders per request.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Player registration',
  description: `Register a player with ${CLUB_NAME} for the season, as the player or as a committee member.`,
  alternates: { canonical: '/register' },
}

export default async function RegisterPage() {
  const [s, j, me] = await Promise.all([getSiteSettings(), getJoinPage(), getCurrentUser()])
  return (
    <div>
      <PageHero
        title="Player registration"
        desc="Register a player with the club for the season. Players can register themselves, or a committee member can register them."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Join', href: '/join' }, { label: 'Register' }]}
      />
      <section className="sec">
        <RegisterForm
          contact={contactLine(s)}
          responseTime={responseTime(j)}
          instagram={socialUrl(s, 'instagram')}
          submitter={committeeSubmitter(me)}
        />
      </section>
    </div>
  )
}
