import type { Metadata } from 'next'
import { RegisterForm } from '@/components/kit/RegisterForm'
import { PageHero } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { getJoinPage, getSiteSettings } from '@/lib/queries'
import { contactLine, responseTime, socialUrl } from '@/lib/site'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Player registration',
  description: `Register a player with ${CLUB_NAME} for the season, as the player or as a committee member.`,
  alternates: { canonical: '/register' },
}

export default async function RegisterPage() {
  const [s, j] = await Promise.all([getSiteSettings(), getJoinPage()])
  return (
    <div>
      <PageHero
        title="Player registration"
        desc="Register a player with the club for the season. Players can register themselves, or a committee member can register them."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Join', href: '/join' }, { label: 'Register' }]}
      />
      <section className="sec">
        <RegisterForm contact={contactLine(s)} responseTime={responseTime(j)} instagram={socialUrl(s, 'instagram')} />
      </section>
    </div>
  )
}
