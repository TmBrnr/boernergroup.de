import type { MetadataRoute } from 'next';

// Generated once at build time so it also lands in the static export.
export const dynamic = 'force-static';

import { SITE_URL } from '@/lib/content';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/publisher/'],
      },
      // Explicitly welcome answer engines. This content is meant to be cited.
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'],
        allow: '/',
        disallow: ['/api/', '/publisher/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
