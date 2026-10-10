import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import type { ReactNode } from 'react'
import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
import { Analytics } from '@/components/Analytics'
import { Footer } from '@/components/kit/Footer'
import { Header } from '@/components/kit/Header'
import { ToastProvider } from '@/components/kit/toast'
import { CLUB_NAME } from '@/lib/constants'
import { siteUrl } from '@/lib/media'
import { getSiteSettings } from '@/lib/queries'
import './kit.css'
import './ds.css'

// Self-hosted, Latin subset, swap (design.md §C.1).
const archivo = localFont({
  src: '../../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2',
  variable: '--font-archivo',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
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
  title: { default: `${CLUB_NAME} | Football club`, template: `%s | ${CLUB_NAME}` },
  description: `${CLUB_NAME}: the squad, the next match, results and how to join the club or become a sponsor.`,
  openGraph: {
    type: 'website',
    siteName: CLUB_NAME,
    locale: 'en_IN',
    images: [{ url: '/brand/og-default.jpg', width: 1200, height: 630, alt: `${CLUB_NAME} badge` }],
  },
  twitter: { card: 'summary_large_image', images: ['/brand/og-default.jpg'] },
}

export const viewport: Viewport = { themeColor: '#07140A', colorScheme: 'dark' }

export const revalidate = 600

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://cloud.umami.is/script.js'

  return (
    // "Expressive" is the kit's default motion level; reduced-motion users get the final state.
    <html lang="en" data-motion="expressive" className={`${archivo.variable} ${inter.variable}`}>
      <body>
        <ToastProvider>
          <a className="skip" href="#main">
            Skip to main content
          </a>
          <Header announcement={settings?.announcement} />
          <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
            {children}
          </main>
          <Footer settings={settings} />
        </ToastProvider>
        <Analytics />
        <VercelAnalytics />
        {umamiId && <Script src={umamiSrc} data-website-id={umamiId} strategy="afterInteractive" />}
      </body>
    </html>
  )
}
