import 'server-only';
import { send } from '@vercel/queue';
export const PUBLISHING_QUEUE_TOPIC = 'boerner-publishing-jobs-v1';
export async function enqueueJob<T extends { stage: string; context: { jobId: string }; responseId?: string; pollCount?: number; step?: number }>(job: T, delaySeconds = 0): Promise<void> {
  const key = `${job.context.jobId}:${job.stage}${job.responseId ? `:${job.responseId}` : ''}${job.pollCount !== undefined ? `:${job.pollCount}` : ''}${job.step !== undefined ? `:${job.step}` : ''}`;
  await send(PUBLISHING_QUEUE_TOPIC, job, { delaySeconds, idempotencyKey: key, retentionSeconds: 60 * 60 });
}
