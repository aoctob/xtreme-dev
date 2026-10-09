import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/media'
import { getAllMatchesForNav, getAllPostSlugs, getGallery, getPlayers } from '@/lib/queries'

export const revalidate = 3600

/** sitemap.xml generated from published Payload content (PRD §G.4). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const [posts, players, matches, gallery] = await Promise.all([
    getAllPostSlugs(),
    getPlayers(),
    getAllMatchesForNav(),
    getGallery(1),
  ])
  const staticPages = ['', '/about', '/squad', '/fixtures', '/join', '/sponsors', '/contact', '/privacy']
  // News and Gallery are listed only when they have content (they are hidden from navigation otherwise).
  if (posts?.length) staticPages.push('/news')
  if (gallery?.length) staticPages.push('/gallery')
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...(posts ?? []).map((p) => ({ url: `${base}/news/${p.slug}`, lastModified: p.updatedAt })),
    ...(players ?? []).map((p) => ({ url: `${base}/squad/${p.slug}`, lastModified: p.updatedAt })),
    ...(matches ?? []).map((m) => ({ url: `${base}/fixtures/${m.slug}` })),
  ]
}
