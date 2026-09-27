import 'server-only';

import { send, type MessageMetadata } from '@vercel/queue';
import {
  Actions,
  Card,
  CardText,
  Field,
  Fields,
  LinkButton,
  type Attachment,
} from 'chat';
import { z } from 'zod';

import {
  createGeneratedCover,
  prepareArticle,
  prepareCover,
  type PreparedCover,
} from './article';
import { getPublishingChat } from './chat';
import { getPublishingConfig } from './config';
import { friendlyError } from './errors';
import { deleteArticle, publishArticle } from './github';
import {
  pollDraftArticle,
  pollResearchTopic,
  startDraftArticle,
  startResearchTopic,
} from './openai';

export const PUBLISHING_QUEUE_TOPIC = 'boerner-publishing-jobs-v1';

const QUEUE_RETENTION_SECONDS = 60 * 60;
const POLL_DELAY_SECONDS = 10;
const MAX_POLL_COUNT = 54;

const contextSchema = z.object({
  jobId: z.string().min(1).max(128),
  threadId: z.string().min(1).max(256),
  requestedBy: z.string().min(1).max(128),
});

const attachmentSchema = z.object({
  type: z.enum(['image', 'file', 'video', 'audio']),
  url: z.string().optional(),
  name: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fetchMetadata: z.record(z.string(), z.string()).optional(),
});

const researchSchema = z.object({
  brief: z.string(),
  sources: z.array(z.string()),
});

const publishingJobSchema = z.discriminatedUnion('stage', [
  z.object({
    stage: z.literal('publish-start'),
    context: contextSchema,
    request: z.string().min(1).max(4_000),
    cover: attachmentSchema.optional(),
  }),
  z.object({
    stage: z.literal('research-poll'),
    context: contextSchema,
    request: z.string().min(1).max(4_000),
    cover: attachmentSchema.optional(),
    responseId: z.string().min(1),
    pollCount: z.number().int().nonnegative(),
  }),
  z.object({
    stage: z.literal('draft-poll'),
    context: contextSchema,
    request: z.string().min(1).max(4_000),
    cover: attachmentSchema.optional(),
    research: researchSchema,
    responseId: z.string().min(1),
    pollCount: z.number().int().nonnegative(),
  }),
  z.object({
    stage: z.literal('delete'),
    context: contextSchema,
    slug: z.string().regex(/^[a-z0-9-]+$/),
  }),
]);

export type PublishingJob = z.infer<typeof publishingJobSchema>;
export type QueuedCover = z.infer<typeof attachmentSchema>;
export type PublishingJobContext = z.infer<typeof contextSchema>;

function queueKey(job: PublishingJob): string {
  if (job.stage === 'publish-start' || job.stage === 'delete') {
    return `${job.context.jobId}:${job.stage}`;
  }
  return `${job.context.jobId}:${job.stage}:${job.responseId}:${job.pollCount}`;
}

async function enqueue(job: PublishingJob, delaySeconds = 0): Promise<void> {
  await send(PUBLISHING_QUEUE_TOPIC, job, {
    delaySeconds,
    idempotencyKey: queueKey(job),
    retentionSeconds: QUEUE_RETENTION_SECONDS,
  });
}

export async function enqueuePublishingJob(input: {
  context: PublishingJobContext;
  request: string;
  cover?: QueuedCover;
}): Promise<void> {
  await enqueue({ stage: 'publish-start', ...input });
}

export async function enqueueDeletionJob(input: {
  context: PublishingJobContext;
  slug: string;
}): Promise<void> {
  await enqueue({ stage: 'delete', ...input });
}

async function readQueuedCover(cover: QueuedCover, threadId: string): Promise<PreparedCover> {
  const thread = getPublishingChat().thread(threadId);
  const attachment = (thread.adapter.rehydrateAttachment?.(cover as Attachment) ?? cover) as Attachment;

  let bytes: Buffer;
  if (attachment.fetchData) {
    bytes = Buffer.from(await attachment.fetchData());
  } else if (Buffer.isBuffer(attachment.data)) {
    bytes = attachment.data;
  } else if (attachment.data instanceof Blob) {
    bytes = Buffer.from(await attachment.data.arrayBuffer());
  } else {
    throw new Error('Slack did not make the attached image available to download.');
  }

  return prepareCover(bytes, attachment.size);
}

