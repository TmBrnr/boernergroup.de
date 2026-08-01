# boernergroup.de

The personal site of Tobias Börner, technology entrepreneur, CEO and investor.

Built as a static Next.js site: no database, no CMS to host, no runtime dependencies
beyond the hosting platform. Every page is prerendered at build time.

---

## Just want to look at it?

Double-click **`Website ansehen.command`** on a Mac or **`Website ansehen.bat`**
on Windows. It starts a small local server on port 4321 and opens the browser.
`npm run serve` does the same thing.

Do not open the HTML files directly. Over `file://` React never starts, so the
entrance animations stay invisible and internal links do nothing. The site looks
broken while being perfectly fine.

## Build

```bash
npm install
cp .env.example .env.local     # optional, see below
npm run dev                    # http://localhost:3000
```

```bash
npm run build && npm start     # Node server, the full feature set
npm run export                 # static folder in out/, for any web host
npm run serve                  # serve out/ locally on port 4321
npm run typecheck              # tsc --noEmit
```

### Two ways to deploy

| | `npm run build` | `npm run export` |
|---|---|---|
| Needs | Node at runtime, or Vercel | Any web host. Upload `out/`. |
| Images | Optimised on demand, AVIF and WebP | Served as committed |
| Contact | Opens the visitor's mail client | Opens the visitor's mail client |
| Redirects | Handled by Next | `_redirects`, `.htaccess` and `vercel.json` are written into `out/` |
| Everything else | Identical | Identical |

Both modes produce the same pages, the same metadata, the same structured data
and the same sitemap. The static export is the safer default for this site,
because nothing on it genuinely needs a server.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router | Static generation, per-route metadata, image optimisation |
| Styling | Tailwind CSS 3 + design tokens in `globals.css` | One warm-neutral dark palette, no component library |
| Motion | Framer Motion | Fade / rise / soft parallax only, all reduced-motion aware |
| Content | MDX + JSON in `/content` | Git-versioned, reviewable, zero hosting cost |
| Type | Inter, Instrument Serif, IBM Plex Mono, **self-hosted** | No Google Fonts request: faster LCP and no GDPR question |

## Project layout

```
content/
  articles/*.mdx        Newsroom articles (frontmatter + body)
  data/*.json           Everything else, all editable without touching code
public/
  brand/                Innoshare logo concepts + production mark
  logos/                Company logos  ← replace placeholders
  media/                Photography    ← replace placeholders
  video/                Hero video     ← replace placeholder
src/
  app/                  Routes, sitemap, robots, feed.xml, llms.txt, OG image
  components/           UI, home sections, newsroom
  lib/                  Content loaders, SEO helpers, schema.org graph
  fonts/                Self-hosted woff2
```

## Routes

| Route | Rendering |
|---|---|
| `/` | Static: assembly hero, the Now/Before ledger, the advisory band, the coda |
| `/about` | Static: bio, through-line, full CV, focus, companies, leadership, FAQ |
| `/innoshare` | Static: the advisory brand, services, track record, engagement models, leadership, enquiry form |
| `/companies`, `/companies/[slug]` | Static (SSG from `companies.json`) |
| `/newsroom`, `/newsroom/[slug]`, `/newsroom/category/[c]`, `/newsroom/page/[n]` | Static (SSG from MDX) |
| `/media`, `/contact` | Static |
| `/impressum`, `/datenschutz`, `/barrierefreiheit` | Static. `/imprint`, `/privacy` and `/accessibility` redirect here permanently. |
| `/sitemap.xml`, `/robots.txt`, `/feed.xml`, `/llms.txt` | Generated at build |
| `/api/og` | On demand: dynamic Open Graph images |
| `/api/contact` | On demand: form relay |

## Environment

Everything works with no environment variables. These only add capability:

| Variable | Effect if unset |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Falls back to `https://boernergroup.de` |
| `CONTACT_RECIPIENT` | Defaults to `mail@boernergroup.de` |
| `CONTACT_FORM_ENDPOINT` | Contact and advisory submissions are logged server-side and the user still gets a success state |
| `NEWSLETTER_FORM_ENDPOINT` | Same, for newsletter signups |

Both endpoints receive a plain JSON `POST`, so any provider works:
Resend, Formspark, Buttondown, Mailchimp, or your own handler.

## Deployment

Any Node host or Vercel. Nothing is platform-specific.
For a German deployment, note that fonts are already self-hosted and no
analytics script is included, so add one deliberately if you want it.

## Before going live

1. Replace the placeholder assets. See `docs/ASSETS.md`.
2. Have `/datenschutz` reviewed by a lawyer once the hosting provider and form backend are chosen, and fill in the two entries in `content/data/legal.json` → `processors`. A phone number in `content/data/innoshare.json` → `registry.phone` is strongly recommended for the Impressum; leave it empty and the row simply does not render.
3. Set `NEXT_PUBLIC_SITE_URL` to the production origin.
5. Add awards to `content/data/awards.json` (currently empty, so the section hides itself).
6. Write Tim Börner's own bio in `content/data/people.json`. The placeholder says so out loud.
7. Decide whether to keep the aperture mark or rework the existing Innoshare constellation logo.

## Editing content

See `docs/CONTENT.md`. Short version: nothing in `src/` needs to change to
add a company, an article, a talk, a press item or a timeline milestone.
