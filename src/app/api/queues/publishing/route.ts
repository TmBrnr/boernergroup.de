import { handleCallback } from '@vercel/queue';

import { processPublishingJob } from '@/lib/publishing/jobs';

export const runtime = 'nodejs';
export const maxDuration = 60;

const queueHandler = handleCallback(processPublishingJob, {
  visibilityTimeoutSeconds: 60,
  retry: (_error, metadata) => ({
    afterSeconds: Math.min(60, 5 * 2 ** Math.max(0, metadata.deliveryCount - 1)),
  }),
});

export function POST(request: Request): Promise<Response> {
  return queueHandler(request);
}
