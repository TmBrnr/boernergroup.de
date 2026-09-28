import type { Review } from './review-store';

// Slack sections have a 3,000 character limit. Split the full draft without truncation.
export function previewParts(review: Review): string[] {
  const text = `${review.draft?.body ?? ''}${review.sources.length ? `\n\nResearch sources:\n${review.sources.join('\n')}` : ''}`;
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let end = Math.min(remaining.length, 2_800);
    if (end < remaining.length) {
      const newline = remaining.lastIndexOf('\n', end);
      if (newline > 1_400) end = newline;
    }
    parts.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  return parts;
}

