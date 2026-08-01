import type { MetadataRoute } from 'next';

// Generated once at build time so it also lands in the static export.
export const dynamic = 'force-static';

import { getArticles, getCategories, getTotalPages } from '@/lib/articles';
import { COMPANIES, SITE_URL } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/innoshare`, lastModified: now, changeFrequency: 'monthly', priority: 0.95 },
    { url: `${SITE_URL}/companies`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/newsroom`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/media`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${SITE_URL}/impressum`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/datenschutz`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/barrierefreiheit`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const companyRoutes: MetadataRoute.Sitemap = COMPANIES.map((company) => ({
    url: `${SITE_URL}/companies/${company.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = getArticles().map((article) => ({
    url: `${SITE_URL}/newsroom/${article.slug}`,
    lastModified: new Date(article.updated ?? article.date),
    changeFrequency: 'yearly',
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = getCategories().map((category) => ({
    url: `${SITE_URL}/newsroom/category/${category.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const total = getTotalPages();
  const pageRoutes: MetadataRoute.Sitemap = Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({
    url: `${SITE_URL}/newsroom/page/${i + 2}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...companyRoutes, ...articleRoutes, ...categoryRoutes, ...pageRoutes];
}
