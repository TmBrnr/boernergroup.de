# Slack article publisher

The publisher lets authorised people create and delete newsroom articles without
leaving Slack. There is no pull-request review or separate GitHub approval step.

## What happens when the bot is tagged

For a normal article brief, the bot:

1. researches current sources with OpenAI web search;
2. drafts structured MDX in the site's existing editorial style;
3. validates the generated MDX;
4. prepares an attached cover image or creates a branded cover automatically;
5. commits the article and cover atomically to the production branch; and
6. replies with the article URL and the recovery-history commit.

A Git-connected host such as Vercel then deploys the new commit. There is no
Publish button and no GitHub check to click through.

Deletion is also handled in Slack. An explicit `delete` command removes the MDX
article and its dedicated cover in one atomic commit. It is destructive on the
live site, but recoverable by reverting the linked Git commit.

## Ownership and billing

Create the Slack app, OpenAI project key, GitHub token, and Redis database in the
website owner's accounts. You can perform setup while invited as an admin; do
not ask for or use the owner's password.

ChatGPT Plus, Pro, Business, and Enterprise subscriptions do not include OpenAI
API usage. `OPENAI_API_KEY` belongs to an API project with separate usage billing
and limits.

## 1. Deploy the webhook

Deploy the Node version of the site to Vercel or another Node host. Static export
continues to work for the public pages, but the Slack webhook needs a live route:

```text
https://boernergroup.de/api/webhooks/slack
```

Use Node.js 22 or newer. Provision a serverless-compatible Redis database and
set the variables in `.env.example`. Connect the host to the repository's
production branch so each bot commit triggers a deployment.

### Local environment file

The ignored `.env.local` file in the project root now contains every setting
needed for the local generation test and the deployed bot. Fill values directly
after each `=`. Do not commit this file.

Only these values are needed for a real local generation test:

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-6-luna
OPENAI_REASONING_EFFORT=max
```

Run the offline pipeline smoke test first:

```bash
npm run test:blog -- --fixture
```

Then run a real researched generation after adding the API key:

```bash
npm run test:blog -- "Write an article about practical European AI sovereignty"
```

Both commands write `article.mdx`, `cover.jpg`, and `research.json` under the
ignored `.local-previews/` directory. They never call Slack or GitHub and do not
publish anything.

Once `.env.local` is complete, add the same non-empty values to the linked
Vercel project's Production environment through the dashboard or with
`vercel env add NAME production`. Use Sensitive visibility for API keys, Slack
secrets, Redis URLs, and GitHub tokens. Do not upload `VERCEL_OIDC_TOKEN`; Vercel
manages it automatically. Note that `vercel env pull .env.local` replaces the
local file, so back it up before pulling.

Access is deliberately explicit:

- `SLACK_ALLOWED_CHANNEL_IDS` optionally restricts where commands work.
- `SLACK_PUBLISHER_USER_IDS` is mandatory and controls both publishing and
  deletion.

Use Slack IDs such as `U012ABCDEF` and `C012ABCDEF`, separated by commas. An
empty publisher list denies every content-changing command.

## 2. Create the Slack app

1. Open [Slack API: Your Apps](https://api.slack.com/apps) in the client's
   workspace and choose **Create New App → From an app manifest**.
2. Paste `slack-app-manifest.yml` and create the app.
3. Copy the Signing Secret to `SLACK_SIGNING_SECRET`.
4. Install the app to the workspace and copy the Bot User OAuth Token to
   `SLACK_BOT_TOKEN`.
5. Invite the bot to the allowed channels.

The manifest requests only `app_mentions:read`, `chat:write`, and `files:read`.
It subscribes only to `app_mention`; the bot does not monitor ordinary channel
conversation or automatically subscribe itself to threads.

## 3. Create the GitHub credential

Use a fine-grained personal access token owned by the client or a dedicated
service account. Restrict it to `TmBrnr/boernergroup.de` and grant only:

- Contents: read and write

Set `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, and `GITHUB_DEFAULT_BRANCH`. If `main`
has branch protection, configure it to allow this dedicated credential to push,
or use a dedicated production branch that the host deploys. The token is used
only by deterministic server code and is never sent to OpenAI.

## 4. Create the OpenAI credential

Create a project in the [OpenAI API platform](https://platform.openai.com/) and
store its project API key as `OPENAI_API_KEY`. Configure project spend limits
and keep `OPENAI_MODEL` configurable. The integration uses the Responses API,
structured outputs, image understanding for attached covers, and the hosted web
search tool. OpenAI responses are sent with `store: false`.

## Slack commands

Publish from a brief:

```text
@Boerner Publisher Write a 900-word analysis of the latest EU AI Act compliance
timeline for German mid-market technology companies. Focus on practical
leadership decisions, use primary sources, and avoid legal advice.
```

An optional landscape image attached to the same Slack message becomes the
cover. Without one, the bot creates a text-free abstract cover in the site's
existing dark technical illustration style.

Delete using a slug:

```text
@Boerner Publisher delete sovereign-european-ai
```

Or paste the full article URL:

```text
@Boerner Publisher delete https://boernergroup.de/newsroom/sovereign-european-ai
```

Show the short command reference:

```text
@Boerner Publisher help
```

## Operational safeguards

- Slack request signatures are verified.
- Redis provides webhook deduplication and per-thread locking.
- Only explicitly listed publisher IDs can change content.
- Web content is treated as untrusted source material, not instructions.
- Generated MDX rejects imports, scripts, iframes, event handlers, JavaScript
  URLs, and arbitrary MDX expressions.
- The model has no shell, GitHub token, or general-purpose repository tool.
- Publish refuses to overwrite an existing slug.
- Publish and delete use atomic, non-force Git commits; a concurrent branch
  update fails safely instead of overwriting another change.
- Delete only accepts a normalised newsroom slug and only removes its article
  plus a cover inside `public/media/articles/`.
- Every mutation returns a commit link that can be reverted for recovery.
- Errors are logged server-side and sanitised before being posted to Slack.
