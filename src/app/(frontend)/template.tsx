import type { ReactNode } from 'react'

/** Re-mounts on every navigation, so each page gets the kit's entrance animation. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page">{children}</div>
}
