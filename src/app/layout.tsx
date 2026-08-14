import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

import './globals.css';

import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { CursorLight } from '@/components/ui/CursorLight';
import { ScrollProgress } from '@/components/ui/Motion';
import { JsonLd } from '@/components/ui/JsonLd';
import { SITE, SITE_URL } from '@/lib/content';
import {
  graph,
  innoshareSchema,
  organizationSchema,
  personSchema,
  websiteSchema,
} from '@/lib/schema';

/**
 * Two faces only, both self-hosted: Inter for everything structural, IBM Plex
 * Mono for labels and figures. No third-party font request, no GDPR question.
 */
const sans = localFont({
  src: [{ path: '../fonts/inter-variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

const mono = localFont({
  src: [
    { path: '../fonts/ibm-plex-mono-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/ibm-plex-mono-500.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});

const TITLE = `${SITE.name} · Building European Technology Companies`;
const DESCRIPTION =
  'Tobias Börner is a technology entrepreneur, CEO and investor building European companies in AI, defence and public safety. CEO of Civitas Europe, executive at Orcrist Technologies, co-founder of Fastic, former CMO of LOVOO.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s · ${SITE.name}`,
  },
  description: DESCRIPTION,
  applicationName: SITE.domain,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.name,
  keywords: SITE.keywords,
  category: 'technology',
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [{ url: '/feed.xml', title: `${SITE.name} · Newsroom` }],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'profile',
    url: SITE_URL,
    siteName: SITE.domain,
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_GB',
    firstName: 'Tobias',
    lastName: 'Börner',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: {
    icon: [
      { url: '/favicon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#08090B',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/* Page-level metadata replaces `alternates`, so the feed link lives here. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE.name} · Newsroom`}
          href="/feed.xml"
        />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-bone px-5 py-2.5 text-[0.875rem] font-medium text-ink-deep"
        >
          Skip to content
        </a>

        <ScrollProgress />
        <CursorLight />
        <Nav name={SITE.name} nav={SITE.nav} />

        <main id="main" className="relative z-10">
          {children}
        </main>

        <Footer />

        <JsonLd
          id="site-schema"
          json={graph(
            personSchema(),
            organizationSchema(),
            ...innoshareSchema(),
            websiteSchema(),
          )}
        />
      </body>
    </html>
  );
}
