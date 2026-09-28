# Slack article publisher

Authorised publishers can create, update, and delete newsroom articles in Slack.
Every website change requires a preview and a separate explicit confirmation.
No model response can directly publish, overwrite, or delete content.

## Conversational editor

Mention the bot in a Slack thread, then keep mentioning it in that same thread
for follow-ups. The installed Slack app receives `app_mention` events; ordinary
unmentioned replies are not delivered. English and German requests work:

```text
@Boerner Publisher new blog post <brief or complete article>
@Boerner Publisher make the introduction shorter
@Boerner Publisher ändere die Überschrift und mache den Ton sachlicher
@Boerner Publisher generate a cover showing the Frankfurt skyline
@Boerner Publisher remove the text from the current cover
@Boerner Publisher use the attached image as the cover
@Boerner Publisher update <newsroom URL> <requested changes>
@Boerner Publisher lösche <newsroom URL>
@Boerner Publisher okay publish
@Boerner Publisher ja veröffentlichen
@Boerner Publisher abbrechen
```

The agent has strictly validated functions to list/read live articles, read the
current draft, create/revise drafts, generate/edit/upload covers, prepare live
updates/deletion, show previews, confirm, and cancel. It has no direct repository
write function. Briefs, article text, and sources are untrusted data. Error
reports and management requests cannot pass the separate new-article intent gate.
Ambiguous article targets require clarification.

## Slack preview and confirmation

1. The agent prepares an immutable draft in Redis. It posts **all article text**
   in Slack, split into messages when needed, plus categories, sources, the cover,
   and confirmation/cancellation controls. There is no website draft page or
   draft content commit. An expiring opaque image endpoint supplies the inline
   Slack cover; the article itself stays in Redis and Slack.
2. Ask for wording, title, structure, factual, or cover changes in the same
   thread. Text revisions preserve the cover; cover revisions preserve the text.
   New factual additions use research. Covers can be newly generated, edited,
   uploaded, or rendered as abstract editorial artwork. Each revision gets a
   fresh review ID and preview. Old approval controls become invalid as soon as
   editing starts. Failed edits retain the previous draft for another attempt.
3. Confirm the **latest** preview with its button, `okay publish`, or
   `ja veröffentlichen`. A separate explicit message after the preview is needed.
   A request such as “make it shorter and publish” cannot approve the resulting
   unseen revision. Conditional approvals and a plain “okay” are not sufficient.
   Deletion needs explicit deletion approval, such as `ja löschen`, rather than
   publication approval. `confirm <review-id>` remains supported.
4. Cancel stops pending draft work and invalidates its approval. It does not
   undo an already approved or committed website change. `preview <review-id>`
   repeats the Slack preview; `status <review-id>` reports operation status.
5. Only the final approved article and cover are committed, together in **one
   commit**. Updates preserve URL, publication date and editorial flags. Updates
   and deletion check the reviewed article SHA to prevent overwriting an unseen
   change. All permissions are rechecked by the worker. Repeated confirmation
   applies at most one mutation. The bot checks the deployed website before
   claiming that the final change is live.

Previews expire after 24 hours. Operation and conversation state expires after
seven days; temporary agent/revision state after 24 hours. Cancellation and
superseding a review invalidate its image URL. Slack may retain its own messages
and cached images under the workspace retention policy. Removing a live article
also removes its dedicated cover; recovery remains possible through Git history.

Draft preparation uses durable background Responses API jobs and a bounded
function-calling loop. Image changes use the Responses image-generation tool and
an accessible caption describing the generated image. Default initial covers
remain locally rendered editorial artwork unless a different image is requested.
Research without sources or invalid MDX stops before a review is offered.

## Ownership and configuration

Keep the Slack app, OpenAI project, repository credential, and Redis database in
the website owner's accounts. OpenAI API usage has separate billing from ChatGPT
subscriptions. Reuse the existing integration credentials for this fix; no new
key, scope, or service is required. Image generation adds OpenAI API usage.
`OPENAI_IMAGE_MODEL` optionally overrides the image-generation model
(default `gpt-image-2.5-sunburst`).

Deploy the Node site to the Git-connected Vercel project. Static export supports
the public website but excludes the Slack API and inline cover endpoint.

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
npm run test:publisher-agent   # focused conversational editor and approval checks
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
