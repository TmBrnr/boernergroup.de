import 'server-only';
import { createHash } from 'node:crypto';
import type OpenAI from 'openai';
import { agentArguments, canConfirmSeenPreview, type AgentToolName } from './agent-contract';
import { coverForOperation, editorMessage } from './image-context';
import { pollAgentResponse, startAgentResponse } from './agent-openai';
import type { AgentJob, AgentContext, QueuedImage } from './agent-schema';
import { prepareArticle, prepareCover } from './article';
import { friendlyError } from './errors';
import { getPublishingChat } from './chat';
import { canManageArticles, getPublishingConfig } from './config';
import { listPublishedArticles, readPublishedArticle, readPublishedCover } from './github';
import { enqueueApprovedJob, enqueueDeletionJob, enqueuePublishingJob } from './jobs';
import { enqueueJob } from './queue';
import { postReviewPreview } from './review-card';
import { decideStoredReview, getConversationStore, getReviewStore, storedCover } from './reviews';

const TTL = 24 * 60 * 60 * 1000;
type Turn = { input: OpenAI.Responses.ResponseInputItem[]; text: string; seenReviewId: string | null; cover?: QueuedImage; recentCover?: QueuedImage };
export async function cancelConversation(threadId: string, userId: string) {
  if (!canManageArticles(getPublishingConfig(), userId)) throw new Error('Not authorised.');
  const conversations = await getConversationStore();
  const reviews = await getReviewStore();
  return conversations.locked(threadId, async () => {
    const current = await conversations.get(threadId);
    if (current.busyJobId) await conversations.cancelTask(current.busyJobId);
    if (current.busyTurnId) await conversations.cancelTask(current.busyTurnId);
    for (const id of current.pendingTurnIds ?? []) await conversations.cancelTask(id);
    if (current.activeReviewId) await reviews.locked(current.activeReviewId, async () => {
      const review = await reviews.get(current.activeReviewId!);
      if (review && (review.status === 'pending' || review.status === 'editing')) await reviews.save({ ...review, status: 'cancelled' });
    });
    await conversations.save(threadId, { ...current, busyJobId: undefined, busyTurnId: undefined, pendingTurnIds: [] });
    return 'Draft preparation cancelled. Any already confirmed website change cannot be cancelled here.';
  });
}
export async function confirmCurrent(reviewId: string, threadId: string, userId: string, turnId?: string) {
  const conversations = await getConversationStore();
  return conversations.locked(threadId, async () => {
    const current = await conversations.get(threadId);
    if ((current.pendingTurnIds ?? []).some((id) => id !== turnId) || current.busyJobId || (current.busyTurnId && current.busyTurnId !== turnId) || current.activeReviewId !== reviewId) return 'Use the latest preview after all edits finish. This preview cannot be confirmed.';
    return decideStoredReview(await getReviewStore(), { reviewId, threadId, userId, action: 'confirm' }, (id) => canManageArticles(getPublishingConfig(), id), enqueueApprovedJob);
  });
}
async function executeTool(name: AgentToolName, raw: unknown, turn: Turn, context: AgentContext, callId: string): Promise<unknown> {
  const config = getPublishingConfig();
  const conversations = await getConversationStore();
  const reviews = await getReviewStore();
  const thread = getPublishingChat().thread(context.threadId);
  if (await conversations.cancelled(context.jobId)) throw new Error('This conversation turn was cancelled.');
  // Validate all function inputs at the application boundary, independently of model schemas.
  agentArguments[name].parse(raw);
  const current = await conversations.get(context.threadId);
  const review = current.activeReviewId ? await reviews.get(current.activeReviewId) : null;
  const operationId = createHash('sha256').update(`${context.jobId}:${callId}`).digest('hex').slice(0, 32);
  const operation = { ...context, jobId: operationId };
  const busy = async () => conversations.locked(context.threadId, async () => {
    const fresh = await conversations.get(context.threadId);
    if (await conversations.cancelled(context.jobId)) throw new Error('This conversation turn was cancelled.');
    if (fresh.busyJobId) throw new Error('A draft change is already in progress. Wait for its preview or cancel it.');
    await conversations.save(context.threadId, { ...fresh, busyJobId: operationId });
  });
  if (name === 'list_articles') return listPublishedArticles(config);
  if (name === 'read_article') {
    const { slug } = agentArguments.read_article.parse(raw);
    const article = await readPublishedArticle(slug, config);
    return { slug, metadata: article.data, body: article.content };
  }
  if (name === 'read_draft') return review ? { id: review.id, kind: review.kind, status: review.status, slug: review.slug, draft: review.draft, sources: review.sources, hasCover: Boolean(review.coverBase64), previewShownBeforeThisMessage: review.id === turn.seenReviewId, busy: Boolean(current.busyJobId) } : { status: current.busyJobId ? 'preparing' : 'no draft' };
  if (name === 'cancel_preview') {
    const result = await cancelConversation(context.threadId, context.requestedBy);
    await thread.post(result);
    return result;
  }
  if (name === 'confirm_preview') {
    if (!review || !canConfirmSeenPreview({ text: turn.text, kind: review.kind, reviewId: review.id, seenReviewId: turn.seenReviewId, busy: Boolean(current.busyJobId) })) throw new Error('A separate explicit confirmation of an already displayed preview is required.');
    return confirmCurrent(review.id, context.threadId, context.requestedBy, context.jobId);
  }
  if (name === 'show_preview') {
    if (!review || review.status !== 'pending' || current.busyJobId || review.expiresAt <= Date.now()) return { status: review?.status ?? 'no preview', busy: Boolean(current.busyJobId) };
    await postReviewPreview(thread, review, config.siteUrl); return { status: 'preview shown', id: review.id };
  }
  if (name === 'create_draft') {
    await busy();
    const { brief, research } = agentArguments.create_draft.parse(raw);
    await enqueuePublishingJob({ context: operation, request: brief, research: research ?? true, cover: turn.cover });
    return { status: 'draft preparation queued; await preview' };
  }
  if (name === 'prepare_delete') {
    await busy();
    await enqueueDeletionJob({ context: operation, slug: agentArguments.prepare_delete.parse(raw).slug });
    return { status: 'deletion preview queued; separate confirmation required' };
  }
  if (name === 'prepare_update') {
    const { slug } = agentArguments.prepare_update.parse(raw);
    await busy();
    const existing = await readPublishedArticle(slug, config);
    const bytes = await readPublishedCover(existing.data.cover, config);
    if (!bytes) throw new Error('Cannot preserve the existing cover. Ask an administrator to check its asset.');
    const draft = { title: String(existing.data.title), description: String(existing.data.description), categories: Array.isArray(existing.data.categories) ? existing.data.categories.map(String) : [], coverAlt: String(existing.data.coverAlt), body: existing.content };
    const article = prepareArticle(draft, { slug, originalRaw: existing.raw, operationId });
    const prepared = await reviews.create({ id: operationId, threadId: context.threadId, requestedBy: context.requestedBy, kind: 'update', slug, title: draft.title, description: draft.description, originalSha: existing.sha, originalRaw: existing.raw, draft, article, coverBase64: storedCover(await prepareCover(bytes)), sources: [] });
    if (review?.status === 'pending' && review.id !== prepared.id) await reviews.locked(review.id, async () => {
      const old = await reviews.get(review.id); if (old?.status === 'pending') await reviews.save({ ...old, status: 'superseded' });
    });
    await postReviewPreview(thread, prepared, config.siteUrl);
    if (await conversations.cancelled(context.jobId) || await conversations.cancelled(operationId)) { await reviews.save({ ...prepared, status: 'cancelled' }); return { status: 'cancelled' }; }
    await conversations.select(context.threadId, prepared.id);
    return { status: 'live article copied to editable preview', draft };
  }
  if (!review || review.kind === 'delete' || review.status !== 'pending' || review.expiresAt <= Date.now()) throw new Error('There is no current editable draft. Prepare an update or a new article first.');
  const edit = name === 'revise_draft' ? agentArguments.revise_draft.parse(raw) : agentArguments.change_cover.parse(raw);
  const coverMode = 'mode' in edit ? edit.mode : 'keep';
  const coverSource = 'source' in edit ? edit.source ?? 'current' : 'current';
  const cover = coverForOperation(coverMode, coverSource, turn.cover, turn.recentCover);
  await busy();
  await reviews.locked(review.id, async () => {
    const fresh = await reviews.get(review.id);
    if (fresh?.status !== 'pending') throw new Error('The draft changed. Use its latest preview.');
    await reviews.save({ ...fresh, status: 'editing' });
  });
  await enqueueJob({ stage: 'revision-start', context: operation, baseReviewId: review.id, instructions: 'instructions' in edit ? edit.instructions : edit.prompt, research: 'research' in edit ? edit.research : false, coverMode, coverSource, cover } as import('./agent-schema').RevisionJob);
  return { status: 'revision queued; old approval invalid; await fresh preview' };
}

