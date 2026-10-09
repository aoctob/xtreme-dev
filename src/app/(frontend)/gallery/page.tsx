import type { Metadata } from 'next'
import { Images } from 'lucide-react'
import { EmptyState, ErrorBox, PageHero } from '@/components/Basics'
import { Gallery } from '@/components/Gallery'
import { toGalleryItems } from '@/lib/gallery'
import { getGallery } from '@/lib/queries'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photos and videos from Xtreme FC matches and training.',
  alternates: { canonical: '/gallery' },
}

export default async function GalleryPage() {
  const media = await getGallery()
  return (
    <>
      <PageHero title="Gallery" description="Match-day and training moments." />
      <section className="section">
        <div className="container">
          <h2 className="sr-only">Photos and videos</h2>
          {media === null ? (
            <ErrorBox what="The gallery" href="/gallery" />
          ) : media.length === 0 ? (
            <EmptyState icon={<Images aria-hidden="true" />} title="Photos coming soon." />
          ) : (
            <Gallery items={toGalleryItems(media)} filter />
          )}
        </div>
      </section>
    </>
  )
}
