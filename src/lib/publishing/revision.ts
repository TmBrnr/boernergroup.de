import 'server-only';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import { createGeneratedCover, generatedCoverAlt, prepareArticle, prepareCover, type ArticleDraft } from './article';
import { pollAgentResponse, startCoverImage, startCoverCaption, parseCoverCaption } from './agent-openai';
import type { RevisionJob } from './agent-schema';
import { getPublishingChat } from './chat';
import { getPublishingConfig } from './config';
import { readQueuedCover } from './jobs';
import { startDraftArticle, pollDraftArticle, startResearchTopic, pollResearchTopic, type ResearchResult } from './openai';
import { MAX_RESEARCH_POLL_COUNT, normalizeResearchContext } from './research-result';
import { enqueueJob } from './queue';
import { postReviewPreview } from './review-card';
import { getConversationStore, getReviewStore, restoreCover, storedCover } from './reviews';

type Revision = { instructions: string; research: ResearchResult; draft: ArticleDraft; coverBase64?: string };
const TTL = 24 * 60 * 60 * 1000;
export async function processRevision(job: RevisionJob) {
  const config = getPublishingConfig();
  const conversations = await getConversationStore();
  const reviews = await getReviewStore();
  const base = await reviews.get(job.baseReviewId);
  const completed = await reviews.get(job.context.jobId);
  if (completed?.status === 'pending' && base?.status === 'superseded' && !await conversations.cancelled(job.context.jobId)) { await conversations.select(job.context.threadId, completed.id); return; }
  if (!base || base.threadId !== job.context.threadId || base.status !== 'editing' || !base.draft || await conversations.cancelled(job.context.jobId)) return;
  const state = getPublishingChat().getState();
  const key = `revision:${job.context.jobId}`;
  const thread = getPublishingChat().thread(job.context.threadId);
  const next = async (stage: string, responseId: string) => enqueueJob({ stage, context: job.context, baseReviewId: base.id, responseId, pollCount: 0 } as RevisionJob, 10);
  let revision = await state.get<Revision>(key);
  if (revision) revision.research = normalizeResearchContext(revision.research);
  const startText = async (result: Revision) => {
    await state.set(key, result, TTL);
    const response = await startDraftArticle({ request: `${result.instructions}\n\nRevise this draft, preserving unaffected content, title, categories and cover alt:\n${JSON.stringify(base.draft)}`, research: result.research, config, idempotencyKey: job.context.jobId });
    await next('revision-text-poll', response.id);
  };
  const finish = async (result: Revision) => {
    if (await conversations.cancelled(job.context.jobId)) return;
    const article = prepareArticle(result.draft, { slug: base.kind === 'update' ? base.slug : undefined, originalRaw: base.originalRaw, operationId: job.context.jobId });
    await serialize(result.draft.body, { mdxOptions: { remarkPlugins: [remarkGfm] } });
    let ready = false;
    await reviews.locked(base.id, async () => {
      if ((await reviews.get(base.id))?.status !== 'editing' || await conversations.cancelled(job.context.jobId)) return;
      const review = await reviews.create({ id: job.context.jobId, threadId: base.threadId, requestedBy: job.context.requestedBy, kind: base.kind, originalSha: base.originalSha, originalRaw: base.originalRaw, slug: article.slug, title: result.draft.title, description: result.draft.description, draft: result.draft, article, coverBase64: result.coverBase64 ?? base.coverBase64, sources: result.research.sources });
      await postReviewPreview(thread, review, config.siteUrl);
      if (await conversations.cancelled(job.context.jobId)) { await reviews.save({ ...review, status: 'cancelled' }); return; }
      await reviews.save({ ...base, status: 'superseded' });
      ready = true;
    });
    if (ready) await conversations.select(base.threadId, job.context.jobId);
  };
  if (job.stage === 'revision-start') {
    revision = revision ?? { instructions: job.instructions, research: { brief: 'Preserve the existing factual claims and citations. Only make the requested changes.', sources: base.sources }, draft: base.draft };
    await state.set(key, revision, TTL);
    if (job.coverMode !== 'keep') {
      if (job.coverMode === 'upload' || job.coverMode === 'abstract') {
        if (job.coverMode === 'upload' && !job.cover) throw new Error('Attach an image and mention me to use it as the cover.');
        const cover = job.coverMode === 'upload' ? await readQueuedCover(job.cover!, base.threadId) : await createGeneratedCover({ ...base.draft, title: `${base.title}: ${job.instructions}` });
        revision.coverBase64 = storedCover(cover);
        if (job.coverMode === 'abstract') {
          revision.draft = { ...base.draft, coverAlt: generatedCoverAlt(base.draft) };
          await finish(revision); return;
        }
        await state.set(key, revision, TTL);
        const response = await startCoverCaption(cover.dataUrl, config, job.context.jobId);
        await next('revision-caption-poll', response.id); return;
      }
      let source: string | undefined;
      if (job.coverMode === 'edit') {
        if (job.coverSource === 'upload') {
          if (!job.cover) throw new Error('The uploaded image is missing. Attach it again.');
          source = (await readQueuedCover(job.cover, base.threadId)).dataUrl;
        } else source = restoreCover(base).dataUrl;
      }
      const response = await startCoverImage(`${base.title}. ${job.instructions}`, source, config, job.context.jobId);
      await next('revision-image-poll', response.id); return;
    }
    if (job.research) {
      const response = await startResearchTopic(`${job.instructions}\n\nExisting article:\n${base.draft.body}`, config, job.context.jobId);
      if (response) { await next('revision-research-poll', response.id); return; }
    }
    await startText(revision); return;
  }
  if (!revision) throw new Error('Revision state expired. Request the change again.');
  if (!('pollCount' in job) || (job.stage !== 'revision-research-poll' && job.pollCount >= 54)) throw new Error('The revision did not finish before the preview deadline.');
  const retry = () => enqueueJob({ ...job, pollCount: job.pollCount + 1 }, 10);
  if (job.stage === 'revision-research-poll') {
    const research = await pollResearchTopic(job.responseId, config, job.pollCount >= MAX_RESEARCH_POLL_COUNT);
    if (!research) { await retry(); return; }
    revision.research = { brief: research.brief || revision.research.brief, sources: [...new Set([...base.sources, ...research.sources])] };
    await startText(revision); return;
  }
  if (job.stage === 'revision-text-poll') {
    const draft = await pollDraftArticle(job.responseId, config);
    if (!draft) { await retry(); return; }
    await finish({ ...revision, draft: { ...draft, coverAlt: base.draft.coverAlt } }); return;
  }
  const response = await pollAgentResponse(job.responseId, config);
  if (!response) { await retry(); return; }
  if (job.stage === 'revision-image-poll') {
    const image = response.output.find((item) => item.type === 'image_generation_call');
    if (!image || image.type !== 'image_generation_call' || !image.result) throw new Error('The image tool returned no image.');
    const cover = await prepareCover(Buffer.from(image.result, 'base64'));
    revision.coverBase64 = storedCover(cover);
    await state.set(key, revision, TTL);
    const caption = await startCoverCaption(cover.dataUrl, config, job.context.jobId);
    await next('revision-caption-poll', caption.id); return;
  }
  await finish({ ...revision, draft: { ...base.draft, coverAlt: parseCoverCaption(response) } });
}

export async function failRevision(job: RevisionJob) {
  const reviews = await getReviewStore();
  await reviews.locked(job.baseReviewId, async () => {
    const base = await reviews.get(job.baseReviewId);
    if (base?.status === 'editing') await reviews.save({ ...base, status: 'pending' });
  });
  const conversations = await getConversationStore();
  await conversations.locked(job.context.threadId, async () => {
    const current = await conversations.get(job.context.threadId);
    if (current.busyJobId === job.context.jobId) await conversations.save(job.context.threadId, { ...current, busyJobId: undefined });
  });
}
