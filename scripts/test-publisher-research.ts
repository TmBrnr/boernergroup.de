import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeResearchContext, parseResearchResult } from '../src/lib/publishing/research-result';
import { agentArguments, agentTools, hasCreationIntent } from '../src/lib/publishing/agent-contract';
import { pollResearchTopic, startResearchTopic, startDraftArticle } from '../src/lib/publishing/openai';

test('missing search action preserves valid message citations', () => {
  const result = parseResearchResult({ output_text: 'Research brief', output: [
    { type: 'web_search_call', status: 'completed' },
    { type: 'message', content: [{ type: 'output_text', annotations: [{ type: 'url_citation', url: 'https://example.com/source' }] }] },
  ] });
  assert.deepEqual(result, { brief: 'Research brief', sources: ['https://example.com/source'] });
});

test('partial or malformed tool metadata does not crash or invent sources', () => {
  for (const action of [undefined, null, {}, { type: 'search', sources: [null, {}, { url: null }, { url: 'javascript:alert(1)' }] }]) {
    assert.deepEqual(parseResearchResult({ output: [null, { type: 'web_search_call', action }, { type: 'message', content: [null, { type: 'output_text' }] }] }).sources, []);
  }
  assert.deepEqual(parseResearchResult({}), { brief: '', sources: [] });
});

test('source collection combines searches, opened pages and citations with validation and deduplication', () => {
  const result = parseResearchResult({ output_text: 'Brief', output: [
    { type: 'web_search_call', action: { type: 'search', sources: [{ url: 'https://example.com/search' }, { url: 'bad-url' }] } },
    { type: 'web_search_call', action: { type: 'open_page', url: 'https://example.com/page' } },
    { type: 'message', content: [{ type: 'output_text', annotations: [null, { type: 'url_citation', url: 'https://example.com/search' }, { type: 'url_citation', url: 'file:///private/file' }] }] },
  ] });
  assert.deepEqual(result.sources, ['https://example.com/search', 'https://example.com/page']);
});

test('reported German blog instructions are recognised while errors and management requests remain excluded', () => {
  for (const request of ['release das im blog und formatiere das nice!', 'Ja, als Blogartikel vorbereiten.', 'Erstelelle neuen Artikel im Blog anlegen und dafür eine formatierte Vorschau erstellen!']) assert.ok(hasCreationIntent(request), request);
  for (const request of ['This page does not exist', 'lösche den Artikel wieder', 'und machst du was?', 'ändere das Bild', 'okay publish']) assert.equal(hasCreationIntent(request), false, request);
});


test('absent and partial research context is usable without fabricated sources', () => {
  for (const value of [undefined, null, false, {}]) assert.deepEqual(normalizeResearchContext(value), { brief: '', sources: [] });
  assert.deepEqual(normalizeResearchContext({ brief: 'Partial background', sources: [null, 'invalid', 'https://example.com/context'] }), { brief: 'Partial background', sources: ['https://example.com/context'] });
  assert.deepEqual(parseResearchResult({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'A partial brief' }] }] }), { brief: 'A partial brief', sources: [] });
});

test('new draft tools allow research to be skipped and accept previous queued arguments', () => {
  const brief = 'Format the article text supplied by the user into a draft.';
  assert.equal(agentArguments.create_draft.parse({ brief, research: false }).research, false);
  assert.equal(agentArguments.create_draft.parse({ brief }).brief, brief);
  const tool = agentTools.find((tool) => tool.name === 'create_draft')!;
  assert.deepEqual(tool.parameters?.required, ['brief', 'research']);
});

const config = { openAiApiKey: 'test-key-not-real', openAiModel: 'test-model', openAiReasoningEffort: 'low' as const };
const response = (status: string, text = '') => ({ id: 'resp_test', object: 'response', status, output: text ? [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text, annotations: [] }] }] : [] });

test('research poll continues with empty or partial results and stops waiting at its deadline', async (t) => {
  let payload = response('completed');
  t.mock.method(globalThis, 'fetch', async () => Response.json(payload));
  assert.deepEqual(await pollResearchTopic('resp_test', config), { brief: '', sources: [] });
  for (const status of ['incomplete', 'failed', 'cancelled']) {
    payload = response(status, 'Available partial context');
    assert.deepEqual(await pollResearchTopic('resp_test', config), { brief: 'Available partial context', sources: [] });
  }
  payload = response('in_progress', 'Context so far');
  assert.equal(await pollResearchTopic('resp_test', config), null);
  assert.deepEqual(await pollResearchTopic('resp_test', config, true), { brief: 'Context so far', sources: [] });
});

test('research service errors fall back instead of failing the draft', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: { message: 'Research unavailable' } }, { status: 400 }));
  t.mock.method(console, 'warn', () => {});
  assert.equal(await startResearchTopic('A supplied article', config, 'test'), null);
  assert.deepEqual(await pollResearchTopic('resp_missing', config), { brief: '', sources: [] });
});

test('draft generation is requested without research and treats it as optional context', async (t) => {
  let request: Record<string, unknown> | undefined;
  t.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    request = JSON.parse(options.body as string);
    return Response.json(response('queued'));
  });
  const result = await startDraftArticle({ request: 'Format my original article preserving its wording and first-person voice.', config, idempotencyKey: 'test-no-research' });
  assert.equal(result.status, 'queued');
  assert.match(String(request?.instructions), /Research is optional background/);
  assert.match(JSON.stringify(request?.input), /No source URLs are available/);
  assert.equal(request?.tools, undefined);
});
