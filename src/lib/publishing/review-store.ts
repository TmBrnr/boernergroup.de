import { randomBytes, createHash } from 'node:crypto';
import type { StateAdapter } from 'chat';

import type { ArticleDraft, PreparedArticle, PreparedCover } from './article';

export const REVIEW_TTL_MS = 24 * 60 * 60 * 1_000;
const OPERATION_TTL_MS = 7 * REVIEW_TTL_MS;

export type Review = {
  id: string;
  token: string;
  threadId: string;
  requestedBy: string;
  kind: 'create' | 'update' | 'delete';
  status: 'pending' | 'approved' | 'cancelled' | 'committed' | 'completed' | 'failed';
  expiresAt: number;
  slug: string;
  title: string;
  description: string;
  originalSha?: string;
  existingCover?: string;
  draft?: ArticleDraft;
  article?: PreparedArticle;
  coverBase64?: string;
  sources: string[];
  approvedBy?: string;
  dispatched?: boolean;
  commitUrl?: string;
  failure?: string;
};

function tokenKey(token: string): string {
  return `preview:${createHash('sha256').update(token).digest('hex')}`;
}

export function reviewStore(state: StateAdapter) {
  const get = (id: string) => state.get<Review>(`review:${id}`);
  const save = (review: Review) => state.set(`review:${review.id}`, review, OPERATION_TTL_MS);
  return {
    get,
    save,
    async create(input: Omit<Review, 'status' | 'token' | 'expiresAt'>): Promise<Review> {
      const review: Review = { ...input, token: randomBytes(32).toString('hex'), status: 'pending', expiresAt: Date.now() + REVIEW_TTL_MS };
      await state.setIfNotExists(`review:${review.id}`, review, OPERATION_TTL_MS);
      const stored = (await get(review.id))!;
      await state.set(tokenKey(stored.token), stored.id, Math.max(1, stored.expiresAt - Date.now()));
      return stored;
    },
    async byToken(token: string): Promise<Review | null> {
      if (!/^[a-f0-9]{64}$/.test(token)) return null;
      const id = await state.get<string>(tokenKey(token));
      const review = id ? await get(id) : null;
      return review && review.expiresAt > Date.now() && review.status !== 'cancelled' ? review : null;
    },
    async locked<T>(id: string, operation: () => Promise<T>): Promise<T> {
      const lock = await state.acquireLock(`review-lock:${id}`, 120_000);
      if (!lock) throw new Error('This review is already being processed. Please try again shortly.');
      try { return await operation(); } finally { await state.releaseLock(lock); }
    },
  };
}


export function previewUrl(review: Review, siteUrl: string): string {
  return `${siteUrl}/publisher/preview/${review.token}`;
}

export function storedCover(cover: PreparedCover): string {
  return cover.bytes.toString('base64');
}

export function restoreCover(review: Review): PreparedCover {
  if (!review.coverBase64) throw new Error('The preview cover is missing. Create a new preview.');
  const bytes = Buffer.from(review.coverBase64, 'base64');
  return { bytes, dataUrl: `data:image/jpeg;base64,${review.coverBase64}`, width: 1600, height: 900 };
}

export async function decideStoredReview(
  store: ReturnType<typeof reviewStore>,
  input: { reviewId: string; threadId: string; userId: string; action: 'confirm' | 'cancel' },
  isAuthorised: (userId: string) => boolean,
  enqueue: (review: Review) => Promise<void>,
): Promise<string> {
  if (!isAuthorised(input.userId)) return 'You are not authorised to manage articles.';
  return store.locked(input.reviewId, async () => {
    const review = await store.get(input.reviewId);
    if (!review || review.threadId !== input.threadId) return 'This review does not exist in this thread. Use its original preview message.';
    if (review.status === 'approved' && !review.dispatched && input.action === 'confirm') {
      await enqueue(review);
      await store.save({ ...review, dispatched: true });
      return 'Confirmation dispatch retried. The approved change will be applied only once.';
    }
    if (review.status !== 'pending') return `This review is already ${review.status}. No additional change was queued.`;
    if (review.expiresAt <= Date.now()) return 'This preview expired. Request a new preview before confirming.';
    if (input.action === 'cancel') {
      await store.save({ ...review, status: 'cancelled' });
      return 'Cancelled. No website change will be made.';
    }
    const approved: Review = { ...review, status: 'approved', approvedBy: input.userId };
    await store.save(approved);
    try {
      await enqueue(approved);
      await store.save({ ...approved, dispatched: true });
    } catch {
      // Delivery may have succeeded even if its acknowledgement was lost.
      // Keep approval intact; retrying uses the same queue idempotency key.
      return 'Confirmed, but queue dispatch was not acknowledged. Use `confirm ' + review.id + '` again to retry safely, or check its status. Do not submit a new article request.';
    }
    return `Confirmed ${review.kind} of “${review.title}”. I will apply the change and check the live website before reporting completion.`;
  });
}
