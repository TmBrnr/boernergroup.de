import assert from 'node:assert/strict';
import test from 'node:test';
import { parseResearchResult } from '../src/lib/publishing/research-result';
import { hasCreationIntent } from '../src/lib/publishing/agent-contract';

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
