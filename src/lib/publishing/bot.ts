import 'server-only';

import {
  Card,
  CardText,
  Field,
  Fields,
  type Chat,
  type Message,
} from 'chat';
import { createHash } from 'node:crypto';

import { slugify } from '@/lib/utils';

import { getPublishingChat } from './chat';
import { canManageArticles, getPublishingConfig } from './config';
import { friendlyError } from './errors';
import {
  enqueueDeletionJob,
  enqueuePublishingJob,
  type QueuedCover,
} from './jobs';

const MIN_PROMPT_LENGTH = 20;
const MAX_PROMPT_LENGTH = 4_000;

function cleanPrompt(text: string): string {
  return text.replace(/<@[^>]+>/g, '').replace(/^@[\w.-]+\s*/i, '').trim();
}

function getQueuedCover(message: Message): QueuedCover | undefined {
  const attachment = message
    .toJSON()
    .attachments.find(
      (candidate) => candidate.type === 'image' || candidate.mimeType?.startsWith('image/'),
    );
  return attachment;
}

function parseDeleteSlug(prompt: string): string | null {
  const match = /^(?:delete|remove)\s+(?:(?:the\s+)?(?:article|post)\s+)?(.+)$/i.exec(prompt);
  if (!match) return null;

  let target = match[1].trim().replace(/^['"]|['"]$/g, '');
  try {
    const url = new URL(target);
    const segments = url.pathname.split('/').filter(Boolean);
    const newsroomIndex = segments.lastIndexOf('newsroom');
    target = newsroomIndex >= 0 ? (segments[newsroomIndex + 1] ?? '') : (segments.at(-1) ?? '');
  } catch {
    target = target.replace(/^\/?newsroom\//i, '').replace(/[?#].*$/, '');
  }

  const slug = slugify(target);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Use `delete <article-slug>` or paste the full newsroom article URL.');
  }
  return slug;
}

function publishingRequest(prompt: string): string {
  return prompt.replace(/^publish\s+(?:(?:an?\s+)?(?:article|post)\s+)?/i, '').trim();
}

let handlersRegistered = false;

export function getPublishingBot(): Chat {
  const bot = getPublishingChat();
  if (handlersRegistered) return bot;
  handlersRegistered = true;

  bot.onNewMention(async (thread, message) => {
    const activeConfig = getPublishingConfig();
    if (!canManageArticles(activeConfig, message.author.userId)) {
      await thread.post('You are not authorised to publish or delete articles.');
      return;
    }

    const prompt = cleanPrompt(message.text);
    if (/^(?:help|commands?)$/i.test(prompt)) {
      await thread.post(
        Card({
          title: 'Article publisher commands',
          children: [
            CardText(
              'Tag me with an article brief to research, write, create a cover, and publish it automatically.',
            ),
            Fields([
              Field({ label: 'Publish', value: '@Boerner Publisher Write an article about…' }),
              Field({ label: 'Delete', value: '@Boerner Publisher delete article-slug' }),
            ]),
          ],
        }),
      );
      return;
    }

    let deleteSlug: string | null;
    try {
      deleteSlug = parseDeleteSlug(prompt);
    } catch (error) {
      await thread.post(friendlyError(error));
      return;
    }

    if (deleteSlug) {
      try {
        const jobId = createHash('sha256').update(message.id).digest('hex').slice(0, 32);
        await enqueueDeletionJob({
          context: {
            jobId,
            threadId: thread.id,
            requestedBy: message.author.userId,
          },
          slug: deleteSlug,
        });
        await thread.post(`Queued deletion of “${deleteSlug}”. I will reply here when it is complete.`);
      } catch (error) {
        console.error('Could not queue Slack article deletion', error);
        await thread.post(`I could not delete that article: ${friendlyError(error)}`);
      }
      return;
    }

    const request = publishingRequest(prompt);
    if (request.length < MIN_PROMPT_LENGTH || request.length > MAX_PROMPT_LENGTH) {
      await thread.post(
        `Tag me with a clear article brief between ${MIN_PROMPT_LENGTH} and ${MAX_PROMPT_LENGTH.toLocaleString()} characters. You may attach one cover image, or I will create a branded cover automatically.`,
      );
      return;
    }

    try {
      const jobId = createHash('sha256').update(message.id).digest('hex').slice(0, 32);
      await enqueuePublishingJob({
        context: {
          jobId,
          threadId: thread.id,
          requestedBy: message.author.userId,
        },
        request,
        cover: getQueuedCover(message),
      });
      await thread.post(
        'Queued. I am researching current sources, writing the article, and will publish it automatically. I will reply here when it is live.',
      );
    } catch (error) {
      console.error('Could not queue Slack article publisher', error);
      await thread.post(`I could not publish this article: ${friendlyError(error)}`);
    }
  });

  return bot;
}
