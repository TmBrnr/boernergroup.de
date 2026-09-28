import type { Review } from './reviews';

export async function isChangeLive(review: Review, siteUrl: string): Promise<boolean> {
  const url = new URL(`/newsroom/${review.slug}`, siteUrl);
  url.searchParams.set('publisher-check', review.id);
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
    headers: { 'Cache-Control': 'no-cache' },
    redirect: 'follow',
  });
  if (review.kind === 'delete') return response.status === 404;
  if (!response.ok) return false;
  const html = await response.text();
  return new RegExp(`<meta\\s+name="publisher-operation"\\s+content="${review.id}"\\s*/?>`).test(html);
}
