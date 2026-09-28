import 'server-only';

import { send, type MessageMetadata } from '@vercel/queue';
import { Actions, Card, CardText, LinkButton, type Attachment } from 'chat';
import { z } from 'zod';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';

import { createGeneratedCover, generatedCoverAlt, prepareArticle, prepareCover, type PreparedCover } from './article';
import { getPublishingChat } from './chat';
import { MAX_BRIEF_LENGTH } from './commands';
import { canManageArticles, getPublishingConfig } from './config';
import { isChangeLive } from './deployment';
import { friendlyError } from './errors';
import { deleteArticle, publishArticle, readPublishedArticle } from './github';
import { pollDraftArticle, pollResearchTopic, startDraftArticle, startResearchTopic } from './openai';
import { reviewCard } from './review-card';
import { getReviewStore, restoreCover, storedCover, type Review } from './reviews';

export const PUBLISHING_QUEUE_TOPIC = 'boerner-publishing-jobs-v1';
const POLL_DELAY_SECONDS = 10;
const MAX_POLL_COUNT = 54;
const contextSchema = z.object({ jobId: z.string().regex(/^[a-f0-9]{32}$/), threadId: z.string().min(1).max(256), requestedBy: z.string().min(1).max(128) });
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const attachmentSchema = z.object({
  type: z.enum(['image', 'file', 'video', 'audio']), url: z.string().optional(), name: z.string().optional(),
  mimeType: z.string().optional(), size: z.number().int().nonnegative().optional(), width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(), fetchMetadata: z.record(z.string(), z.string()).optional(),
});
const researchSchema = z.object({ brief: z.string(), sources: z.array(z.string()) });
const targetSchema = z.object({ slug: slugSchema, sha: z.string(), raw: z.string() });
const draftingFields = { context: contextSchema, request: z.string().min(1).max(MAX_BRIEF_LENGTH), cover: attachmentSchema.optional(), slug: slugSchema.optional() };
const pollingFields = { ...draftingFields, target: targetSchema.optional(), responseId: z.string().min(1), pollCount: z.number().int().nonnegative() };
const publishingJobSchema = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('publish-start'), ...draftingFields }),
  z.object({ stage: z.literal('research-poll'), ...pollingFields }),
  z.object({ stage: z.literal('draft-poll'), ...pollingFields, research: researchSchema }),
  z.object({ stage: z.literal('delete-preview'), context: contextSchema, slug: slugSchema }),
  z.object({ stage: z.literal('approved-apply'), context: contextSchema }),
  z.object({ stage: z.literal('deployment-poll'), context: contextSchema, pollCount: z.number().int().nonnegative() }),
]);

export type PublishingJob = z.infer<typeof publishingJobSchema>;
export type QueuedCover = z.infer<typeof attachmentSchema>;
export type PublishingJobContext = z.infer<typeof contextSchema>;

async function enqueue(job: PublishingJob, delaySeconds = 0): Promise<void> {
  const key = `${job.context.jobId}:${job.stage}${'responseId' in job ? `:${job.responseId}` : ''}${'pollCount' in job ? `:${job.pollCount}` : ''}`;
  await send(PUBLISHING_QUEUE_TOPIC, job, { delaySeconds, idempotencyKey: key, retentionSeconds: 60 * 60 });
}

export async function enqueuePublishingJob(input: { context: PublishingJobContext; request: string; cover?: QueuedCover; slug?: string }) {
  await enqueue({ stage: 'publish-start', ...input });
}
export async function enqueueDeletionJob(input: { context: PublishingJobContext; slug: string }) {
  await enqueue({ stage: 'delete-preview', ...input });
}
export async function enqueueApprovedJob(review: Review) {
  await enqueue({ stage: 'approved-apply', context: { jobId: review.id, threadId: review.threadId, requestedBy: review.requestedBy } });
}

async function readQueuedCover(cover: QueuedCover, threadId: string): Promise<PreparedCover> {
  const thread = getPublishingChat().thread(threadId);
  const attachment = (thread.adapter.rehydrateAttachment?.(cover as Attachment) ?? cover) as Attachment;
  let bytes: Buffer;
  if (attachment.fetchData) bytes = Buffer.from(await attachment.fetchData());
  else if (Buffer.isBuffer(attachment.data)) bytes = attachment.data;
  else if (attachment.data instanceof Blob) bytes = Buffer.from(await attachment.data.arrayBuffer());
  else throw new Error('Slack did not make the attached image available to download.');
  return prepareCover(bytes, attachment.size);
}

