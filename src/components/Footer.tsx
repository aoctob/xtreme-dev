import Link from 'next/link'
import type { SiteSetting } from '@/payload-types'
import { Badge, OrSupply } from './Basics'
import type { NavItem, Social } from './Header'
import { SocialIcon } from './SocialIcon'

export function Footer({
  items,
  socials,
  settings,
}: {
  items: NavItem[]
  socials: Social[]
  settings: SiteSetting | null
}) {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Badge size={72} alt="Xtreme FC badge" />
            <p className="t-small t-secondary">
              <OrSupply value={settings?.tagline} what="one-line club description" />
            </p>
          </div>
          <nav aria-labelledby="footer-site">
            <h2 id="footer-site">Site</h2>
            <ul role="list">
              {[...items, { href: '/join', label: 'Join' }, { href: '/contact', label: 'Contact' }].map((i) => (
                <li key={i.href}>
                  <Link href={i.href}>{i.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2>Contact</h2>
            <ul role="list" className="t-small">
              <li>
                {settings?.email ? (
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                ) : (
                  <OrSupply what="club email" />
                )}
              </li>
              <li>
                {settings?.phone ? (
                  <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
                ) : (
                  <OrSupply what="phone" />
                )}
              </li>
              <li className="t-secondary" style={{ whiteSpace: 'pre-line' }}>
                <OrSupply value={settings?.address} what="ground address" />
              </li>
            </ul>
          </div>
          <div>
            <h2>Follow</h2>
            {socials.length > 0 ? (
              <ul role="list" className="social-list">
                {socials.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" data-social={s.network}>
                      <SocialIcon network={s.network} />
                      <span className="sr-only">{s.label} (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="t-small">
                <OrSupply what="Instagram and other social links" />
              </p>
            )}
            <Link className="btn btn--primary btn--sm" href="/join" data-track="join_cta_click" data-track-location="footer">
              Join the club
            </Link>
          </div>
        </div>
        <div className="footer-bottom t-caption">
          <span>© {year} Xtreme FC</span>
          <Link href="/privacy">Privacy policy</Link>
        </div>
      </div>
    </footer>
  )
}
