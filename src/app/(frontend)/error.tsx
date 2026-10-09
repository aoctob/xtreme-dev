'use client'

import { useEffect } from 'react'
import { Button } from '@/components/kit/ui'

/** Branded 500 page, in the 404's layout. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <section className="nf">
      <div className="phero-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="wrap nf-in">
        <h1 className="h2">Something went wrong</h1>
        <p className="body-l muted">This page could not be shown. Please try again in a moment.</p>
        <div className="btnrow">
          <Button icon="arrow-right" onClick={reset}>
            Try again
          </Button>
          <Button variant="secondary" href="/">
            Go to the home page
          </Button>
        </div>
      </div>
    </section>
  )
}
