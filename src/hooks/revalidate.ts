import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * On-demand revalidation (PRD §J.4). Each collection says which public paths
 * show its documents; saving or deleting one refreshes those pages.
 * Calls are skipped outside a Next.js request (CLI scripts, migrations, seed).
 */
async function revalidatePaths(paths: string[], logger?: { warn: (msg: string) => void }) {
  try {
    const { revalidatePath } = await import('next/cache')
    for (const path of new Set(paths)) {
      if (path === '*') revalidatePath('/', 'layout')
      else revalidatePath(path)
    }
  } catch (err) {
    logger?.warn(`Revalidation skipped: ${(err as Error).message}`)
  }
}

type PathsFor<T> = (doc: T) => string[]

export function revalidateCollection<T extends { slug?: string | null }>(pathsFor: PathsFor<T>) {
  const afterChange: CollectionAfterChangeHook<T & { id: number | string }> = async ({
    doc,
    previousDoc,
    req,
    context,
  }) => {
    if (context?.disableRevalidate) return doc
    const paths = [...pathsFor(doc)]
    if (previousDoc?.slug && previousDoc.slug !== doc.slug) paths.push(...pathsFor(previousDoc))
    await revalidatePaths(paths, req.payload.logger)
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook<T & { id: number | string }> = async ({
    doc,
    req,
    context,
  }) => {
    if (context?.disableRevalidate) return doc
    await revalidatePaths(pathsFor(doc), req.payload.logger)
    return doc
  }
  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}

/** Globals feed the header/footer, so they refresh every page. */
export const revalidateEverything: GlobalAfterChangeHook = async ({ doc, req, context }) => {
  if (context?.disableRevalidate) return doc
  await revalidatePaths(['*'], req.payload.logger)
  return doc
}
