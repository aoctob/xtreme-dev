import Link from 'next/link'
import type { SiteSetting } from '@/payload-types'
import { CLUB_NAME, labelFor, SOCIAL_NETWORKS } from '@/lib/constants'
import { supply } from '@/lib/view'
import { SocialIcon } from '../SocialIcon'
import { Button, LOGO } from './ui'

const SITE_LINKS = [
  { href: '/squad', label: 'Squad' },
  { href: '/results', label: 'Results' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
  { href: '/sponsors', label: 'Sponsors' },
  { href: '/contact', label: 'Contact' },
]

/** components/navigation/Footer.jsx, filled from Site settings. */
export function Footer({ settings }: { settings: SiteSetting | null }) {
  const socials = settings?.socials ?? []
  return (
    <footer className="xf">
      <div className="xf-accent" />
      <div className="xf-grid">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="" className="xf-logo" width={56} height={56} />
          <p className="xf-tag">{CLUB_NAME} — play with intent.</p>
        </div>
        <nav className="xf-col" aria-label="Footer">
          {SITE_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="xf-col">
          {settings?.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : <span>{supply(null, 'email')}</span>}
          {settings?.phone ? (
            <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
          ) : (
            <span>{supply(null, 'phone')}</span>
          )}
          <span style={{ whiteSpace: 'pre-line' }}>{supply(settings?.address, 'address')}</span>
        </div>
        <div className="xf-col4">
          {socials.length > 0 && (
            <div className="xf-social">
              {socials.map((s) => (
                <a
                  key={s.id ?? s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={labelFor(SOCIAL_NETWORKS, s.network)}
                  data-social={s.network}
                >
                  <SocialIcon network={s.network} />
                </a>
              ))}
            </div>
          )}
          <Button href="/join" data-track="join_cta_click" data-track-location="footer">
            Join
          </Button>
        </div>
      </div>
      <div className="xf-bottom">
        <span>© {CLUB_NAME}</span>
        <Link href="/privacy">Privacy</Link>
      </div>
    </footer>
  )
}
