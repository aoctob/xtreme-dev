import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { Adapter, CollectionOptions } from '@payloadcms/plugin-cloud-storage/types'
import { buildStoragePathData, getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import { del, get, put } from '@vercel/blob'
import type { Config, UploadCollectionSlug } from 'payload'

type Options = {
  token?: string
  /** Collections stored in Blob. `publicCache` lets browsers and the CDN cache public files such as Media. */
  collections: Partial<Record<UploadCollectionSlug, { publicCache?: boolean }>>
}

/**
 * Vercel Blob storage for a store with *private* access. The official adapter only writes
 * public blobs and fails on a private store. Every file here is served through Payload's
 * `/api/<collection>/file/<name>` route, so each collection's read access applies:
 * ID cards and registration photos reach permitted roles only, and Media stays public.
 */
export const privateBlobStorage =
  ({ token, collections }: Options) =>
  (config: Config): Config => {
    const enabled = Boolean(token)
    const adapter =
      (publicCache: boolean): Adapter =>
      ({ collection, prefix = '' }) => ({
        name: 'vercel-blob-private',
        handleUpload: async ({ file, storageFilePath }) => {
          await put(storageFilePath, file.buffer, {
            access: 'private',
            allowOverwrite: true,
            contentType: file.mimeType,
            token,
          })
        },
        handleDelete: async ({ storageFilePath }) => {
          await del(storageFilePath, { token })
        },
        staticHandler: async (req, { doc, headers: incoming, params: { clientUploadContext, filename } }) => {
          const docPrefix = await getFilePrefix({ clientUploadContext, collection, collectionPrefix: prefix, doc, filename, req })
          const { storageFilePath } = buildStoragePathData({ collectionPrefix: prefix, docPrefix, filename })
          const blob = await get(storageFilePath, { access: 'private', token }).catch(() => null)
          if (!blob?.stream) return new Response('Not found', { status: 404 })
          const headers = new Headers(incoming)
          headers.set('Content-Type', blob.blob.contentType ?? 'application/octet-stream')
          if (blob.blob.size != null) headers.set('Content-Length', String(blob.blob.size))
          // Payload names files uniquely, so public files can be cached for good; private ones never.
          headers.set('Cache-Control', publicCache ? 'public, max-age=31536000, immutable' : 'private, no-store')
          headers.set('X-Content-Type-Options', 'nosniff')
          return new Response(blob.stream, { headers, status: 200 })
        },
      })

    const pluginCollections = Object.fromEntries(
      Object.entries(collections).map(([slug, o]) => [slug, { adapter: enabled ? adapter(Boolean(o?.publicCache)) : null }]),
    ) as Partial<Record<UploadCollectionSlug, CollectionOptions>>

    const withStorage: Config = enabled
      ? {
          ...config,
          collections: (config.collections ?? []).map((c) =>
            c.slug in collections ? { ...c, upload: { ...(typeof c.upload === 'object' ? c.upload : {}), disableLocalStorage: true } } : c,
          ),
        }
      : config

    // Same schema whether or not a token is set (alwaysInsertFields), so local and production match.
    return cloudStoragePlugin({ alwaysInsertFields: true, enabled, collections: pluginCollections })(withStorage)
  }
