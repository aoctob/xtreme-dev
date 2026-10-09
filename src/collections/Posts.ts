import type { CollectionConfig } from 'payload'
import { publishedOrStaff, staff } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { POST_CATEGORIES } from '../lib/constants'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'News post', plural: 'News' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
  },
  access: { read: publishedOrStaff, create: staff, update: staff, delete: staff },
  defaultSort: '-publishedAt',
  versions: { drafts: true, maxPerDoc: 20 },
  hooks: revalidateCollection(() => ['/results']),
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 120 },
    slugField((d) => d.title as string | undefined),
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'club-news',
      options: POST_CATEGORIES.map(({ label, value }) => ({ label, value })),
      admin: { position: 'sidebar' },
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 200,
      admin: { description: 'One or two sentences for cards and search results.' },
    },
    { name: 'body', type: 'richText', required: true },
    { name: 'authorName', type: 'text', admin: { position: 'sidebar' } },
  ],
}
