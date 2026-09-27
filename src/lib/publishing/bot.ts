import 'server-only';

import { createSlackAdapter } from '@chat-adapter/slack';
import { createRedisState } from '@chat-adapter/state-redis';
import {
  Actions,
  Card,
  CardText,
  Chat,
  Field,
  Fields,
  LinkButton,
  Plan,
  type Attachment,
} from 'chat';

import { slugify } from '@/lib/utils';

import {
  createGeneratedCover,
  prepareArticle,
  prepareCover,
  type PreparedCover,
} from './article';
import { canManageArticles, getPublishingConfig } from './config';
import { deleteArticle, publishArticle } from './github';
import { draftArticle, researchTopic } from './openai';

const MIN_PROMPT_LENGTH = 20;
const MAX_PROMPT_LENGTH = 4_000;

function cleanPrompt(text: string): string {
  return text.replace(/<@[^>]+>/g, '').replace(/^@[\w.-]+\s*/i, '').trim();
}

function getImageAttachment(attachments: Attachment[]): Attachment | undefined {
  return attachments.find(
    (attachment) => attachment.type === 'image' || attachment.mimeType?.startsWith('image/'),
  );
}

async function readAttachment(attachment: Attachment): Promise<Buffer> {
  if (attachment.fetchData) return Buffer.from(await attachment.fetchData());
  if (Buffer.isBuffer(attachment.data)) return attachment.data;
  if (attachment.data instanceof Blob) return Buffer.from(await attachment.data.arrayBuffer());
  throw new Error('Slack did not make the attached image available to download.');
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

function friendlyError(error: unknown): string {
  if (!(error instanceof Error)) return 'An unexpected error stopped the operation.';
  if (error.message.includes('Missing required environment variable')) {
    return 'The publisher is not fully configured yet. Ask an administrator to check its environment variables.';
  }
  if (error.message.startsWith('GitHub request failed')) {
    return 'GitHub could not update the live content branch. An administrator should check the repository token, branch protection, and server logs.';
  }
  if (/rate limit|quota/i.test(error.message)) {
    return 'The AI service is temporarily rate-limited. Please try again shortly.';
  }
  const safeMessages = [
    /^The cover image /,
    /^The attached file /,
    /^Slack did not /,
    /^The generated /,
    /^An article or cover /,
    /^No published article /,
    /^Use `delete /,
    /^OpenAI did not /,
  ];
  if (safeMessages.some((pattern) => pattern.test(error.message))) return error.message.slice(0, 500);
  return 'An unexpected service error stopped the operation. An administrator can check the server logs.';
}

let bot: Chat | undefined;

export function getPublishingBot(): Chat {
  if (bot) return bot;

  const config = getPublishingConfig();
  bot = new Chat({
    userName: config.botName,
    adapters: {
      slack: createSlackAdapter({
        botToken: config.slackBotToken,
        signingSecret: config.slackSigningSecret,
      }),
    },
    state: createRedisState({ url: config.redisUrl, keyPrefix: 'boerner-publisher' }),
    concurrency: 'drop',
    dedupeTtlMs: 30 * 60 * 1_000,
    logger: 'info',
  });

  bot.onNewMention(async (thread, message) => {
    const activeConfig = getPublishingConfig();
    if (!canManageArticles(activeConfig, thread.channelId, message.author.userId)) {
      await thread.post('You are not authorised to publish or delete articles in this channel.');
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
      const progress = new Plan({ initialMessage: `Deleting “${deleteSlug}” from the website` });
      await thread.post(progress);
      try {
        const result = await deleteArticle({
          slug: deleteSlug,
          requestedBy: message.author.userId,
          config: activeConfig,
        });
        await progress.complete({ completeMessage: 'Article deleted; site deployment can now update' });
        await thread.post(
          Card({
            title: 'Article deleted',
            subtitle: deleteSlug,
            children: [
              CardText('The article and its dedicated cover were removed in one recoverable commit.'),
              Actions([
                LinkButton({ url: result.newsroomUrl, label: 'Open newsroom' }),
                LinkButton({ url: result.commitUrl, label: 'View recovery history' }),
              ]),
            ],
          }),
        );
      } catch (error) {
        console.error('Slack article deletion failed', error);
        await progress.updateTask({ status: 'error', output: friendlyError(error) }).catch(() => undefined);
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

    const progress = new Plan({ initialMessage: 'Researching, writing, and publishing the article' });
    await thread.post(progress);

    try {
      let cover: PreparedCover | undefined;
      const attachment = getImageAttachment(message.attachments);
      if (attachment) {
        await progress.addTask({ title: 'Validate and prepare the attached cover image' });
        cover = await prepareCover(await readAttachment(attachment), attachment.size);
        await progress.updateTask('Prepared a 1600 × 900 JPEG cover.');
      }

      await progress.addTask({ title: 'Research current sources on the web' });
      const research = await researchTopic(request, activeConfig);
      await progress.updateTask(
        `Research complete with ${research.sources.length} source${research.sources.length === 1 ? '' : 's'}.`,
      );

      await progress.addTask({ title: 'Write and validate the MDX article' });
      let generated = await draftArticle({
        request,
        research,
        coverDataUrl: cover?.dataUrl,
        config: activeConfig,
      });

      if (!cover) {
        await progress.addTask({ title: 'Create a branded cover image' });
        cover = await createGeneratedCover(generated);
        generated = {
          ...generated,
          coverAlt: 'Abstract dark editorial illustration with blue market trajectories and geometric nodes.',
        };
        await progress.updateTask('Created a 1600 × 900 branded cover.');
      }

      const article = prepareArticle(generated);
      await progress.addTask({ title: 'Publish directly to the website content branch' });
      const result = await publishArticle({
        article,
        cover,
        requestedBy: message.author.userId,
        config: activeConfig,
      });
      await progress.complete({ completeMessage: 'Article published; site deployment can now update' });

      await thread.post(
        Card({
          title: generated.title,
          subtitle: 'Published automatically',
          children: [
            CardText(generated.description),
            Fields([
              Field({ label: 'Categories', value: generated.categories.join(', ') }),
              Field({ label: 'Research sources', value: String(research.sources.length) }),
              Field({ label: 'Slug', value: article.slug }),
            ]),
            Actions([
              LinkButton({ url: result.articleUrl, label: 'Open article', style: 'primary' }),
              LinkButton({ url: result.commitUrl, label: 'View recovery history' }),
            ]),
          ],
        }),
      );
    } catch (error) {
      console.error('Slack article publisher failed', error);
      await progress.updateTask({ status: 'error', output: friendlyError(error) }).catch(() => undefined);
      await thread.post(`I could not publish this article: ${friendlyError(error)}`);
    }
  });

  return bot;
}
