import { getArticles } from '@/lib/articles';
import { SITE, SITE_URL, absoluteUrl } from '@/lib/content';
import { escapeXml } from '@/lib/utils';

export const dynamic = 'force-static';

export function GET() {
  const articles = getArticles();
  const updated = articles[0] ? new Date(articles[0].date).toUTCString() : new Date().toUTCString();

  const items = articles
    .map((article) => {
      const url = absoluteUrl(`/newsroom/${article.slug}`);
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <description>${escapeXml(article.description)}</description>
      <dc:creator>${escapeXml(SITE.name)}</dc:creator>
${article.categories.map((c) => `      <category>${escapeXml(c)}</category>`).join('\n')}
      <enclosure url="${absoluteUrl(article.cover)}" type="image/jpeg" length="0" />
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(`${SITE.name} · Newsroom`)}</title>
    <link>${SITE_URL}/newsroom</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Essays on European technology, sovereign AI, defence and company building.</description>
    <language>en</language>
    <lastBuildDate>${updated}</lastBuildDate>
    <managingEditor>${SITE.email} (${escapeXml(SITE.name)})</managingEditor>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(SITE.name)}</copyright>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
