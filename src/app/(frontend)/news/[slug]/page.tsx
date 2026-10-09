import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { Breadcrumb, MediaImage, TextLink } from '@/components/Basics'
import { NewsCard, categoryLabel } from '@/components/News'
import { ShareButton } from '@/components/Share'
import { formatLongDate } from '@/lib/format'
import { asMedia } from '@/lib/media'
import { getAllPostSlugs, getLatestPosts, getPostBySlug } from '@/lib/queries'

export const revalidate = 600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const posts = await getAllPostSlugs()
  return (posts ?? []).filter((p) => p.slug).map((p) => ({ slug: p.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Article not found' }
  const cover = asMedia(post.coverImage)
  return {
    title: post.title.slice(0, 50),
    description: (post.excerpt || `${categoryLabel(post.category)} from Xtreme FC, ${formatLongDate(post.publishedAt)}.`).slice(0, 155),
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt,
      ...(cover?.url ? { images: [{ url: cover.sizes?.large?.url || cover.url, alt: cover.alt }] } : {}),
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const [post, latest] = await Promise.all([getPostBySlug(slug), getLatestPosts(4)])
  if (!post) notFound()

  const cover = asMedia(post.coverImage)
  const related = (latest ?? []).filter((p) => p.id !== post.id).slice(0, 3)
  const nextArticle = related[0]

  return (
    <>
      <Breadcrumb trail={[{ href: '/', label: 'Home' }, { href: '/news', label: 'News' }, { label: post.title }]} />
      <article>
        <div className="container container--text article-head">
          <span className="chip chip--category" style={{ justifySelf: 'start' }}>
            {categoryLabel(post.category)}
          </span>
          <h1 className="t-h1">{post.title}</h1>
          <p className="t-caption">
            <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
            {post.authorName ? ` · ${post.authorName}` : ''}
          </p>
        </div>
        {cover && (
          <div className="container">
            <figure style={{ margin: 0 }}>
              <div className="article-cover clip clip--lg">
                <MediaImage media={cover} size="large" priority sizes="(min-width: 1280px) 1280px, 100vw" />
              </div>
              {cover.caption && <figcaption className="t-caption" style={{ marginTop: -24, marginBottom: 32 }}>{cover.caption}</figcaption>}
            </figure>
          </div>
        )}
        <div className="container container--text" style={{ paddingBottom: 64, paddingTop: cover ? 0 : 32 }}>
          <div className="prose">
            <RichText data={post.body} />
          </div>
          <div className="share-row">
            <ShareButton title={post.title} />
            {nextArticle && <TextLink href={`/news/${nextArticle.slug}`}>Next article</TextLink>}
          </div>
        </div>
      </article>
      {related.length > 0 && (
        <section className="section section--alt" aria-labelledby="related-title">
          <div className="container">
            <h2 id="related-title" className="t-h2" style={{ marginBottom: 32 }}>
              More news
            </h2>
            <div className="news-grid">
              {related.map((p) => (
                <NewsCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
