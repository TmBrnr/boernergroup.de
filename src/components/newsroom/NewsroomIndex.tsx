import Link from 'next/link';

import { ArticleCard } from '@/components/newsroom/ArticleCard';
import { NewsletterForm } from '@/components/newsroom/NewsletterForm';
import { NewsroomSearch } from '@/components/newsroom/NewsroomSearch';
import { Pagination } from '@/components/newsroom/Pagination';
import { Reveal } from '@/components/ui/Reveal';
import { cx } from '@/lib/utils';
import type { CategoryRef, SearchEntry } from '@/lib/articles';
import type { Article } from '@/lib/types';

export function NewsroomIndex({
  articles,
  categories,
  index,
  page,
  totalPages,
  activeCategory,
  showFeature = true,
}: {
  articles: Article[];
  categories: CategoryRef[];
  index?: SearchEntry[];
  page?: number;
  totalPages?: number;
  activeCategory?: string;
  showFeature?: boolean;
}) {
  const [feature, ...rest] = articles;
  const grid = showFeature ? rest : articles;

  const articleIndex = (
    <>
      {articles.length === 0 ? (
        <p className="mt-16 text-[0.9375rem] text-bone/55">No articles here yet.</p>
      ) : null}

      {showFeature && feature ? (
        <Reveal className="mt-16">
          <ArticleCard article={feature} size="feature" priority />
        </Reveal>
      ) : null}

      {grid.length > 0 ? (
        <div className="mt-20 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((article, i) => (
            <Reveal key={article.slug} delay={i * 0.05}>
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>
      ) : null}

      {page && totalPages ? <Pagination page={page} totalPages={totalPages} /> : null}
    </>
  );

  const categoriesNav = (
    <nav aria-label="Categories">
      <ul className="mask-fade-x flex flex-wrap gap-2">
        <li>
          <Link
            href="/newsroom"
            aria-current={!activeCategory ? 'page' : undefined}
            className={cx(
              'inline-block rounded-full border px-4 py-1.5 text-[0.8125rem] transition-colors duration-500',
              !activeCategory
                ? 'border-transparent bg-bone text-ink-deep'
                : 'border-line/[0.12] text-bone/60 hover:border-line/25 hover:text-bone',
            )}
          >
            All
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/newsroom/category/${category.slug}`}
              aria-current={activeCategory === category.slug ? 'page' : undefined}
              className={cx(
                'inline-block rounded-full border px-4 py-1.5 text-[0.8125rem] transition-colors duration-500',
                activeCategory === category.slug
                  ? 'border-transparent bg-bone text-ink-deep'
                  : 'border-line/[0.12] text-bone/60 hover:border-line/25 hover:text-bone',
              )}
            >
              {category.name}
              <span className="ml-2 font-mono text-[0.6875rem] opacity-50">
                {category.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <section className="py-16 sm:py-20">
      <div className="shell">
        {index ? (
          <NewsroomSearch index={index}>
            <div className="mt-10">{categoriesNav}</div>
            {articleIndex}
          </NewsroomSearch>
        ) : (
          <>
            {categoriesNav}
            {articleIndex}
          </>
        )}

        <div className="mt-24">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}
