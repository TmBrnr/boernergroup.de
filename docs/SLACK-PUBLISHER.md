# Slack article publisher

Authorised publishers can create, update, and delete newsroom articles in Slack.
Every website change requires a preview and a separate explicit confirmation.
No model response can directly publish, overwrite, or delete content.

## Commands

Tag the bot with an explicit command:

```text
@Boerner Publisher new blog post <brief or complete article>
@Boerner Publisher write an article about <subject and requirements>
@Boerner Publisher update <newsroom URL or article-slug> <changes to make>
@Boerner Publisher aktualisiere <newsroom URL> <changes to make>
@Boerner Publisher delete <newsroom URL or article-slug>
@Boerner Publisher lösche <newsroom URL>
@Boerner Publisher help
```

Briefs and update instructions must contain 20–16,000 characters. Deletion
recognises conversational German requests such as `kannst du … entfernen …`
and the reported `löscge` typo, but still requires an exact article target.
Slack links and `www.boernergroup.de` links are accepted. Foreign sites,
ambiguous targets, missing update instructions, error reports, and ordinary
conversation receive guidance instead of becoming articles.

## Preview and confirmation

1. **Request.** The bot checks the publisher allowlist and queues preparation.
   Creation and update use background OpenAI research and structured drafting.
   Deletion reads the existing article without invoking the model.
2. **Preview.** The bot stores an immutable snapshot in Redis and posts an
   **Open full preview** link with **Publish article**, **Confirm update**, or
   **Confirm deletion**, plus **Cancel**. The full preview contains the article,
   cover, categories, URL, and research sources. No Git commit is made yet.
3. **Decision.** An authorised publisher confirms the exact snapshot in its
   original thread. Opening a preview link never approves anything. Cancelled,
   expired, already-decided, cross-thread, and unauthorised confirmations cannot
   enqueue a new mutation. Repeated clicks queue at most one operation.
4. **Apply.** A durable worker rechecks both requester and approver permissions
   and applies only the approved snapshot. Update and delete compare the current
   article SHA with the reviewed SHA. If the article changed, request a fresh
   preview; confirmation cannot overwrite unseen changes.
5. **Deploy.** The bot reports that the commit is waiting for deployment. It
   checks the production URL every 10 seconds, for up to nine minutes. Publication
   and update require the exact operation marker in the rendered page; deletion
   requires HTTP 404. Only then does it report completion. A timeout reports a
   committed but unverified change, with its recovery-history link.

If buttons are unavailable, tag the bot in the original thread:

```text
@Boerner Publisher preview <review-id>
@Boerner Publisher status <review-id>
@Boerner Publisher confirm <review-id>
@Boerner Publisher cancel <review-id>
```

Previews expire after 24 hours. Links are opaque bearer links: anyone with the
link can read its preview until it expires, but only allowlisted Slack users can
confirm. Pages and images send no-store, no-referrer, and noindex headers, and
preview paths are excluded from robots and the sitemap. Do not forward a private
preview link to someone who should not read the draft. Operation state is kept
in Redis for seven days to support retries and status checks.

To revise a pending draft, cancel it and send a new creation brief. `update`
targets an existing published article. Updates preserve its URL, original date,
and existing editorial flags, set `updated`, and version the cover URL so browsers
do not keep showing an older image. Confirmation applies the previewed bytes
without another model call or image download.

Attach an image to the creation/update message to use it as the cover. Otherwise
the bot renders an abstract illustration chosen for the subject, with distinct
composition, palette, and geometry for each article. These covers are locally
rendered artwork, not AI-generated photographs. Alt text describes the actual
illustration. Research with no sources stops before drafting. Invalid MDX stops
before the review is offered.

## Ownership and configuration

Keep the Slack app, OpenAI project, repository credential, and Redis database in
the website owner's accounts. OpenAI API usage has separate billing from ChatGPT
subscriptions. Reuse the existing integration credentials for this fix; no new
key, scope, or service is required.

Deploy the Node site to the Git-connected Vercel project. Static export supports
the public website but excludes the Slack API and private preview routes.

Required configuration is listed in `.env.example`:

- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`
- `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`
- `REDIS_URL` (or a Marketplace variable ending in `_REDIS_URL`)
- `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, `GITHUB_DEFAULT_BRANCH`
- `SLACK_PUBLISHER_USER_IDS` (comma-separated Slack member IDs)
- `NEXT_PUBLIC_SITE_URL` and optional `PUBLISHER_BOT_NAME`

An empty publisher list denies every command and confirmation. The bot is usable
in any channel where it is installed. It listens only to `app_mention`, without
subscribing to ordinary conversations.

### Slack app

Use `slack-app-manifest.yml`. Required bot scopes remain `app_mentions:read`,
`chat:write`, and `files:read`. Both Event Subscriptions and **Interactivity &
Shortcuts** must point to:

```text
https://boernergroup.de/api/webhooks/slack
```

The existing manifest already enables interactivity. Confirm it is enabled in the
installed app if button clicks do not reach the webhook. Typed confirmation is
available through mentions regardless of the interactivity setting.

### GitHub and deployment

Use a fine-grained token restricted to this repository with Contents read/write.
The production branch must allow the dedicated bot credential to commit. Each
mutation is one atomic, non-force Git commit recording the requester, approver,
and operation ID. Concurrent branch advancement fails safely and retries.

Deletion and update only remove cover files dedicated to that article's slug;
shared editorial assets are retained. Revert the linked commit to recover a
mutation. Legacy automatic deletion jobs are discarded after deployment, and
old drafting jobs can only produce a preview.

Vercel Queues runs bounded, retryable stages; background Responses API jobs are
polled rather than keeping a webhook open. Vercel supplies queue credentials
through its deployment environment. Each function stays within its configured
60-second limit. Do not upload a `VERCEL_OIDC_TOKEN` manually.

## Verification

```bash
npm run test:publisher         # offline regression tests; no external writes
npm run typecheck
npm run lint
npm run build
npm run test:blog -- --fixture # local generation output; no Slack/GitHub calls
npm run export                # public static website, without private routes
```

The publisher regression suite covers the reported English error text, German
delete requests and typos, explicit creation/update commands, permissions,
thread binding, expiry, cancellation, concurrent/repeated confirmations, queue
failure recovery, immutable previews, stale Git snapshots, non-force deletion,
cover variation, preserved update metadata, and live deployment checks.

For a live generation-only test, use `npm run test:blog -- "Write an article
about practical European AI sovereignty"`. It uses the configured OpenAI key
and writes MDX, cover, and research under ignored `.local-previews/`; it never
contacts Slack or GitHub. Do not print or commit `.env.local`.

After deploying, use a real authorised Slack mention to create a draft. Check
that the full preview is readable and the public article URL remains absent
until confirmation. Cancel once, then confirm a fresh draft and check the live
completion reply. Test an update and a deletion the same way with a disposable
article. These checks post messages and change public content, so do them only
with an explicitly designated test article and channel.

## Incident resolution: 28 September 2026

The old handler accepted every sufficiently long mention as an article brief,
only recognised English deletion commands at the beginning of a message, and
announced publication immediately after a Git commit. Its covers shared a fixed
prominent illustration. These behaviours caused the incident in the supplied
Slack transcript.

The fix removes the three accidental articles and their dedicated covers:

- `a-page-not-found-message-isn-t-an-article-brief`
- `ich-kann-den-website-eintrag-nicht-selbst-loschen`
- `ich-kann-den-eintrag-nicht-selbst-entfernen`

The valid Frankfurt AI-sovereignty article is preserved. The initial 404 was a
deployment delay; that article was live when investigated.
