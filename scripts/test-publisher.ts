import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import type { StateAdapter, Lock } from 'chat';
import sharp from 'sharp';

import { parsePublisherCommand } from '../src/lib/publishing/commands';
import { decideStoredReview, reviewStore, type Review } from '../src/lib/publishing/review-store';
import { createGeneratedCover, generatedCoverAlt, prepareArticle, type ArticleDraft } from '../src/lib/publishing/article';
import { parseFrontmatter, stringifyFrontmatter } from '../src/lib/frontmatter';
import { isChangeLive } from '../src/lib/publishing/deployment';
import { deleteArticle, publishArticle } from '../src/lib/publishing/github';
import type { PublishingConfig } from '../src/lib/publishing/config';

const SITE = 'https://boernergroup.de';
const ID = 'a'.repeat(32);
const SLUG = 'a-page-not-found-message-isn-t-an-article-brief';
const URL = `${SITE}/newsroom/${SLUG}`;
const draft: ArticleDraft = {
  title: 'Sovereignty needs a credible exit plan',
  description: 'A practical examination of who controls AI systems and how organisations can preserve the ability to switch providers.',
  categories: ['Sovereignty', 'Europe'],
  coverAlt: 'An abstract illustration of connected boundaries.',
  body: ('Procurement should test portability and operating control before the contract is signed.\n\n').repeat(10),
};

function memoryState(): StateAdapter {
  const values = new Map<string, { value: unknown; expires: number }>();
  const locks = new Map<string, Lock>();
  const state = {
    async get<T>(key: string): Promise<T | null> {
      const value = values.get(key);
      return value && value.expires > Date.now() ? structuredClone(value.value) as T : null;
    },
    async set(key: string, value: unknown, ttl = Infinity) { values.set(key, { value: structuredClone(value), expires: Date.now() + ttl }); },
    async setIfNotExists(key: string, value: unknown, ttl?: number) {
      if (await state.get(key)) return false;
      await state.set(key, value, ttl); return true;
    },
    async acquireLock(threadId: string, ttl: number) {
      if (locks.has(threadId)) return null;
      const lock = { threadId, expiresAt: Date.now() + ttl, token: randomUUID() };
      locks.set(threadId, lock); return lock;
    },
    async releaseLock(lock: Lock) { if (locks.get(lock.threadId)?.token === lock.token) locks.delete(lock.threadId); },
  };
  return state as unknown as StateAdapter;
}
async function fixtureReview(kind: Review['kind'] = 'create') {
  const store = reviewStore(memoryState());
  const review = await store.create({ id: ID, kind, threadId: 'slack:C123:1', requestedBy: 'U123', title: draft.title, description: draft.description, slug: SLUG, sources: [SITE], draft });
  return { store, review };
}

