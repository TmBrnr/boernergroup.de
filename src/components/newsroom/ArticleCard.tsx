import Image from 'next/image';
import Link from 'next/link';

import { ArrowRight } from '@/components/ui/Button';
import { formatDate, slugify } from '@/lib/utils';

export type ArticleCardData = {
  slug: string;
  title: string;
  description: string;
  date: string;
  categories: string[];
  readingTime: number;
  cover: string;
  coverAlt: string;
};

export function ArticleCard({
  article,
  size = 'default',
  priority,
}: {
  article: ArticleCardData;
  size?: 'default' | 'feature';
  priority?: boolean;
}) {
  const feature = size === 'feature';

  return (
    <article className="group h-full">
      <Link href={`/newsroom/${article.slug}`} className="flex h-full flex-col gap-6">
        <div
          className={`relative w-full overflow-hidden rounded-2xl border border-line/[0.08] bg-ink-raised ${
            feature ? 'aspect-[16/9]' : 'aspect-[16/10]'
          }`}
        >
          <Image
            src={article.cover}
            alt={article.coverAlt}
            fill
            priority={priority}
            sizes={feature ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 640px) 100vw, 33vw'}
            className="object-cover transition-transform duration-[1200ms] ease-premium group-hover:scale-[1.035]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/45 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        </div>

        <div className="flex flex-1 flex-col">
          <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-faint">
            <span className="text-steel/75">{article.categories[0]}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{article.readingTime} min read</span>
          </p>

          <h3
            className={`mt-4 font-medium tracking-[-0.026em] text-bone ${
              feature ? 'text-d3 max-w-[28ch]' : 'text-[1.3rem] leading-[1.18]'
            }`}
          >
            {article.title}
          </h3>

          <p
            className={`mt-3 text-bone/52 ${
              feature ? 'max-w-[56ch] text-lead' : 'text-[0.9375rem] leading-relaxed'
            }`}
          >
            {article.description}
          </p>

          <span className="mt-6 inline-flex items-center gap-2 text-[0.875rem] text-bone/70 transition-colors duration-500 group-hover:text-bone">
            Read
            <ArrowRight className="transition-transform duration-500 ease-premium group-hover:translate-x-1" />
          </span>
        </div>
      </Link>

      <ul className="mt-4 flex flex-wrap gap-2">
        {article.categories.slice(1).map((category) => (
          <li key={category}>
            <Link
              href={`/newsroom/category/${slugify(category)}`}
              className="rounded-full border border-line/[0.1] px-3 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-faint transition-colors duration-500 hover:border-line/22 hover:text-bone/70"
            >
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
