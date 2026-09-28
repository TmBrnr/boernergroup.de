import 'server-only';

import { type Chat, type Message } from 'chat';
import { createHash } from 'node:crypto';

import { getPublishingChat } from './chat';
import { parsePublisherCommand } from './commands';
import { canManageArticles, getPublishingConfig } from './config';
import { friendlyError } from './errors';
import { enqueuePublishingJob, enqueueDeletionJob, enqueueApprovedJob, type QueuedCover } from './jobs';
import { reviewCard } from './review-card';
import { decideStoredReview, getReviewStore } from './reviews';

function getQueuedCover(message: Message): QueuedCover | undefined {
  return message.toJSON().attachments.find((candidate) => candidate.type === 'image' || candidate.mimeType?.startsWith('image/'));
}

const HELP = [
  'Create: `new blog post <brief>` or `write an article <brief>`.',
  'Update: `update <article-slug or newsroom URL> <changes>` or `aktualisiere …`.',
  'Delete: `delete <article-slug or newsroom URL>` or `lösche …`.',
  'I send a full preview first. Confirm or cancel with the buttons, or tag me with `confirm <review-id>` / `cancel <review-id>` in the same thread.',
  'Use `preview <review-id>` or `status <review-id>` to check a request. Previews expire after 24 hours.',
].join('\n\n');

// A confirmation can only enqueue the exact snapshot shown in its original thread.
export async function decideReview(input: {
  reviewId: string;
  threadId: string;
  userId: string;
  action: 'confirm' | 'cancel';
}): Promise<string> {
  return decideStoredReview(await getReviewStore(), input,
    (userId) => canManageArticles(getPublishingConfig(), userId), enqueueApprovedJob);
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
      if (command.kind === 'help' || command.kind === 'clarify') {
        await thread.post(command.kind === 'help' ? HELP : command.message);
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
          await thread.post(reviewCard(review, config.siteUrl));
        }
        return;
      }
      const context = {
        jobId: createHash('sha256').update(`${thread.id}:${message.id}`).digest('hex').slice(0, 32),
        threadId: thread.id,
        requestedBy: message.author.userId,
      };
      if (command.kind === 'delete') {
        await enqueueDeletionJob({ context, slug: command.slug });
        await thread.post('I am checking the article and preparing a deletion preview. Nothing will be removed until you confirm.');
      } else if (command.kind === 'create' || command.kind === 'update') {
        await enqueuePublishingJob({ context, request: command.request, cover: getQueuedCover(message), slug: command.kind === 'update' ? command.slug : undefined });
        await thread.post('Queued. I am researching and preparing a full article and cover preview. Nothing will be published or updated until you confirm.');
      }
    } catch (error) {
      console.error('Could not handle Slack publisher command', error);
      await thread.post(`I could not complete this request: ${friendlyError(error)}`);
    }
  });
  return bot;
}
