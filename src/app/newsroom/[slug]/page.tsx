import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArticleCard } from '@/components/newsroom/ArticleCard';
import { Mdx } from '@/components/newsroom/Mdx';
import { NewsletterForm } from '@/components/newsroom/NewsletterForm';
import { ShareRow } from '@/components/newsroom/ShareRow';
import { JsonLd } from '@/components/ui/JsonLd';
import { Mark } from '@/components/ui/Logo';
import { Breadcrumbs } from '@/components/ui/PageHeader';
import { getArticle, getArticles, getRelatedArticles } from '@/lib/articles';
import { SITE, absoluteUrl } from '@/lib/content';
import { articleSchema, breadcrumbSchema, graph } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';
import { formatDate, slugify } from '@/lib/utils';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) {
    return buildMetadata({ title: 'Not found', description: '', path: '/newsroom', noIndex: true });
  }

  return buildMetadata({
    title: article.title,
    description: article.description,
    path: `/newsroom/${article.slug}`,
    image: article.cover,
    type: 'article',
    publishedTime: new Date(article.date).toISOString(),
    modifiedTime: new Date(article.updated ?? article.date).toISOString(),
    keywords: [...article.categories, 'Tobias Börner'],
  });
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(slug, 2);
  const url = absoluteUrl(`/newsroom/${article.slug}`);
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Newsroom', path: '/newsroom' },
    { name: article.title, path: `/newsroom/${article.slug}` },
  ];

  return (
    <>
      <article>
        <header className="relative pt-[calc(var(--nav-h)+3.5rem)] sm:pt-[calc(var(--nav-h)+5rem)]">
          <div className="shell">
            <Breadcrumbs
              trail={[
                { name: 'Home', path: '/' },
                { name: 'Newsroom', path: '/newsroom' },
                { name: article.categories[0], path: `/newsroom/category/${slugify(article.categories[0])}` },
              ]}
            />

            <div className="mx-auto mt-10 max-w-prose">
              <ul className="flex flex-wrap gap-2">
                {article.categories.map((category) => (
                  <li key={category}>
                    <Link
                      href={`/newsroom/category/${slugify(category)}`}
                      className="inline-block rounded-full border border-line/[0.12] px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.13em] text-bone/55 transition-colors duration-500 hover:border-line/25 hover:text-bone"
                    >
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>

              <h1 className="mt-7 text-d2 font-medium balance text-gradient">{article.title}</h1>

              <p className="mt-6 text-lead pretty text-bone/60">{article.description}</p>

              <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line/[0.07] pt-6">
                <span className="flex items-center gap-2.5">
                  <Mark className="h-5 w-5 text-steel/80" />
                  <span className="text-[0.875rem] text-bone">{SITE.name}</span>
                </span>
                <span aria-hidden="true" className="text-faint/50">
                  ·
                </span>
                <time dateTime={article.date} className="text-[0.875rem] text-faint">
                  {formatDate(article.date)}
                </time>
                <span aria-hidden="true" className="text-faint/50">
                  ·
                </span>
                <span className="text-[0.875rem] text-faint">{article.readingTime} min read</span>
              </div>
            </div>
          </div>
        </header>

        <figure className="shell mt-12 sm:mt-16">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line/[0.08] bg-ink-raised">
            <Image
              src={article.cover}
              alt={article.coverAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1280px"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 text-[0.75rem] text-faint">{article.coverAlt}</figcaption>
        </figure>

        <div className="shell mt-14 sm:mt-20">
          <div className="prose prose-editorial mx-auto max-w-prose">
            <Mdx source={article.body} />
          </div>

          <div className="mx-auto mt-16 max-w-prose border-t border-line/[0.07] pt-8">
            <ShareRow title={article.title} url={url} />
          </div>

          {/* Author block: an entity anchor for search and LLMs */}
          <aside className="mx-auto mt-12 max-w-prose">
            <div className="card flex flex-col gap-4 p-7">
              <div className="flex items-center gap-3">
                <Mark className="h-6 w-6 text-steel/85" />
                <div>
                  <p className="text-[0.9375rem] font-medium text-bone">{SITE.name}</p>
                  <p className="text-[0.8125rem] text-faint">{SITE.role}</p>
                </div>
              </div>
              <p className="text-[0.9375rem] leading-relaxed text-bone/55">
                CEO of Civitas Europe, executive at Orcrist Technologies, co-founder of Fastic and
                former CMO of LOVOO. Writes about European technology, AI and company building.
              </p>
              <Link href="/companies" className="link-draw w-fit text-[0.875rem] text-bone">
                More about the work
              </Link>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <section aria-labelledby="related-heading" className="mt-24 border-t border-line/[0.06] py-20">
            <div className="shell">
              <h2 id="related-heading" className="eyebrow">
                Related reading
              </h2>
              <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2">
                {related.map((item) => (
                  <ArticleCard key={item.slug} article={item} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <div className="shell pb-24">
          <NewsletterForm />
        </div>
      </article>

      <JsonLd
        id={`article-schema-${article.slug}`}
        json={graph(breadcrumbSchema(trail), articleSchema(article))}
      />
    </>
  );
}
