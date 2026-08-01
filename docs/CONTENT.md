# Editing content

No content is hardcoded in components. Everything below lives in `/content`
and is picked up on the next build.

## Add a newsroom article

Create `content/articles/my-slug.mdx`. The filename becomes the URL:
`/newsroom/my-slug`.

```mdx
---
title: The headline, sentence case
description: One or two sentences. Used for search results, OG cards and the index.
date: 2026-08-14
categories: ['Sovereignty', 'Artificial Intelligence']
cover: /media/articles/my-slug.jpg
coverAlt: Plain description of the image for screen readers.
featured: false      # optional, pins it to the top of the newsroom
draft: false         # optional, true hides it everywhere including the sitemap
updated: 2026-09-01  # optional, surfaces as dateModified in schema.org
---

Body in Markdown. Blockquotes render as large serif pull quotes:

> The line you want people to screenshot.

`<Aside>…</Aside>` is available for a boxed side note.
```

Reading time, categories, related articles, RSS, sitemap entries, JSON-LD and
the search index are all derived automatically. Categories create their own
pages at `/newsroom/category/<slugified-name>`. Reuse existing names to group.

## Add or change a company

`content/data/companies.json`. Copy an existing entry.

| Field | Notes |
|---|---|
| `slug` | URL segment. Changing it changes the URL, so add a redirect if it was public. |
| `status` | `current` or `past`, drives the grouping on `/companies` |
| `accent` | `"R G B"` as space-separated numbers. Tints the page header glow only. |
| `logo` | Path in `/public/logos` |
| `cover` | 16:9 image |
| `highlights` | Bullet list in the sidebar |
| `story` | Array of paragraphs, the main body |
| `facts` | Label/value pairs in the "at a glance" table |

New companies appear automatically on the homepage logo wall, `/companies`,
the footer, the sitemap and the schema.org graph.

## Career timeline

`content/data/timeline.json`, ordered oldest → newest. `href` may be `null`
if there is no company page to link to.

Each milestone carries **two** descriptions, deliberately:

- `line`: one short sentence. This is what the scroll-driven homepage shows, and
  it has to work at display size with nothing around it. Keep it under ~12 words.
- `achievement`: the longer version, shown on `/about`.

Adding a milestone lengthens the homepage's scroll runway by one viewport
automatically. Six milestones is comfortable; past eight, consider whether the
homepage still earns the scroll.

## Speaking

`content/data/speaking.json` holds the hero image, intro, topics, formats,
languages and selected talks. Topics render both on `/speaking` and as the
chip row on the homepage.

## Media & awards

`content/data/media.json`. `type` is free text, but `Interview`, `Podcast`,
`TV` and `Article` get their own ordered sections; anything else is grouped
under "Appearances".

`content/data/awards.json`. An empty array hides the section entirely.

## Everything else

| File | Controls |
|---|---|
| `site.json` | Name, roles, hero headline and CTAs, nav, email, social, keywords |
| `story.json` | The eight-step narrative chain and the section headings on `/about` |
| `site.json` → `coda` | The homepage's closing line and its four links |
| `site.json` → `hero.rolesLine` | The single credibility line under the headline |
| `focus.json` | The "current focus" grid |
| `philosophy.json` | The large typographic statements |
| `faq.json` | The homepage FAQ **and** the FAQPage schema **and** `/llms.txt` |

## Future sections

The architecture already supports adding books, a podcast, an investment
portfolio, events or case studies the same way: a JSON file in `content/data`,
a loader export in `src/lib/content.ts`, and a section or route that maps over it.


## Innoshare, the advisory brand

`content/data/innoshare.json` drives the whole `/innoshare` page and the
advisory band on the homepage.

| Field | Controls |
|---|---|
| `positioning`, `lede`, `principle` | The header copy |
| `services[]` | The numbered list on both the homepage and `/innoshare`. Each `id` becomes an anchor, so the homepage links deep into the right service. |
| `record[]` | The four figures. `count: true` makes the number tick up when it scrolls into view; `false` prints it flat. Use that for years. |
| `clients.items[]`, `engagements[]` | The two columns under the services |

Adding a service adds a row to both pages and an `Offer` to the `OfferCatalog`
in the schema. Nothing else to touch.

## People

`content/data/people.json`. Each person renders in the leadership block on
`/innoshare` and `/about`, and, importantly, becomes their own `Person` entity
in the structured data, linked to the other by `sibling`. That is what stops a
search engine or a language model from merging the two brothers into one person.

Set `linkedin` to `null` and the link simply does not render.


## The homepage registers

`content/data/site.json` carries the homepage almost entirely:

| Field | Renders as |
|---|---|
| `hero.claim` | The three words the particle field assembles into. Keep them short and uppercase, because they are sampled at display size. |
| `hero.rolesLine` | The single mono line under the standing copy |
| `intro` | The one sentence beside it |
| `now.items[]` | The **Now** register. Four is the right number; six starts to read like a CV. |
| `before` | The heading and the dated note above the earlier years |
| `coda` | The closing line and its four links |

**Before** is generated, not written: any milestone in `timeline.json` whose
`years` does not contain "present" appears there automatically, newest first.
So closing a chapter is a one-word edit.


## Legal pages

Three pages, all generated from data rather than hardcoded:

| Page | Source |
|---|---|
| `/impressum` | `innoshare.json` → `registry`. Add a managing director by appending to `managingDirectors`. |
| `/datenschutz` | `legal.json` for the supervisory authority, the processors and the list of what the site does not do. The prose lives in the page. |
| `/barrierefreiheit` | `legal.json` → `accessibility`. Fix a listed gap, delete the line. |

`legal.json` → `updated` sets the date shown on both the privacy and the
accessibility page. Change it whenever you change either.

Two things are deliberately unfinished and say so on the page: the two
processor entries, and the phone number. Fill them before launch.
