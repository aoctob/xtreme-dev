import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GalleryBrowser } from '@/components/kit/gallery'
import { ErrorState, PageHero } from '@/components/kit/ui'
import { CLUB_NAME } from '@/lib/constants'
import { getGallery } from '@/lib/queries'
import { mediaVM } from '@/lib/view'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Gallery',
  description: `Photos and videos from ${CLUB_NAME} match days, training and the club around the ground.`,
  alternates: { canonical: '/gallery' },
}

export default async function GalleryPage() {
  const media = await getGallery()
  return (
    <div>
      <PageHero title="Gallery" desc="Match days, training and the club around the ground." crumbs={[{ label: 'Home', href: '/' }, { label: 'Gallery' }]} />
      {media === null ? (
        <section className="sec">
          <div className="wrap">
            <ErrorState title="Photos could not be loaded" description="Check your connection and try again." retryHref="/gallery" />
          </div>
        </section>
      ) : (
        <Suspense>
          <GalleryBrowser media={media.map(mediaVM)} />
        </Suspense>
      )}
    </div>
  )
}
