export type ResearchResult = { brief: string; sources: string[] };

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }

// API tool metadata is not guaranteed to match the installed SDK's static types.
// Recover citations independently when search calls omit their action details.
export function parseResearchResult(response: { output?: unknown; output_text?: unknown }): ResearchResult {
  const sources = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value !== 'string') return;
    try { if (/^https?:$/.test(new URL(value).protocol)) sources.add(value); } catch { /* Invalid source URLs are ignored. */ }
  };
  for (const value of array(response.output)) {
    const item = record(value);
    if (item?.type === 'message') {
      for (const value of array(item.content)) {
        const part = record(value);
        if (part?.type !== 'output_text') continue;
        for (const value of array(part.annotations)) {
          const annotation = record(value);
          if (annotation?.type === 'url_citation') add(annotation.url);
        }
      }
    }
    if (item?.type !== 'web_search_call') continue;
    const action = record(item.action);
    if (action?.type === 'search') {
      for (const value of array(action.sources)) add(record(value)?.url);
    } else if (action?.type === 'open_page') add(action.url);
  }
  return { brief: typeof response.output_text === 'string' ? response.output_text : '', sources: [...sources].slice(0, 20) };
}
