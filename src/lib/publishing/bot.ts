import 'server-only';

import { type Chat, type Message } from 'chat';
import { createHash } from 'node:crypto';

import { getPublishingChat } from './chat';
import { cleanPrompt, parsePublisherCommand } from './commands';
import { canManageArticles, getPublishingConfig } from './config';
import { friendlyError } from './errors';
import { type QueuedCover } from './jobs';
import { enqueueJob } from './queue';
import { confirmCurrent, cancelConversation, releaseAgentTurn } from './agent';
import { getConversationStore } from './reviews';
import { isExplicitConfirmation } from './agent-contract';
import type { AgentJob } from './agent-schema';
import { postReviewPreview } from './review-card';
import { getReviewStore } from './reviews';

function getQueuedCover(message: Message): QueuedCover | undefined {
  return message.toJSON().attachments.find((candidate) => candidate.type === 'image' || candidate.mimeType?.startsWith('image/'));
}

const HELP = [
  'Create: `new blog post <brief>` or `write an article <brief>`.',
  'Update: `update <article-slug or newsroom URL> <changes>` or `aktualisiere …`.',
  'Delete: `delete <article-slug or newsroom URL>` or `lösche …`.',
  'Mention me in the same thread to edit: “make the intro shorter”, “ändere die Überschrift”, or “generate a photo of Frankfurt for the cover”. Attach a picture and say “use this as the cover”, or refer to your last uploaded picture in a follow-up within 24 hours. I can edit drafts and prepare changes to live articles.',
  'Every revision gets a fresh preview. Confirm with its button or say “okay publish” / “ja veröffentlichen”. Cancel with its button or say “abbrechen”. Mention me in each follow-up; the current Slack installation delivers mentions.',
  'Use `preview <review-id>` or `status <review-id>` to check a request. Previews expire after 24 hours.',
].join('\n\n');

// A confirmation can only enqueue the exact snapshot shown in its original thread.
export async function decideReview(input: {
  reviewId: string;
  threadId: string;
  userId: string;
  action: 'confirm' | 'cancel';
}): Promise<string> {
  if (input.action === 'confirm') return confirmCurrent(input.reviewId, input.threadId, input.userId);
  const current = await (await getConversationStore()).get(input.threadId);
  if (current.activeReviewId !== input.reviewId) return 'Use the latest preview in this thread.';
  return cancelConversation(input.threadId, input.userId);
}

let handlersRegistered = false;

export function getPublishingBot(): Chat {
  const bot = getPublishingChat();
  if (handlersRegistered) return bot;
  handlersRegistered = true;

  bot.onAction(['publisher-confirm', 'publisher-cancel'], async (event) => {
    if (!event.thread) return;
    try {
      if (!event.value || !/^[a-f0-9]{32}$/.test(event.value)) return;
      const response = await decideReview({
        reviewId: event.value,
        threadId: event.threadId,
        userId: event.user.userId,
        action: event.actionId === 'publisher-confirm' ? 'confirm' : 'cancel',
      });
      await event.thread.post(response);
    } catch (error) {
      console.error('Could not decide publisher review', error);
      await event.thread.post(friendlyError(error));
    }
  });

  bot.onNewMention(async (thread, message) => {
    const config = getPublishingConfig();
    if (!canManageArticles(config, message.author.userId)) {
      await thread.post('You are not authorised to manage articles.');
      return;
    }
    const command = parsePublisherCommand(message.text, config.siteUrl);
    try {
      if (command.kind === 'help') {
        await thread.post(HELP);
        return;
      }
      if (command.kind === 'confirm' || command.kind === 'cancel') {
        await thread.post(await decideReview({ reviewId: command.reviewId, threadId: thread.id, userId: message.author.userId, action: command.kind }));
        return;
      }
      if (command.kind === 'preview' || command.kind === 'status') {
        const review = await (await getReviewStore()).get(command.reviewId);
        if (!review || review.threadId !== thread.id) {
          await thread.post('This review does not exist in this thread. Use its original preview message.');
        } else if (review.expiresAt <= Date.now() || review.status !== 'pending' || command.kind === 'status') {
          await thread.post(`Review ${review.id}: ${review.status === 'pending' && review.expiresAt <= Date.now() ? 'expired' : review.status}.${review.commitUrl ? ` Recovery history: ${review.commitUrl}` : ''}${review.failure ? ` ${review.failure}` : ''}`);
        } else {
          await postReviewPreview(thread, review, config.siteUrl);
        }
        return;
      }
      const context = {
        jobId: createHash('sha256').update(`${thread.id}:${message.id}`).digest('hex').slice(0, 32),
        threadId: thread.id,
        requestedBy: message.author.userId,
      };
      if (/^(?:<@[^>]+>\s*)?(?:cancel|abbrechen|abbruch|stopp|stop)[.!?\s]*$/i.test(cleanPrompt(message.text))) {
        await thread.post(await cancelConversation(thread.id, message.author.userId));
        return;
      }
      const conversation = await (await getConversationStore()).get(thread.id);
      const active = conversation.activeReviewId ? await (await getReviewStore()).get(conversation.activeReviewId) : null;
      if (active && !conversation.busyJobId && isExplicitConfirmation(message.text, active.kind)) {
        await thread.post(await confirmCurrent(active.id, thread.id, message.author.userId));
        return;
      }
      const conversations = await getConversationStore();
      await conversations.locked(thread.id, async () => {
        const current = await conversations.get(thread.id);
        if ((current.pendingTurnIds?.length ?? 0) >= 16) throw new Error('Wait for the current conversation requests to finish.');
        await conversations.save(thread.id, { ...current, pendingTurnIds: [...new Set([...(current.pendingTurnIds ?? []), context.jobId])] });
      });
      try {
        await enqueueJob({ stage: 'agent-start', context, text: message.text.slice(0, 16_000), cover: getQueuedCover(message), seenReviewId: !conversation.busyJobId && active?.status === 'pending' ? active.id : null, pollCount: 0 } as AgentJob);
      } catch (error) {
        await conversations.cancelTask(context.jobId);
        await releaseAgentTurn(context);
        throw error;
      }

    } catch (error) {
      console.error('Could not handle Slack publisher command', error);
      await thread.post(`I could not complete this request: ${friendlyError(error)}`);
    }
  });
  return bot;
}
