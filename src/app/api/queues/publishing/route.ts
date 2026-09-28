import { handleCallback } from '@vercel/queue';

import { processPublishingJob } from '@/lib/publishing/jobs';

export const runtime = 'nodejs';
export const maxDuration = 60;

const queueHandler = handleCallback(processPublishingJob, {
  visibilityTimeoutSeconds: 60,
  // Propagate failures as HTTP 500 so the platform triggers durable redelivery.
});

export function POST(request: Request): Promise<Response> {
  return queueHandler(request);
}
