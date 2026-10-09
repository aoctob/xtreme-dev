import type { Media } from '@/payload-types'

export type MaybeMedia = number | Media | null | undefined

/** Upload fields arrive as an id when not populated; treat that as "no image". */
export const asMedia = (m: MaybeMedia): Media | null =>
  m && typeof m === 'object' && m.url ? m : null

export const mediaList = (items: MaybeMedia[] | null | undefined): Media[] =>
  (items ?? []).map(asMedia).filter((m): m is Media => Boolean(m))

export const absoluteUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path
  return `${siteUrl()}${path.startsWith('/') ? '' : '/'}${path}`
}

export const siteUrl = (): string =>
  (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

/** youtube.com / youtu.be link → privacy-enhanced embed URL (PRD §D.9). */
export function youtubeEmbed(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/)
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0` : null
}
