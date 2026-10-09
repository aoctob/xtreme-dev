import Link from 'next/link'

export const metadata = { title: 'Page not found', robots: { index: false } }

/** Branded 404 (PRD G-05, design.md §E.16). */
export default function NotFound() {
  return (
    <section className="section">
      <div className="container container--text stack" style={{ gap: 24, paddingBlock: 48 }}>
        <span className="eyebrow eyebrow--rule">Error 404</span>
        <h1 className="t-h1">Page not found</h1>
        <p className="t-lead">The page you are looking for has moved or never existed.</p>
        <div className="btn-row">
          <Link className="btn btn--primary" href="/">
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
