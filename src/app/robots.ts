import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/media'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/preview', '/dashboard', '/account', '/login'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
