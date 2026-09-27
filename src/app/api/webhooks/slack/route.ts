import { after } from 'next/server';

import { getPublishingBot } from '@/lib/publishing/bot';

export const runtime = 'nodejs';
// Vercel Hobby accepts at most 60 seconds. Longer article jobs need a Pro
// function duration or a queued worker before the production bot is enabled.
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  return getPublishingBot().webhooks.slack(request, {
    waitUntil: (task) => after(() => task),
    propagateHandlerErrors: true,
  });
}
