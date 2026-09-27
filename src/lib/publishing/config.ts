import 'server-only';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const csv = (name: string): Set<string> =>
  new Set(
    (process.env[name] ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );

const redisUrl = (): string => {
  const direct = process.env.REDIS_URL?.trim();
  if (direct) return direct;

  const marketplace = Object.entries(process.env).find(
    ([name, value]) => name.endsWith('_REDIS_URL') && value?.trim(),
  )?.[1]?.trim();
  if (marketplace) return marketplace;

  throw new Error('Missing required environment variable: REDIS_URL');
};

export type OpenAiReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

const reasoningEffort = (value: string | undefined): OpenAiReasoningEffort => {
  const candidate = value?.trim() || 'high';
  const allowed: OpenAiReasoningEffort[] = ['none', 'low', 'medium', 'high', 'xhigh', 'max'];

  if (!allowed.includes(candidate as OpenAiReasoningEffort)) {
    throw new Error(
      `OPENAI_REASONING_EFFORT must be one of: ${allowed.join(', ')}`,
    );
  }

  return candidate as OpenAiReasoningEffort;
};

export type PublishingConfig = {
  openAiApiKey: string;
  openAiModel: string;
  openAiReasoningEffort: OpenAiReasoningEffort;
  slackBotToken: string;
  slackSigningSecret: string;
  redisUrl: string;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubDefaultBranch: string;
  siteUrl: string;
  botName: string;
  allowedChannelIds: Set<string>;
  publisherUserIds: Set<string>;
};

let cached: PublishingConfig | undefined;

export function getPublishingConfig(): PublishingConfig {
  if (cached) return cached;

  const repository = required('GITHUB_REPOSITORY');
  const [githubOwner, githubRepo, ...extra] = repository.split('/');
  if (!githubOwner || !githubRepo || extra.length) {
    throw new Error('GITHUB_REPOSITORY must use the owner/repository format');
  }

  cached = {
    openAiApiKey: required('OPENAI_API_KEY'),
    openAiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-6-luna',
    openAiReasoningEffort: reasoningEffort(process.env.OPENAI_REASONING_EFFORT),
    slackBotToken: required('SLACK_BOT_TOKEN'),
    slackSigningSecret: required('SLACK_SIGNING_SECRET'),
    redisUrl: redisUrl(),
    githubToken: required('GITHUB_TOKEN'),
    githubOwner,
    githubRepo,
    githubDefaultBranch: process.env.GITHUB_DEFAULT_BRANCH?.trim() || 'main',
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://boernergroup.de').replace(/\/$/, ''),
    botName: process.env.PUBLISHER_BOT_NAME?.trim() || 'Boerner Publisher',
    allowedChannelIds: csv('SLACK_ALLOWED_CHANNEL_IDS'),
    publisherUserIds: csv('SLACK_PUBLISHER_USER_IDS'),
  };

  return cached;
}

function isAllowed(id: string, allowlist: Set<string>): boolean {
  return allowlist.size === 0 || allowlist.has(id);
}

export function canManageArticles(
  config: PublishingConfig,
  channelId: string,
  userId: string,
): boolean {
  return (
    isAllowed(channelId.replace(/^slack:/, ''), config.allowedChannelIds) &&
    config.publisherUserIds.size > 0 &&
    config.publisherUserIds.has(userId)
  );
}
