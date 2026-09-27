import 'server-only';

import { createSlackAdapter } from '@chat-adapter/slack';
import { createRedisState } from '@chat-adapter/state-redis';
import { Chat } from 'chat';

import { getPublishingConfig } from './config';

let chat: Chat | undefined;

export function getPublishingChat(): Chat {
  if (chat) return chat;

  const config = getPublishingConfig();
  chat = new Chat({
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

  return chat;
}
