import type { FieldHook } from 'payload'

export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Fills an empty slug from other fields of the same document (PRD §C.4 URL rules). */
export const formatSlug =
  (build: (data: Record<string, unknown>) => string | undefined): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.trim()) return slugify(value)
    const source = build({ ...(originalDoc ?? {}), ...(data ?? {}) })
    return source ? slugify(source) : value
  }
