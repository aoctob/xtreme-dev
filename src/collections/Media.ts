import type { CollectionConfig } from 'payload'
import { anyone, staff } from '../access'
import { revalidateCollection } from '../hooks/revalidate'

/**
 * Images (stored in Vercel Blob in production) and externally hosted videos.
 * For a video, upload the poster image and paste the YouTube/Instagram link (PRD §D.9, §F.4).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    defaultColumns: ['filename', 'alt', 'album', 'type', 'showInGallery'],
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection(() => ['/', '/gallery']),
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describe what is in the picture, e.g. "Number 9 shooting during the match against [opponent]". Never just "photo".',
      },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'image',
      required: true,
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Video (external link; this file is the poster)', value: 'video' },
      ],
    },
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'video',
        description:
          'YouTube or Instagram link. YouTube plays from youtube-nocookie.com only after a tap.',
      },
      validate: (value: unknown, { siblingData }: { siblingData: Partial<{ type: string }> }) => {
        if (siblingData?.type !== 'video') return true
        if (!value) return 'A video link is required for video items.'
        return /^https:\/\//.test(String(value)) || 'Use a full https:// link.'
      },
    },
    { name: 'caption', type: 'text' },
    { name: 'credit', type: 'text', admin: { description: 'Photographer credit (optional).' } },
    {
      name: 'album',
      type: 'text',
      index: true,
      admin: {
        description: 'Album name used by the gallery filter, e.g. "Training" or "vs. [opponent]".',
      },
    },
    {
      name: 'showInGallery',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show this item on the public Gallery page.' },
    },
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
    // Sharp drops EXIF (including GPS location) unless told to keep it (PRD §G.6).
    imageSizes: [
      {
        name: 'thumb',
        width: 480,
        height: 480,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 78 } },
      },
      { name: 'card', width: 960, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'large', width: 1920, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
}
