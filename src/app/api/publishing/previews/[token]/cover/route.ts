import { getReviewStore } from '@/lib/publishing/reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
};

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) return new Response('Not found', { status: 404, headers });
  const review = await (await getReviewStore()).byToken(token);
  if (!review?.coverBase64) return new Response('Not found', { status: 404, headers });
  return new Response(new Uint8Array(Buffer.from(review.coverBase64, 'base64')), {
    headers: { ...headers, 'Content-Type': 'image/jpeg' },
  });
}