async function processJob(job: PublishingJob): Promise<void> {
  const config = getPublishingConfig();
  const thread = getPublishingChat().thread(job.context.threadId);

  if (job.stage === 'delete') {
    const result = await deleteArticle({
      slug: job.slug,
      requestedBy: job.context.requestedBy,
      operationId: job.context.jobId,
      config,
    });
    await thread.post(
      Card({
        title: 'Article deleted',
        subtitle: job.slug,
        children: [
          CardText('The article and its dedicated cover were removed in one recoverable commit.'),
          Actions([
            LinkButton({ url: result.newsroomUrl, label: 'Open newsroom' }),
            LinkButton({ url: result.commitUrl, label: 'View recovery history' }),
          ]),
        ],
      }),
    );
    return;
  }

  if (job.stage === 'publish-start') {
    const response = await startResearchTopic(job.request, config, job.context.jobId);
    await enqueue(
      {
        stage: 'research-poll',
        context: job.context,
        request: job.request,
        cover: job.cover,
        responseId: response.id,
        pollCount: 0,
      },
      POLL_DELAY_SECONDS,
    );
    return;
  }

  if (job.pollCount >= MAX_POLL_COUNT) {
    throw new Error('OpenAI did not finish the background response before the publishing deadline.');
  }

  if (job.stage === 'research-poll') {
    const research = await pollResearchTopic(job.responseId, config);
    if (!research) {
      await enqueue(
        { ...job, pollCount: job.pollCount + 1 },
        POLL_DELAY_SECONDS,
      );
      return;
    }

    await thread.post(
      `Research complete with ${research.sources.length} source${research.sources.length === 1 ? '' : 's'}. Writing the article now.`,
    );
    const preparedCover = job.cover
      ? await readQueuedCover(job.cover, job.context.threadId)
      : undefined;
    const response = await startDraftArticle({
      request: job.request,
      research,
      coverDataUrl: preparedCover?.dataUrl,
      config,
      idempotencyKey: job.context.jobId,
    });
    await enqueue(
      {
        stage: 'draft-poll',
        context: job.context,
        request: job.request,
        cover: job.cover,
        research,
        responseId: response.id,
        pollCount: 0,
      },
      POLL_DELAY_SECONDS,
    );
    return;
  }

  const generated = await pollDraftArticle(job.responseId, config);
  if (!generated) {
    await enqueue(
      { ...job, pollCount: job.pollCount + 1 },
      POLL_DELAY_SECONDS,
    );
    return;
  }

  const cover = job.cover
    ? await readQueuedCover(job.cover, job.context.threadId)
    : await createGeneratedCover(generated);
  const article = prepareArticle(
    job.cover
      ? generated
      : {
          ...generated,
          coverAlt: 'Abstract dark editorial illustration with blue market trajectories and geometric nodes.',
        },
  );
  const result = await publishArticle({
    article,
    cover,
    requestedBy: job.context.requestedBy,
    operationId: job.context.jobId,
    config,
  });

  await thread.post(
    Card({
      title: generated.title,
      subtitle: 'Published automatically',
      children: [
        CardText(generated.description),
        Fields([
          Field({ label: 'Categories', value: generated.categories.join(', ') }),
          Field({ label: 'Research sources', value: String(job.research.sources.length) }),
          Field({ label: 'Slug', value: article.slug }),
        ]),
        Actions([
          LinkButton({ url: result.articleUrl, label: 'Open article', style: 'primary' }),
          LinkButton({ url: result.commitUrl, label: 'View recovery history' }),
        ]),
      ],
    }),
  );
}

export async function processPublishingJob(
  payload: unknown,
  metadata: MessageMetadata,
): Promise<void> {
  const parsed = publishingJobSchema.safeParse(payload);
  if (!parsed.success) {
    console.error('Discarding invalid publishing queue payload', parsed.error.flatten());
    return;
  }

  try {
    await processJob(parsed.data);
  } catch (error) {
    console.error('Publishing queue job failed', {
      jobId: parsed.data.context.jobId,
      stage: parsed.data.stage,
      deliveryCount: metadata.deliveryCount,
      error,
    });

    if (metadata.deliveryCount < 3) throw error;

    const action = parsed.data.stage === 'delete' ? 'delete that article' : 'publish this article';
    await getPublishingChat()
      .thread(parsed.data.context.threadId)
      .post(`I could not ${action}: ${friendlyError(error)}`)
      .catch((postError) => console.error('Could not report publishing queue failure to Slack', postError));
  }
}
