import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import type { ReactNode } from 'react'
import { Analytics } from '@/components/Analytics'
import { Footer } from '@/components/Footer'
import { Header, type NavItem, type Social } from '@/components/Header'
import { labelFor, SOCIAL_NETWORKS } from '@/lib/constants'
import { siteUrl } from '@/lib/media'
import { getNavAvailability, getSiteSettings } from '@/lib/queries'
import './tokens.css'
import './site.css'

// Self-hosted, Latin subset, swap (design.md §C.1).
const archivo = localFont({
  src: '../../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2',
  variable: '--font-archivo',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
})
const inter = localFont({
  src: '../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  variable: '--font-inter',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Xtreme FC | Football club', template: '%s | Xtreme FC' },
  description:
    'Xtreme FC: fixtures, results, squad, news and how to join the club or become a sponsor.',
  openGraph: {
    type: 'website',
    siteName: 'Xtreme FC',
    locale: 'en_IN',
    images: [{ url: '/brand/og-default.jpg', width: 1200, height: 630, alt: 'Xtreme FC badge' }],
  },
  twitter: { card: 'summary_large_image', images: ['/brand/og-default.jpg'] },
}

export const viewport: Viewport = { themeColor: '#000000', colorScheme: 'dark' }

export const revalidate = 600

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, available] = await Promise.all([getSiteSettings(), getNavAvailability()])

  // Primary nav order per PRD §C.3; News and Gallery hide until they have content (§E.1).
  const items: NavItem[] = [
    { href: '/squad', label: 'Squad' },
    { href: '/fixtures', label: 'Fixtures' },
    ...(available.news ? [{ href: '/news', label: 'News' }] : []),
    ...(available.gallery ? [{ href: '/gallery', label: 'Gallery' }] : []),
    { href: '/about', label: 'About' },
    { href: '/sponsors', label: 'Sponsors' },
  ]
  const socials: Social[] = (settings?.socials ?? []).map((s) => ({
    network: s.network,
    url: s.url,
    label: labelFor(SOCIAL_NETWORKS, s.network),
  }))

  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://cloud.umami.is/script.js'

  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <Header items={items} socials={socials} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer items={items} socials={socials} settings={settings} />
        <Analytics />
        {umamiId && <Script src={umamiSrc} data-website-id={umamiId} strategy="afterInteractive" />}
      </body>
    </html>
  )
}
