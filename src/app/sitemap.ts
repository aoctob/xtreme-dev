import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/media'
import { getAllMatchesForNav, getPlayers } from '@/lib/queries'

export const revalidate = 3600

/** sitemap.xml generated from published Payload content (PRD §G.4). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const [players, matches] = await Promise.all([getPlayers(), getAllMatchesForNav()])
  const staticPages = ['', '/about', '/squad', '/results', '/gallery', '/join', '/register', '/sponsors', '/contact', '/privacy', '/announcements']
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...(players ?? [])
      .filter((p) => p.squadRole !== 'guest')
      .map((p) => ({ url: `${base}/squad/${p.slug}`, lastModified: p.updatedAt })),
    ...(matches ?? []).map((m) => ({ url: `${base}/results/${m.slug}` })),
  ]
}
