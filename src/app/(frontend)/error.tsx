'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/** Branded 500 page (PRD G-05). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <section className="section">
      <div className="container container--text stack" style={{ gap: 24, paddingBlock: 48 }}>
        <span className="eyebrow eyebrow--rule">Error</span>
        <h1 className="t-h1">Something went wrong</h1>
        <p className="t-lead">This page could not be shown. Please try again in a moment.</p>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn--secondary" href="/">
            Go home
          </Link>
          <Link className="btn btn--secondary" href="/fixtures">
            View fixtures
          </Link>
        </div>
      </div>
    </section>
  )
}
