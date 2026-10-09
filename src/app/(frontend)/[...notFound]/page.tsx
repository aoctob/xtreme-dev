import { notFound } from 'next/navigation'

/** Sends unknown URLs to the branded 404 inside the site layout. */
export default function CatchAll() {
  notFound()
}