export async function processAgent(job: AgentJob) {
  const config = getPublishingConfig();
  if (!canManageArticles(config, job.context.requestedBy)) throw new Error('The requester is no longer authorised.');
  const conversations = await getConversationStore();
  const state = getPublishingChat().getState();
  const key = `agent-turn:${job.context.jobId}`;
  if (await conversations.cancelled(job.context.jobId)) { await releaseAgentTurn(job.context); return; }
  let turn = await state.get<Turn>(key);
  if (job.stage === 'agent-start') {
    if (await state.get(`agent-done:${job.context.jobId}`)) return;
    const current = await conversations.get(job.context.threadId);
    if ((current.busyTurnId && current.busyTurnId !== job.context.jobId) || (current.pendingTurnIds?.[0] && current.pendingTurnIds[0] !== job.context.jobId)) {
      if (job.pollCount >= 54) throw new Error('The previous conversation turn did not finish.');
      await enqueueJob({ ...job, pollCount: job.pollCount + 1 }, 10); return;
    }
    await conversations.locked(job.context.threadId, async () => {
      const fresh = await conversations.get(job.context.threadId);
      if (fresh.busyTurnId && fresh.busyTurnId !== job.context.jobId) throw new Error('Another conversation turn started.');
      await conversations.save(job.context.threadId, { ...fresh, busyTurnId: job.context.jobId });
    });
    if (!turn) {
      if (job.cover) await conversations.rememberImage(job.context.threadId, job.context.requestedBy, job.cover);
      const recentCover = await conversations.recentImage(job.context.threadId, job.context.requestedBy);
      turn = { input: [...current.history, { role: 'user', content: editorMessage(job.text, job.cover, recentCover) }], text: job.text, cover: job.cover, recentCover, seenReviewId: job.seenReviewId };
    }
    await state.set(key, turn, TTL);
    const response = await startAgentResponse(turn.input, config, job.context.jobId);
    await enqueueJob({ stage: 'agent-poll', context: job.context, responseId: response.id, step: 0, pollCount: 0 } as AgentJob, 5); return;
  }
  if (!turn) throw new Error('The conversation turn expired. Please send the request again.');
  if (job.pollCount >= 54 || job.step >= 8) throw new Error('The editor reached its response limit. Please split the request into smaller changes.');
  if (await state.get(`agent-done:${job.context.jobId}`)) return;
  const response = await pollAgentResponse(job.responseId, config);
  if (!response) { await enqueueJob({ ...job, pollCount: job.pollCount + 1 }, 5); return; }
  if (await conversations.cancelled(job.context.jobId)) { await releaseAgentTurn(job.context); return; }
  const call = response.output.find((item) => item.type === 'function_call');
  if (call?.type === 'function_call') {
    const resultKey = `agent-tool:${job.context.jobId}:${call.call_id}`;
    let result = await state.get<{ value: unknown }>(resultKey);
    if (!result) {
      try {
        if (!(call.name in agentArguments)) throw new Error('Unknown function.');
        result = { value: await executeTool(call.name as AgentToolName, JSON.parse(call.arguments), turn, job.context, call.call_id) };
      } catch (error) {
        // An uncertain enqueue must not leave a pending task or approval permanently locked.
        const operationId = createHash('sha256').update(`${job.context.jobId}:${call.call_id}`).digest('hex').slice(0, 32);
        await conversations.locked(job.context.threadId, async () => {
          const current = await conversations.get(job.context.threadId);
          if (current.busyJobId !== operationId) return;
          await conversations.cancelTask(operationId);
          const reviews = await getReviewStore();
          if (current.activeReviewId) await reviews.locked(current.activeReviewId, async () => {
            const base = await reviews.get(current.activeReviewId!);
            if (base?.status === 'editing') await reviews.save({ ...base, status: 'pending' });
          });
          await conversations.save(job.context.threadId, { ...current, busyJobId: undefined });
        });
        result = { value: { error: friendlyError(error) } };
      }
      await state.set(resultKey, result, TTL);
    }
    // Keep reasoning and function call items, including encrypted reasoning, across stateless turns.
    const previousInput = (await state.get<OpenAI.Responses.ResponseInputItem[]>(`${key}:step:${job.step}`)) ?? turn.input;
    const replay = response.output.filter((item) => item.type === 'message' || item.type === 'function_call' || item.type === 'reasoning') as OpenAI.Responses.ResponseInputItem[];
    const input: OpenAI.Responses.ResponseInputItem[] = [...previousInput, ...replay, { type: 'function_call_output' as const, call_id: call.call_id, output: JSON.stringify(result.value) }];
    await state.set(`${key}:step:${job.step + 1}`, input, TTL);
    const next = await startAgentResponse(input, config, `${job.context.jobId}:${job.step + 1}`);
    await enqueueJob({ stage: 'agent-poll', context: job.context, responseId: next.id, step: job.step + 1, pollCount: 0 } as AgentJob, 5); return;
  }
  const text = response.output_text || 'I could not determine the requested change. Please describe which article or draft you want to edit.';
  await getPublishingChat().thread(job.context.threadId).post(text);
  await conversations.append(job.context.threadId, { role: 'user', content: turn.text });
  await conversations.append(job.context.threadId, { role: 'assistant', content: text });
  await state.set(`agent-done:${job.context.jobId}`, true, TTL);
  await releaseAgentTurn(job.context);
}
export async function releaseAgentTurn(context: AgentContext) {
  const conversations = await getConversationStore();
  await conversations.locked(context.threadId, async () => {
    const current = await conversations.get(context.threadId);
    await conversations.save(context.threadId, { ...current, busyTurnId: current.busyTurnId === context.jobId ? undefined : current.busyTurnId, pendingTurnIds: current.pendingTurnIds?.filter((id) => id !== context.jobId) });
  });
}
