# SEO and GEO

## What is already in place

**Semantic structure.** One `<h1>` per page, ordered `h2`/`h3` below it, real
`<article>` / `<section>` / `<nav>` / `<aside>` landmarks, breadcrumbs on every
subpage, alt text on every image sourced from the content files.

**Metadata.** Per-route title, description, keywords and canonical URL via
`src/lib/seo.ts`. Open Graph and Twitter cards everywhere. Article routes emit
`publishedTime` and `modifiedTime`. `robots` directives include
`max-image-preview: large` so image results render full-size.

**Preview images.** `/api/og` renders a 1200×630 card on demand from the page
title, using the Innoshare mark and the site palette. Articles override it with
their cover image.

**Structured data.** A single `@graph` per page so entities cross-reference by
`@id` instead of repeating themselves:

| Node | Where | `@id` |
|---|---|---|
| `Person` | Every page, from the root layout | `/#person` |
| `Organization` | Every page | `/#organization` |
| `WebSite` + `SearchAction` | Every page | `/#website` |
| `FAQPage` | Homepage | |
| `BlogPosting` | Article pages, `author`/`publisher` → `/#person` | `/newsroom/<slug>#article` |
| `Blog` | Newsroom index | `/newsroom#blog` |
| `Organization` + `OrganizationRole` | Company pages | |
| `Service` | Speaking page | |
| `BreadcrumbList` | Every subpage | |

**Crawl surface.** `sitemap.xml` generated from the actual content (21 URLs at
last build), `robots.txt`, `feed.xml`, canonical URLs, `rel=prev`/`rel=next` on
pagination.

**Performance.** Static prerendering for all 32 routes. Self-hosted fonts with
`display: swap` and matched fallback metrics, so no layout shift and no
third-party connection. AVIF/WebP image optimisation with explicit `sizes` on
every image. The video hero is `preload="metadata"` behind a poster, so it never
competes with LCP. ~102 kB shared JS.

## GEO: being citable by answer engines

Ranking in a search index and being quoted by a model are different problems.
The second one rewards unambiguous entities and machine-readable facts.

**`/llms.txt`** is a plain-text canonical brief: who the entity is, current
roles, every company with its URL and description, speaking topics, every
article with its URL, and the full FAQ. One fetch, no HTML parsing, no
JavaScript. Generated from the same JSON the site renders, so it can never drift.

**`robots.txt` explicitly welcomes** GPTBot, OAI-SearchBot, ChatGPT-User,
ClaudeBot, Claude-Web, PerplexityBot, Google-Extended and Applebot-Extended.
This content exists to be cited; blocking the crawlers would be
self-defeating. Remove any agent from that list to opt out.

**Entity disambiguation.** "Tobias Börner" is not a globally unique string, so
the `Person` node carries `sameAs` (LinkedIn, Civitas Europe, Orcrist, Fastic),
`alternateName` for the ASCII spelling "Tobias Boerner", `knowsAbout`,
`knowsLanguage`, `nationality`, `address`, `worksFor` and `alumniOf`. Those are
the properties a knowledge graph uses to decide you are one person and not three.

**Answer-shaped content.** The FAQ is written as complete, self-contained
answers. Each one makes sense lifted out of the page, which is exactly how a
model will quote it. It renders as a `<dl>`, as `FAQPage` JSON-LD, and as text
in `/llms.txt`.

**Author anchoring.** Every article ends with an author block that names the
roles and links back to `/companies`, and the JSON-LD points `author` at the
same `@id` as the sitewide `Person`. Model and crawler both resolve one entity.

## Where to add tracking

None is included. Add it deliberately:

- Vercel Analytics or Plausible: script in `src/app/layout.tsx`
- Google Search Console: `metadata.verification` in the same file
- Update `/privacy` if you add anything that sets a cookie

## Worth doing next

1. Submit `sitemap.xml` to Search Console and Bing Webmaster Tools.
2. Get the LinkedIn profile linking back to `boernergroup.de`. `sameAs` is far stronger when it resolves in both directions.
3. Publish steadily. Three articles establish the entity; a dozen make it citable.
4. Add real conference names and dates to `speaking.json`. Named events are strong entity signals and currently read `"Conference name"`.