for (const text of [
  'This page does not exist.The link may be old, or the page may have moved. Everything is reachable from the start.',
  'löscge das wueder',
  'The article link is broken, can you look into it?',
  'und gut wäre ggf. freigabe ?',
  'I cannot remove the article myself',
  'new blog post This page does not exist.The link may be old.',
]) {
  test(`non-brief cannot generate: ${text.slice(0, 45)}`, () => assert.equal(parsePublisherCommand(text, SITE).kind, 'clarify'));
}
for (const text of [
  `lösche denb artikel wieder -${URL}`,
  `kannst du nicht einen entfernen der quatsch ist ? ${URL}`,
  `delete ${SLUG}`, `remove article ${SLUG}`, `lösche <${URL}|article>`,
  `delete [article](${URL})`,
]) {
  test(`management intent: ${text.slice(0, 45)}`, () => assert.deepEqual(parsePublisherCommand(text, SITE), { kind: 'delete', slug: SLUG }));
}
test('foreign hosts and invalid article targets require clarification', () => {
  for (const text of ['delete https://evil.example/newsroom/example-post', `delete ${SITE}/newsroom`, 'delete ../../package.json', `delete ${URL} ${SITE}/newsroom/other-post`]) {
    assert.equal(parsePublisherCommand(text, SITE).kind, 'clarify');
  }
});
test('explicit creation and update preserve instructions', () => {
  assert.equal(parsePublisherCommand(`new blog post\n${draft.body}`, SITE).kind, 'create');
  assert.equal(parsePublisherCommand('Write a 900-word analysis of European technology procurement decisions.', SITE).kind, 'create');
  assert.deepEqual(parsePublisherCommand(`aktualisiere ${URL} - Add a clearer explanation of model portability.`, SITE), { kind: 'update', slug: SLUG, request: 'Add a clearer explanation of model portability.' });
  assert.equal(parsePublisherCommand(`update ${URL}`, SITE).kind, 'clarify');
  assert.equal(parsePublisherCommand(`update ${URL} Remove the weak paragraph and cite https://example.com/source`, SITE).kind, 'update');
  assert.equal(parsePublisherCommand('new blog post Why organisations should remove barriers to AI portability.', SITE).kind, 'create');
  assert.equal(parsePublisherCommand(`update existing-post Remove outdated claims and cite https://example.com/source`, SITE).kind, 'update');
});
for (const kind of ['create', 'update', 'delete'] as const) {
  test(`${kind} requires one authorised confirmation in the original thread`, async () => {
    const { store, review } = await fixtureReview(kind);
    let queued = 0;
    const enqueue = async (approved: Review) => { assert.equal(approved.status, 'approved'); queued++; };
    const input = { reviewId: review.id, threadId: review.threadId, userId: 'U123', action: 'confirm' as const };
    await decideStoredReview(store, { ...input, userId: 'U999' }, (id) => id === 'U123', enqueue);
    await decideStoredReview(store, { ...input, threadId: 'slack:C999:2' }, () => true, enqueue);
    assert.equal(queued, 0);
    await decideStoredReview(store, input, () => true, enqueue);
    await decideStoredReview(store, input, () => true, enqueue);
    assert.equal(queued, 1);
    assert.equal((await store.get(review.id))?.approvedBy, 'U123');
  });
}
test('expired, cancelled, and forged previews cannot be confirmed', async () => {
  const { store, review } = await fixtureReview();
  let queued = 0;
  const enqueue = async () => { queued++; };
  const input = { reviewId: ID, threadId: review.threadId, userId: 'U123', action: 'confirm' as const };
  assert.equal(await store.byToken('b'.repeat(64)), null);
  assert.equal((await store.byToken(review.token))?.id, ID);
  await store.save({ ...review, expiresAt: Date.now() - 1 });
  await decideStoredReview(store, input, () => true, enqueue);
  assert.equal(await store.byToken(review.token), null);
  await store.save(review);
  await decideStoredReview(store, { ...input, action: 'cancel' }, () => true, enqueue);
  await decideStoredReview(store, input, () => true, enqueue);
  assert.equal(queued, 0);
  assert.equal(await store.byToken(review.token), null);
});
test('simultaneous confirmation clicks enqueue only once', async () => {
  const { store, review } = await fixtureReview();
  let queued = 0;
  const decide = () => decideStoredReview(store, { reviewId: ID, threadId: review.threadId, userId: 'U123', action: 'confirm' }, () => true, async () => { queued++; });
  await Promise.allSettled([decide(), decide()]);
  assert.equal(queued, 1);
});
test('ambiguous queue send keeps approval intact and supports safe redispatch', async () => {
  const { store, review } = await fixtureReview();
  const input = { reviewId: ID, threadId: review.threadId, userId: 'U123', action: 'confirm' as const };
  const reply = await decideStoredReview(store, input, () => true, async () => { throw new Error('Queue acknowledgement unavailable'); });
  assert.ok(reply.includes('not acknowledged'));
  assert.equal((await store.get(ID))?.status, 'approved');
  let retries = 0;
  await decideStoredReview(store, input, () => true, async () => { retries++; });
  await decideStoredReview(store, input, () => true, async () => { retries++; });
  assert.equal(retries, 1);
  assert.equal((await store.get(ID))?.dispatched, true);
});
test('queue retries preserve the exact draft and preview token', async () => {
  const { store, review } = await fixtureReview();
  const second = await store.create({ ...review, title: 'A completely different title', draft: { ...draft, body: 'different' } });
  assert.equal(second.token, review.token);
  assert.deepEqual(second.draft, review.draft);
});
test('updates keep URL, publication date, and flags, while versioning the cover', () => {
  const raw = stringifyFrontmatter(draft.body, { title: 'Old title', date: '2025-01-02', featured: true, cover: '/media/old.jpg' });
  const prepared = prepareArticle(draft, { slug: 'original-article', originalRaw: raw, operationId: ID });
  const { data } = parseFrontmatter(prepared.mdx);
  assert.equal(prepared.slug, 'original-article');
  assert.equal(data.date, '2025-01-02');
  assert.equal(data.featured, true);
  assert.equal(data.publisherOperation, ID);
  assert.equal(data.cover, '/media/articles/original-article-aaaaaaaa.jpg');
  assert.throws(() => prepareArticle({ ...draft, body: '<script>bad</script>' + draft.body }), /unsafe MDX/);
});
test('different topics and same-theme titles produce distinct covers', async () => {
  const articles = [draft, { ...draft, title: 'AI systems need careful evaluation', categories: ['Artificial Intelligence'] }, { ...draft, title: 'Building sustainable business operations', categories: ['Company building'] }, { ...draft, title: 'European sovereignty starts with portable infrastructure' }];
  const covers = await Promise.all(articles.map(createGeneratedCover));
  for (let i = 0; i < covers.length; i++) {
    const metadata = await sharp(covers[i].bytes).metadata();
    assert.equal(metadata.width, 1600); assert.equal(metadata.height, 900);
    for (let j = i + 1; j < covers.length; j++) assert.ok(!covers[i].bytes.equals(covers[j].bytes));
  }
  assert.ok(generatedCoverAlt(draft).includes('boundaries'));
  assert.ok((await createGeneratedCover(draft)).bytes.equals(covers[0].bytes));
});