async function processJob(job: PublishingJob): Promise<void> {
  const config = getPublishingConfig();
  if (!canManageArticles(config, job.context.requestedBy)) throw new Error('The requester is no longer authorised to manage articles.');
  const store = await getReviewStore();
  const thread = getPublishingChat().thread(job.context.threadId);

  if (job.stage === 'approved-apply') {
    await store.locked(job.context.jobId, async () => {
      const review = await store.get(job.context.jobId);
      if (!review || review.threadId !== job.context.threadId || review.requestedBy !== job.context.requestedBy) return;
      if (!review.approvedBy || !canManageArticles(config, review.approvedBy)) throw new Error('This change has no valid authorised confirmation.');
      if (review.status === 'committed') {
        await enqueue({ stage: 'deployment-poll', context: job.context, pollCount: 0 }, POLL_DELAY_SECONDS);
        return;
      }
      if (review.status !== 'approved') return;
      let commitUrl: string;
      if (review.kind === 'delete') {
        if (!review.originalSha) throw new Error('This deletion has no article snapshot. Request a new preview.');
        const result = await deleteArticle({ slug: review.slug, originalSha: review.originalSha, requestedBy: review.requestedBy, approvedBy: review.approvedBy, operationId: review.id, config });
        commitUrl = result.commitUrl;
      } else {
        if (!review.article || (review.kind === 'update' && !review.originalSha)) throw new Error('This preview is incomplete. Request a new preview.');
        const result = await publishArticle({ article: review.article, cover: restoreCover(review), originalSha: review.originalSha, requestedBy: review.requestedBy, approvedBy: review.approvedBy, operationId: review.id, config });
        commitUrl = result.commitUrl;
      }
      await store.save({ ...review, status: 'committed', commitUrl });
      await enqueue({ stage: 'deployment-poll', context: job.context, pollCount: 0 }, POLL_DELAY_SECONDS);
      await thread.post(`Confirmed change committed. The website is deploying; the live change is not verified yet. Recovery history: ${commitUrl}`);
    });
    return;
  }

  if (job.stage === 'deployment-poll') {
    await store.locked(job.context.jobId, async () => {
      const review = await store.get(job.context.jobId);
      if (!review || review.status !== 'committed' || review.threadId !== job.context.threadId) return;
      let live = false;
      try { live = await isChangeLive(review, config.siteUrl); } catch (error) { console.warn('Live article check unavailable', error); }
      if (!live) {
        if (job.pollCount >= MAX_POLL_COUNT) {
          const failure = 'The change is committed, but the live website did not reflect it within 9 minutes. An administrator should check the deployment. Do not repeat the change.';
          await store.save({ ...review, failure });
          await thread.post(`${failure} Recovery history: ${review.commitUrl}`);
        } else {
          await enqueue({ ...job, pollCount: job.pollCount + 1 }, POLL_DELAY_SECONDS);
        }
        return;
      }
      await thread.post(Card({
        title: review.title,
        subtitle: review.kind === 'delete' ? 'Deletion verified on the live website' : review.kind === 'update' ? 'Update verified on the live website' : 'Publication verified on the live website',
        children: [CardText(review.description), Actions([
          LinkButton({ url: `${config.siteUrl}/newsroom${review.kind === 'delete' ? '' : `/${review.slug}`}`, label: review.kind === 'delete' ? 'Open newsroom' : 'Open article', style: 'primary' }),
          LinkButton({ url: review.commitUrl!, label: 'View recovery history' }),
        ])],
      }));
      await store.save({ ...review, status: 'completed', failure: undefined });
    });
    return;
  }

  const existingReview = await store.get(job.context.jobId);
  if (existingReview) {
    if (existingReview.status === 'pending') await thread.post(reviewCard(existingReview, config.siteUrl));
    return;
  }
  if (job.stage === 'delete-preview') {
    const existing = await readPublishedArticle(job.slug, config);
    const review = await store.create({
      id: job.context.jobId, threadId: job.context.threadId, requestedBy: job.context.requestedBy,
      kind: 'delete', slug: job.slug, originalSha: existing.sha,
      title: String(existing.data.title ?? job.slug), description: String(existing.data.description ?? 'Remove this article from the website.'), sources: [],
      draft: { title: String(existing.data.title ?? job.slug), description: String(existing.data.description ?? ''), categories: Array.isArray(existing.data.categories) ? existing.data.categories.map(String) : [], coverAlt: String(existing.data.coverAlt ?? ''), body: existing.content },
      existingCover: typeof existing.data.cover === 'string' && /^\/media\/[a-z0-9/.-]+$/i.test(existing.data.cover) ? existing.data.cover : undefined,
    });
    await thread.post(reviewCard(review, config.siteUrl));
    return;
  }

  if (job.stage === 'publish-start') {
    const target = job.slug ? await readPublishedArticle(job.slug, config) : undefined;
    const request = target ? `${job.request}\n\nRevise the existing article below. Keep its subject and any content unaffected by the requested changes.\n\n${target.raw}` : job.request;
    const response = await startResearchTopic(request, config, job.context.jobId);
    await enqueue({ stage: 'research-poll', context: job.context, request: job.request, cover: job.cover, slug: job.slug, target: target && { slug: job.slug!, sha: target.sha, raw: target.raw }, responseId: response.id, pollCount: 0 }, POLL_DELAY_SECONDS);
    return;
  }
  if (job.pollCount >= MAX_POLL_COUNT) throw new Error('OpenAI did not finish the background response before the preview deadline.');
  if (job.stage === 'research-poll') {
    const research = await pollResearchTopic(job.responseId, config);
    if (!research) { await enqueue({ ...job, pollCount: job.pollCount + 1 }, POLL_DELAY_SECONDS); return; }
    if (!research.sources.length) throw new Error('Research returned no sources. No article was prepared or published. Please send a clearer brief.');
    await thread.post(`Research complete with ${research.sources.length} source${research.sources.length === 1 ? '' : 's'}. Preparing the draft for your review.`);
    const preparedCover = job.cover ? await readQueuedCover(job.cover, job.context.threadId) : undefined;
    const request = job.target ? `${job.request}\n\nRevise this existing article, preserving content unaffected by the requested changes:\n${job.target.raw}` : job.request;
    const response = await startDraftArticle({ request, research, coverDataUrl: preparedCover?.dataUrl, config, idempotencyKey: job.context.jobId });
    await enqueue({ ...job, stage: 'draft-poll', research, responseId: response.id, pollCount: 0 }, POLL_DELAY_SECONDS);
    return;
  }
  const generated = await pollDraftArticle(job.responseId, config);
  if (!generated) { await enqueue({ ...job, pollCount: job.pollCount + 1 }, POLL_DELAY_SECONDS); return; }
  if (!job.research.sources.length) throw new Error('Research returned no sources. No article was prepared or published. Please send a clearer brief.');
  const draft = job.cover ? generated : { ...generated, coverAlt: generatedCoverAlt(generated) };
  const cover = job.cover ? await readQueuedCover(job.cover, job.context.threadId) : await createGeneratedCover(draft);
  const article = prepareArticle(draft, { slug: job.target?.slug, originalRaw: job.target?.raw, operationId: job.context.jobId });
  await serialize(draft.body, { mdxOptions: { remarkPlugins: [remarkGfm] } });
  const review = await store.create({
    id: job.context.jobId, threadId: job.context.threadId, requestedBy: job.context.requestedBy,
    kind: job.target ? 'update' : 'create', slug: article.slug, title: draft.title, description: draft.description,
    originalSha: job.target?.sha, draft, article, coverBase64: storedCover(cover), sources: job.research.sources,
  });
  await thread.post(reviewCard(review, config.siteUrl));
}

export async function processPublishingJob(payload: unknown, metadata: MessageMetadata): Promise<void> {
  const parsed = publishingJobSchema.safeParse(payload);
  if (!parsed.success) {
    // Legacy automatic deletion jobs must never bypass the new approval gate.
    console.error('Discarding invalid or obsolete publishing queue payload', parsed.error.flatten());
    return;
  }
  try { await processJob(parsed.data); } catch (error) {
    console.error('Publishing queue job failed', { jobId: parsed.data.context.jobId, stage: parsed.data.stage, deliveryCount: metadata.deliveryCount, error });
    if (metadata.deliveryCount < 3) throw error;
    const store = await getReviewStore();
    const review = await store.get(parsed.data.context.jobId);
    const failure = friendlyError(error);
    if (review && (review.status === 'pending' || review.status === 'approved')) await store.save({ ...review, status: 'failed', failure });
    await getPublishingChat().thread(parsed.data.context.threadId)
      .post(review?.status === 'committed' ? `The change was committed, but I could not finish checking the deployment. Recovery history: ${review.commitUrl}` : `This request stopped without completing: ${failure}`)
      .catch((postError) => console.error('Could not report publisher failure', postError));
  }
}
