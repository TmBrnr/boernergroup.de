import assert from 'node:assert/strict';
import test from 'node:test';
import type { StateAdapter } from 'chat';
import { canConfirmSeenPreview, agentArguments, agentTools, isExplicitConfirmation } from '../src/lib/publishing/agent-contract';
import { previewParts } from '../src/lib/publishing/preview-text';
import { conversationStore } from '../src/lib/publishing/conversation-store';
import { reviewStore, decideStoredReview } from '../src/lib/publishing/review-store';

function memoryState() {
  const data = new Map<string, unknown>();
  return { get: async (key: string) => data.get(key) ?? null, set: async (key: string, value: unknown) => { data.set(key, value); }, setIfNotExists: async (key: string, value: unknown) => { if (data.has(key)) return false; data.set(key, value); return true; }, acquireLock: async () => ({ threadId: 'test', token: 'lock', expiresAt: Date.now() + 10000 }), releaseLock: async () => {} } as unknown as StateAdapter;
}

test('natural English and German approval requires a single explicit action', () => {
  for (const phrase of ['okay publish', 'ja veröffentlichen', 'bitte freigeben', '<@BOT> okay publish!', 'confirm update', 'looks good, please publish this version', 'ja, das passt – bitte veröffentlichen', 'kannst du das jetzt veröffentlichen?', 'go live with this version']) assert.ok(isExplicitConfirmation(phrase, 'update'), phrase);
  for (const phrase of ['okay', 'ja', 'make it shorter and publish', 'nicht veröffentlichen', 'okay publish if it looks good', 'can you publish?', 'publish tomorrow', 'ja löschen', 'update the article', 'please publish after changing the image', 'I shouldn\'t publish this', 'publish a new article about AI', 'publish it?', 'fix the typo then publish', 'I would publish this draft', 'Maybe publish it', 'Should we publish?', 'Sollen wir veröffentlichen?', 'Vielleicht veröffentlichen']) assert.equal(isExplicitConfirmation(phrase, 'create'), false, phrase);
  for (const phrase of ['ja löschen', 'bitte den Artikel löschen', 'delete this article', 'remove the article']) assert.ok(isExplicitConfirmation(phrase, 'delete'), phrase);
  for (const phrase of ['lösche den Text', 'can you delete?', 'delete after I approve', 'Löschen?', 'Vielleicht löschen']) assert.equal(isExplicitConfirmation(phrase, 'delete'), false, phrase);
  assert.equal(isExplicitConfirmation('okay publish', 'delete'), false);
});

test('tool arguments are strict while article creation accepts natural briefs', () => {
  assert.equal(agentTools.length, Object.keys(agentArguments).length);
  assert.ok(agentTools.every((tool) => tool.strict));
  assert.throws(() => agentArguments.change_cover.parse({ prompt: 'a Frankfurt skyline', mode: 'delete' }));
  assert.throws(() => agentArguments.confirm_preview.parse({ slug: 'unseen-article' }));
  assert.equal(agentArguments.create_draft.parse({ brief: 'Turn the notes above into a blog post in the same voice.' }).brief.startsWith('Turn'), true);
});

test('conversation retains context, rejects obsolete completion and records cancellation', async () => {
  const store = conversationStore(memoryState());
  await store.save('thread', { history: [], activeReviewId: 'old', busyJobId: 'new' });
  await store.select('thread', 'old');
  assert.equal((await store.get('thread')).busyJobId, 'new');
  await store.select('thread', 'new');
  assert.equal((await store.get('thread')).activeReviewId, 'new');
  assert.equal((await store.get('thread')).busyJobId, undefined);
  await store.select('thread', 'old');
  assert.equal((await store.get('thread')).activeReviewId, 'new');
  await store.cancelTask('work');
  assert.ok(await store.cancelled('work'));
  await store.select('thread', 'work');
  assert.equal((await store.get('thread')).activeReviewId, 'new');
  for (let i = 0; i < 20; i++) await store.append('thread', { role: 'user', content: `request ${i}` });
  assert.equal((await store.get('thread')).history.length, 16);
});

test('editing and superseded snapshots cannot be confirmed', async () => {
  const store = reviewStore(memoryState());
  const review = await store.create({ id: 'a'.repeat(32), threadId: 'thread', requestedBy: 'user', kind: 'create', slug: 'draft', title: 'Draft article', description: 'Description', sources: [] });
  let mutations = 0;
  for (const status of ['editing', 'superseded', 'cancelled'] as const) {
    await store.save({ ...review, status });
    await decideStoredReview(store, { reviewId: review.id, threadId: 'thread', userId: 'user', action: 'confirm' }, () => true, async () => { mutations++; });
  }
  assert.equal(mutations, 0);
  await store.save({ ...review, status: 'superseded' });
  assert.equal(await store.byToken(review.token), null);
});

test('approval cannot target a future preview or a draft being edited', () => {
  const input = { text: 'okay publish', kind: 'create' as const, reviewId: 'new', seenReviewId: 'old', busy: false };
  assert.equal(canConfirmSeenPreview(input), false);
  assert.equal(canConfirmSeenPreview({ ...input, seenReviewId: null }), false);
  assert.equal(canConfirmSeenPreview({ ...input, seenReviewId: 'new', busy: true }), false);
  assert.ok(canConfirmSeenPreview({ ...input, seenReviewId: 'new' }));
});

test('Slack preview includes the full long article without truncation', async () => {
  const body = ('A sufficiently long paragraph. '.repeat(120) + '\n\n').repeat(7);
  const store = reviewStore(memoryState());
  const review = await store.create({ id: 'b'.repeat(32), threadId: 'thread', requestedBy: 'user', kind: 'create', slug: 'draft', title: 'Draft title', description: 'Description', sources: ['https://example.com/source'], draft: { title: 'Draft title', description: 'Description', categories: ['AI'], coverAlt: 'An image of a landscape', body } });
  const parts = previewParts(review);
  assert.ok(parts.length > 1);
  assert.ok(parts.every((part) => part.length <= 2800));
  assert.equal(parts.join(''), `${body}\n\nResearch sources:\nhttps://example.com/source`);
});