const config: PublishingConfig = { siteUrl: SITE, githubOwner: 'owner', githubRepo: 'repo', githubDefaultBranch: 'main', githubToken: 'fixture-only', openAiApiKey: '', openAiModel: '', openAiReasoningEffort: 'high', slackBotToken: '', slackSigningSecret: '', redisUrl: '', botName: '', publisherUserIds: new Set(['U123']) };
const contentFile = (sha: string, cover = `/media/articles/${SLUG}.jpg`) => ({ type: 'file', encoding: 'base64', sha, content: Buffer.from(stringifyFrontmatter(draft.body, { title: draft.title, cover })).toString('base64') });

test('GitHub rejects a stale delete preview without changing the branch', async () => {
  const realFetch = globalThis.fetch;
  const mutations: string[] = [];
  globalThis.fetch = async (_url, init) => {
    if (init?.method) mutations.push(init.method);
    return Response.json(contentFile('changed-sha'));
  };
  try { await assert.rejects(() => deleteArticle({ slug: SLUG, originalSha: 'preview-sha', requestedBy: 'U123', config }), /changed since this preview/); assert.equal(mutations.length, 0); }
  finally { globalThis.fetch = realFetch; }
});
test('GitHub checks the immutable parent snapshot to prevent a concurrent overwrite', async () => {
  const realFetch = globalThis.fetch;
  const mutations: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (init?.method) { mutations.push(url); return Response.json({ sha: 'new-blob' }); }
    if (url.includes('/git/ref/')) return Response.json({ object: { sha: 'new-parent' } });
    if (url.includes('/contents/content/articles/')) return Response.json(contentFile(url.includes('ref=new-parent') ? 'changed-sha' : 'preview-sha'));
    return Response.json({ message: 'Not found' }, { status: 404 });
  };
  const cover = await createGeneratedCover(draft);
  try {
    await assert.rejects(() => publishArticle({ article: prepareArticle(draft, { slug: SLUG, originalRaw: stringifyFrontmatter(draft.body, { date: '2025-01-02' }), operationId: ID }), cover, originalSha: 'preview-sha', requestedBy: 'U123', config }), /changed since this preview/);
    assert.ok(mutations.every((url) => url.endsWith('/git/blobs')));
  } finally { globalThis.fetch = realFetch; }
});
test('deletion removes only its own cover in one non-force commit', async () => {
  for (const shared of [false, true]) {
    const realFetch = globalThis.fetch;
    let changes: { path: string; sha: string | null }[] = [];
    let force: boolean | undefined;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.includes('/contents/content/articles/')) return Response.json(contentFile('preview-sha', shared ? '/media/articles/another-article.jpg' : undefined));
      if (url.includes('/contents/public/media/')) return Response.json(contentFile('cover-sha'));
      if (url.includes('/git/ref/')) return Response.json({ object: { sha: 'parent-sha' } });
      if (url.endsWith('/git/trees')) { changes = JSON.parse(String(init?.body)).tree; return Response.json({ sha: 'tree-sha' }); }
      if (url.endsWith('/git/commits')) return Response.json({ sha: 'commit-sha', html_url: 'https://github.com/commit' });
      if (url.includes('/git/refs/')) { force = JSON.parse(String(init?.body)).force; return Response.json({ object: { sha: 'commit-sha' } }); }
      return Response.json({ sha: 'parent-sha', tree: { sha: 'base-tree' } });
    };
    try {
      await deleteArticle({ slug: SLUG, originalSha: 'preview-sha', requestedBy: 'U123', config });
      assert.equal(force, false);
      assert.equal(changes.length, shared ? 1 : 2);
      assert.ok(changes.every((change) => change.sha === null));
    } finally { globalThis.fetch = realFetch; }
  }
});
test('commit retry uses the operation marker without a duplicate mutation', async () => {
  const realFetch = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async (_input, init) => { assert.ok(!init?.method); count++; return Response.json([{ html_url: 'https://github.com/commit', commit: { message: `Publisher operation: ${ID}` } }]); };
  try {
    await deleteArticle({ slug: SLUG, originalSha: 'old-sha', requestedBy: 'U123', operationId: ID, config });
    assert.equal(count, 1);
  } finally { globalThis.fetch = realFetch; }
});
test('live publication requires the exact operation marker, deletion requires 404', async () => {
  const { review } = await fixtureReview();
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('Old deployment', { status: 200 });
    assert.equal(await isChangeLive(review, SITE), false);
    globalThis.fetch = async () => new Response(`<meta name="publisher-operation" content="${ID}"/>`);
    assert.equal(await isChangeLive(review, SITE), true);
    assert.equal(await isChangeLive({ ...review, kind: 'delete' }, SITE), false);
    globalThis.fetch = async () => new Response('Unavailable', { status: 500 });
    assert.equal(await isChangeLive({ ...review, kind: 'delete' }, SITE), false);
    globalThis.fetch = async () => new Response('Not found', { status: 404 });
    assert.equal(await isChangeLive({ ...review, kind: 'delete' }, SITE), true);
  } finally { globalThis.fetch = realFetch; }
});
