import { after } from 'next/server';

import { getPublishingBot } from '@/lib/publishing/bot';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  return getPublishingBot().webhooks.slack(request, {
    waitUntil: (task) => after(() => task),
    propagateHandlerErrors: true,
  });
}
