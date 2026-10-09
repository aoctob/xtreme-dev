import Link from 'next/link'
import type { Post } from '@/payload-types'
import { labelFor, POST_CATEGORIES } from '@/lib/constants'
import { formatLongDate } from '@/lib/format'
import { asMedia } from '@/lib/media'
import { MediaImage } from './Basics'

export const categoryLabel = (c: Post['category']) => labelFor(POST_CATEGORIES, c)

export function NewsCard({
  post,
  featured,
  priority,
  headingLevel = 3,
}: {
  post: Post
  featured?: boolean
  priority?: boolean
  headingLevel?: 2 | 3
}) {
  const H = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <article className={`news-card${featured ? ' news-card--featured' : ''}`}>
      <div className="news-card__media clip">
        <MediaImage
          media={asMedia(post.coverImage)}
          alt=""
          priority={priority}
          sizes={featured ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'}
        />
      </div>
      <div className="news-card__body">
        <div className="news-card__meta">
          <span className="chip chip--category">{categoryLabel(post.category)}</span>
          <time className="t-caption" dateTime={post.publishedAt}>
            {formatLongDate(post.publishedAt)}
          </time>
        </div>
        <H className="news-card__title">
          <Link href={`/news/${post.slug}`}>{post.title}</Link>
        </H>
        {post.excerpt && <p className="news-card__excerpt">{post.excerpt}</p>}
      </div>
    </article>
  )
}
