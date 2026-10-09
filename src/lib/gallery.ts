import type { GalleryItem } from '@/components/Gallery'
import type { Media } from '@/payload-types'

/** Media docs → serialisable lightbox items. */
export function toGalleryItems(media: Media[]): GalleryItem[] {
  return media
    .filter((m) => m.url)
    .map((m) => ({
      id: m.id,
      src: m.sizes?.large?.url || m.url!,
      thumb: m.sizes?.thumb?.url || m.url!,
      width: m.sizes?.large?.width || m.width || 1600,
      height: m.sizes?.large?.height || m.height || 1067,
      alt: m.alt,
      caption: m.caption,
      credit: m.credit,
      album: m.album,
      videoUrl: m.type === 'video' ? m.videoUrl : null,
    }))
}
