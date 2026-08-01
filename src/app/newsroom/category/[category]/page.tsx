import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { NewsroomIndex } from '@/components/newsroom/NewsroomIndex';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  getArticlesByCategory,
  getCategories,
  getCategoryName,
} from '@/lib/articles';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';

type Params = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return getCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const name = getCategoryName(category);
  if (!name) {
    return buildMetadata({ title: 'Not found', description: '', path: '/newsroom', noIndex: true });
  }

  return buildMetadata({
    title: `${name} · Newsroom`,
    description: `Articles by Tobias Börner on ${name.toLowerCase()}.`,
    path: `/newsroom/category/${category}`,
    keywords: [name, 'Tobias Börner', 'European technology'],
  });
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params;
  const name = getCategoryName(category);
  if (!name) notFound();

  const articles = getArticlesByCategory(category);
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Newsroom', path: '/newsroom' },
    { name, path: `/newsroom/category/${category}` },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Category"
        title={name}
        intro={`${articles.length} article${articles.length === 1 ? '' : 's'} on ${name.toLowerCase()}.`}
        trail={trail}
      />
      <NewsroomIndex
        articles={articles}
        categories={getCategories()}
        activeCategory={category}
        showFeature={false}
      />
      <JsonLd id={`category-${category}-schema`} json={graph(breadcrumbSchema(trail))} />
    </>
  );
}
