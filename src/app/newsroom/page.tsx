import type { Metadata } from 'next';

import { NewsroomIndex } from '@/components/newsroom/NewsroomIndex';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  ARTICLES_PER_PAGE,
  getArticles,
  getArticlesPage,
  getCategories,
  getSearchIndex,
  getTotalPages,
} from '@/lib/articles';
import { SITE_URL, absoluteUrl } from '@/lib/content';
import { PERSON_ID, WEBSITE_ID, breadcrumbSchema, graph } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Newsroom',
  description:
    'Essays and notes by Tobias Börner on sovereign European AI, defence technology, public safety and company building.',
  path: '/newsroom',
});

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Newsroom', path: '/newsroom' },
];

export default function NewsroomPage() {
  const all = getArticles();
  const articles = getArticlesPage(1);

  return (
    <>
      <PageHeader
        eyebrow="Newsroom"
        title="Arguments, not announcements."
        intro="Longer pieces on European technology, sovereign AI, defence and what building here actually requires."
        trail={trail}
      />

      <NewsroomIndex
        articles={articles}
        categories={getCategories()}
        index={getSearchIndex()}
        page={1}
        totalPages={getTotalPages()}
      />

      <JsonLd
        id="newsroom-schema"
        json={graph(breadcrumbSchema(trail), {
          '@type': 'Blog',
          '@id': `${SITE_URL}/newsroom#blog`,
          name: 'Newsroom · Tobias Börner',
          url: absoluteUrl('/newsroom'),
          inLanguage: 'en',
          author: { '@id': PERSON_ID },
          publisher: { '@id': PERSON_ID },
          isPartOf: { '@id': WEBSITE_ID },
          blogPost: all.slice(0, ARTICLES_PER_PAGE).map((article) => ({
            '@type': 'BlogPosting',
            headline: article.title,
            url: absoluteUrl(`/newsroom/${article.slug}`),
            datePublished: new Date(article.date).toISOString(),
          })),
        })}
      />
    </>
  );
}
