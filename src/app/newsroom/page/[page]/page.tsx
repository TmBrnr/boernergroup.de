import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { NewsroomIndex } from '@/components/newsroom/NewsroomIndex';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHeader } from '@/components/ui/PageHeader';
import { getArticlesPage, getCategories, getTotalPages } from '@/lib/articles';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';

type Params = { params: Promise<{ page: string }> };

export function generateStaticParams() {
  // Page one is included so the route always has at least one param and can be
  // statically exported. It canonicalises to /newsroom.
  return Array.from({ length: getTotalPages() }, (_, index) => ({ page: String(index + 1) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { page } = await params;
  return buildMetadata({
    title: `Newsroom, page ${page}`,
    description: 'Essays and notes by Tobias Börner on European technology, AI, defence and public safety.',
    // Page one is the same content as the index, so it points there.
    path: page === '1' ? '/newsroom' : `/newsroom/page/${page}`,
    noIndex: page === '1',
  });
}

export default async function NewsroomPaginated({ params }: Params) {
  const { page: raw } = await params;
  const page = Number(raw);
  const totalPages = getTotalPages();

  if (!Number.isInteger(page) || page < 1 || page > totalPages) notFound();

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Newsroom', path: '/newsroom' },
    { name: `Page ${page}`, path: `/newsroom/page/${page}` },
  ];

  return (
    <>
      <PageHeader eyebrow={`Page ${page}`} title="Newsroom." trail={trail} />
      <NewsroomIndex
        articles={getArticlesPage(page)}
        categories={getCategories()}
        page={page}
        totalPages={totalPages}
        showFeature={false}
      />
      <JsonLd id={`newsroom-page-${page}-schema`} json={graph(breadcrumbSchema(trail))} />
    </>
  );
}
