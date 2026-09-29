import assert from 'node:assert/strict';
import test from 'node:test';
import type { StateAdapter } from 'chat';
import { conversationStore } from '../src/lib/publishing/conversation-store';
import { coverForOperation, editorMessage, singleWorkspaceAttachment, UPLOADED_IMAGE_TTL_MS } from '../src/lib/publishing/image-context';
import { agentArguments, agentTools } from '../src/lib/publishing/agent-contract';
import { revisionJobSchema, type QueuedImage } from '../src/lib/publishing/agent-schema';

const image: QueuedImage = { type: 'image', name: '1.png', mimeType: 'image/png', url: 'https://files.slack.com/private-image', fetchMetadata: { url: 'https://files.slack.com/private-image', teamId: 'T123' } };
function memoryState() {
  const data = new Map<string, unknown>();
  return { get: async (key: string) => data.get(key) ?? null, set: async (key: string, value: unknown) => { data.set(key, value); } } as unknown as StateAdapter;
}

test('the editor sees the current attachment and earlier upload without private URLs', () => {
  const current = editorMessage('update in dem text bitte das image', image);
  assert.match(current, /"uploadedImageAvailable":true/);
  assert.match(current, /"origin":"this message"/);
  assert.match(current, /1.png/);
  assert.equal(current.includes('files.slack.com'), false);
  const previous = editorMessage('use the picture I attached earlier', undefined, image);
  assert.match(previous, /earlier in this thread from this user/);
  assert.equal(previous.includes('private-image'), false);
  assert.match(editorMessage('generate a new cover from my prompt'), /"uploadedImageAvailable":false/);
});

test('uploaded pictures survive follow-ups but stay scoped to the uploader and thread', async () => {
  const store = conversationStore(memoryState());
  await store.rememberImage('thread', 'user', image);
  assert.deepEqual(await store.recentImage('thread', 'user'), image);
  assert.equal(await store.recentImage('other-thread', 'user'), undefined);
  assert.equal(await store.recentImage('thread', 'another-user'), undefined);
  const replacement = { ...image, name: 'replacement.jpg' };
  await store.rememberImage('thread', 'user', replacement);
  assert.deepEqual(await store.recentImage('thread', 'user'), replacement);
});

test('attachment references expire after 24 hours', async (t) => {
  const now = Date.now();
  t.mock.method(Date, 'now', () => now);
  const store = conversationStore(memoryState());
  await store.rememberImage('thread', 'user', image);
  t.mock.method(Date, 'now', () => now + UPLOADED_IMAGE_TTL_MS + 1);
  assert.equal(await store.recentImage('thread', 'user'), undefined);
});

test('uploads and uploaded-image edits select pixels while generated images use only the prompt', () => {
  const earlier = { ...image, name: 'earlier.png' };
  assert.deepEqual(coverForOperation('upload', 'current', image, earlier), image);
  assert.deepEqual(coverForOperation('upload', 'current', undefined, earlier), earlier);
  assert.deepEqual(coverForOperation('edit', 'upload', undefined, earlier), earlier);
  for (const mode of ['generate', 'abstract', 'keep'] as const) assert.equal(coverForOperation(mode, 'current', image, earlier), undefined);
  assert.equal(coverForOperation('edit', 'current', image, earlier), undefined);
  assert.throws(() => coverForOperation('upload', 'current'), /No uploaded image/);
  assert.throws(() => coverForOperation('edit', 'upload'), /No uploaded image/);
});

test('cover tools remain strict and previously queued edits keep their current-cover source', () => {
  assert.equal(agentArguments.change_cover.parse({ prompt: 'Use the uploaded picture', mode: 'upload' }).mode, 'upload');
  assert.equal(agentArguments.change_cover.parse({ prompt: 'Remove the background', mode: 'edit', source: 'upload' }).source, 'upload');
  assert.throws(() => agentArguments.change_cover.parse({ prompt: 'Modify the picture', mode: 'edit', source: 'other-user' }));
  const tool = agentTools.find((candidate) => candidate.name === 'change_cover')!;
  assert.deepEqual(tool.parameters?.required, ['prompt', 'mode', 'source']);
  const oldJob = revisionJobSchema.parse({ stage: 'revision-start', context: { jobId: 'a'.repeat(32), threadId: 'thread', requestedBy: 'user' }, baseReviewId: 'b'.repeat(32), instructions: 'Edit the current image', research: false, coverMode: 'edit' });
  assert.equal(oldJob.stage === 'revision-start' && oldJob.coverSource, 'current');
});

test('queued Slack downloads use the configured bot token without an OAuth installation lookup', () => {
  const queued = singleWorkspaceAttachment({ ...image, fetchMetadata: { ...image.fetchMetadata, enterpriseId: 'E123', isEnterpriseInstall: 'true' } });
  assert.deepEqual(queued.fetchMetadata, { url: image.url });
  assert.equal(queued.name, image.name);
  assert.equal(queued.url, image.url);
  assert.deepEqual(singleWorkspaceAttachment({ type: 'image' }).fetchMetadata, undefined);
});
