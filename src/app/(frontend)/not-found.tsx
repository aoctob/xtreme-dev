import { Button } from '@/components/kit/ui'

export const metadata = { title: 'Page not found', robots: { index: false } }

/** Branded 404 (kit-media.jsx NotFound). */
export default function NotFound() {
  return (
    <section className="nf">
      <div className="phero-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="wrap nf-in">
        <div className="nf-num tnum" aria-hidden="true">
          <span>4</span>
          <span>0</span>
          <span>4</span>
        </div>
        <h1 className="h2">Page not found</h1>
        <p className="body-l muted">The page may have moved, or the link is wrong.</p>
        <div className="btnrow">
          <Button icon="arrow-right" href="/">
            Go to the home page
          </Button>
          <Button variant="secondary" href="/results">
            View results
          </Button>
        </div>
      </div>
    </section>
  )
}
