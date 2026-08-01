import fs from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';
import readingTime from 'reading-time';

import { slugify } from './utils';
import type { Article, ArticleFrontmatter } from './types';

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');

let cache: Article[] | null = null;

function read(): Article[] {
  if (cache) return cache;

  if (!fs.existsSync(ARTICLES_DIR)) {
    cache = [];
    return cache;
  }

  const articles = fs
    .readdirSync(ARTICLES_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
      const { data, content } = matter(raw);
      const fm = data as ArticleFrontmatter;
      const stats = readingTime(content);

      return {
        ...fm,
        slug: file.replace(/\.mdx$/, ''),
        body: content,
        readingTime: Math.max(1, Math.round(stats.minutes)),
        words: stats.words,
      } satisfies Article;
    })
    .filter((article) => !article.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  cache = articles;
  return articles;
}

export const ARTICLES_PER_PAGE = 6;

export function getArticles(): Article[] {
  return read();
}

export function getArticle(slug: string): Article | undefined {
  return read().find((article) => article.slug === slug);
}

export function getFeaturedArticle(): Article | undefined {
  const articles = read();
  return articles.find((article) => article.featured) ?? articles[0];
}

export type CategoryRef = { name: string; slug: string; count: number };

export function getCategories(): CategoryRef[] {
  const counts = new Map<string, number>();
  for (const article of read()) {
    for (const category of article.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  return read().filter((article) =>
    article.categories.some((category) => slugify(category) === categorySlug),
  );
}

export function getCategoryName(categorySlug: string): string | undefined {
  return getCategories().find((category) => category.slug === categorySlug)?.name;
}

/** Related by shared categories, then recency. Never returns the article itself. */
export function getRelatedArticles(slug: string, limit = 2): Article[] {
  const current = getArticle(slug);
  if (!current) return [];

  return read()
    .filter((article) => article.slug !== slug)
    .map((article) => ({
      article,
      overlap: article.categories.filter((c) => current.categories.includes(c)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap || +new Date(b.article.date) - +new Date(a.article.date))
    .slice(0, limit)
    .map((entry) => entry.article);
}

export function getTotalPages(): number {
  return Math.max(1, Math.ceil(read().length / ARTICLES_PER_PAGE));
}

export function getArticlesPage(page: number): Article[] {
  const start = (page - 1) * ARTICLES_PER_PAGE;
  return read().slice(start, start + ARTICLES_PER_PAGE);
}

/** Lightweight payload for the client-side search index. */
export type SearchEntry = {
  slug: string;
  title: string;
  description: string;
  date: string;
  categories: string[];
  readingTime: number;
  cover: string;
  coverAlt: string;
  haystack: string;
};

export function getSearchIndex(): SearchEntry[] {
  return read().map((article) => ({
    slug: article.slug,
    title: article.title,
    description: article.description,
    date: article.date,
    categories: article.categories,
    readingTime: article.readingTime,
    cover: article.cover,
    coverAlt: article.coverAlt,
    haystack: [article.title, article.description, article.categories.join(' '), article.body]
      .join(' ')
      .toLowerCase()
      .slice(0, 4000),
  }));
}
