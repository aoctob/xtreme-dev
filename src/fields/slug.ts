import type { TextField } from 'payload'
import { formatSlug } from '../hooks/slug'

export const slugField = (build: (data: Record<string, unknown>) => string | undefined): TextField => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Used in the page address. Leave empty to generate it automatically.',
  },
  hooks: { beforeValidate: [formatSlug(build)] },
})
