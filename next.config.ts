import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV !== 'production'
const umami = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  ? new URL(process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://cloud.umami.is/script.js').origin
  : ''
const blob = 'https://*.public.blob.vercel-storage.com'

// Security headers (PRD §G.5). Inline scripts are needed by Next.js and the Payload admin.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${umami}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${blob}`,
  "font-src 'self' data:",
  `connect-src 'self' ${blob} https://vercel.com/api/blob ${umami}${isDev ? ' ws:' : ''}`.trim(),
  "frame-src 'self' https://www.youtube-nocookie.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Local uploads in development; Vercel Blob in production.
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/brand/**' }],
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
