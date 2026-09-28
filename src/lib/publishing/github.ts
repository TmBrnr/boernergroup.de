import 'server-only';

import { parseFrontmatter } from '@/lib/frontmatter';

import type { PreparedArticle, PreparedCover } from './article';
import type { PublishingConfig } from './config';

type GitRef = { object: { sha: string } };
type GitCommit = { sha: string; tree: { sha: string }; html_url: string };
type GitBlob = { sha: string };
type GitTree = { sha: string };
type ContentFile = { type: 'file'; content: string; encoding: 'base64'; sha: string };
type GitHubListCommit = { html_url: string; commit: { message: string } };

class GitHubRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

function repoPath(config: PublishingConfig): string {
  return `/repos/${encodeURIComponent(config.githubOwner)}/${encodeURIComponent(config.githubRepo)}`;
}

async function github<T>(
  config: PublishingConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'boernergroup-slack-publisher',
      'X-GitHub-Api-Version': '2022-11-28',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const details = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new GitHubRequestError(
      response.status,
      `GitHub request failed (${response.status}): ${details?.message ?? response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

async function getContentFile(
  config: PublishingConfig,
  path: string,
  ref = config.githubDefaultBranch,
): Promise<ContentFile | null> {
  try {
    const result = await github<ContentFile>(
      config,
      `${repoPath(config)}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`,
    );
    if (result.type !== 'file' || result.encoding !== 'base64') {
      throw new Error('GitHub returned an unsupported content object.');
    }
    return result;
  } catch (error) {
    if (error instanceof GitHubRequestError && error.status === 404) return null;
    throw error;
  }
}

async function findOperationCommit(
  config: PublishingConfig,
  operationId: string | undefined,
): Promise<GitHubListCommit | null> {
  if (!operationId) return null;
  const commits = await github<GitHubListCommit[]>(
    config,
    `${repoPath(config)}/commits?sha=${encodeURIComponent(config.githubDefaultBranch)}&per_page=30`,
  );
  const marker = `Publisher operation: ${operationId}`;
  return commits.find((commit) => commit.commit.message.includes(marker)) ?? null;
}

async function createBlob(
  config: PublishingConfig,
  content: Buffer | string,
): Promise<string> {
  const bytes = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
  const blob = await github<GitBlob>(config, `${repoPath(config)}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content: bytes.toString('base64'), encoding: 'base64' }),
  });
  return blob.sha;
}

type TreeChange = {
  path: string;
  mode: '100644';
  type: 'blob';
  sha: string | null;
};

async function commitChanges(input: {
  config: PublishingConfig;
  message: string;
  changes: TreeChange[];
  expected: { path: string; sha: string | null }[];
}): Promise<GitCommit> {
  const { config } = input;
  const refPath = `${repoPath(config)}/git/ref/heads/${encodeURIComponent(config.githubDefaultBranch)}`;
  const baseRef = await github<GitRef>(config, refPath);
  // Preconditions and the new tree use the same immutable branch snapshot.
  for (const expected of input.expected) {
    const file = await getContentFile(config, expected.path, baseRef.object.sha);
    if ((file?.sha ?? null) !== expected.sha) {
      throw new Error('The article changed since this preview. Create a new preview before confirming.');
    }
  }
  const baseCommit = await github<GitCommit>(
    config,
    `${repoPath(config)}/git/commits/${baseRef.object.sha}`,
  );
  const tree = await github<GitTree>(config, `${repoPath(config)}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: input.changes }),
  });
  const commit = await github<GitCommit>(config, `${repoPath(config)}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: input.message,
      tree: tree.sha,
      parents: [baseRef.object.sha],
    }),
  });
  await github<GitRef>(
    config,
    `${repoPath(config)}/git/refs/heads/${encodeURIComponent(config.githubDefaultBranch)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha, force: false }),
    },
  );
  return commit;
}

export async function publishArticle(input: {
  article: PreparedArticle;
  cover: PreparedCover;
  requestedBy: string;
  approvedBy?: string;
  operationId?: string;
  config: PublishingConfig;
  originalSha?: string;
}): Promise<{ articleUrl: string; commitUrl: string }> {
  const { article, config } = input;
  const previous = await findOperationCommit(config, input.operationId);
  if (previous) return { articleUrl: `${config.siteUrl}/newsroom/${article.slug}`, commitUrl: previous.html_url };
  const [existingArticle, existingCover] = await Promise.all([
    getContentFile(config, article.articlePath),
    getContentFile(config, article.coverPath),
  ]);
  if (!input.originalSha && (existingArticle || existingCover)) {
    throw new Error(
      `An article or cover with the slug “${article.slug}” already exists. Use the update command for the existing article or choose a different title.`,
    );
  }

  if (input.originalSha && existingArticle?.sha !== input.originalSha) {
    throw new Error('The article changed since this preview. Create a new preview before confirming.');
  }

  const oldCover = existingArticle && input.originalSha
    ? parseFrontmatter<Record<string, unknown>>(Buffer.from(existingArticle.content.replace(/\s/g, ''), 'base64').toString('utf8')).data.cover
    : undefined;
  const oldCoverPath = typeof oldCover === 'string' ? `public${oldCover}` : '';
  const dedicatedOldCover = new RegExp(`^public/media/articles/${article.slug}(?:-[a-f0-9]{8})?\\.jpg$`).test(oldCoverPath);
  const oldCoverFile = dedicatedOldCover && oldCoverPath !== article.coverPath ? await getContentFile(config, oldCoverPath) : null;
  const [articleBlob, coverBlob] = await Promise.all([
    createBlob(config, article.mdx),
    createBlob(config, input.cover.bytes),
  ]);
  const commit = await commitChanges({
    config,
    message: [
      `${input.originalSha ? 'Update' : 'Publish'} article: ${article.slug}`,
      `Requested from Slack by ${input.requestedBy}`,
      input.approvedBy ? `Approved in Slack by ${input.approvedBy}` : '',
      input.operationId ? `Publisher operation: ${input.operationId}` : '',
    ].filter(Boolean).join('\n\n'),
    expected: [
      { path: article.articlePath, sha: input.originalSha ?? null },
      { path: article.coverPath, sha: existingCover?.sha ?? null },
      ...(oldCoverFile ? [{ path: oldCoverPath, sha: oldCoverFile.sha }] : []),
    ],
    changes: [
      { path: article.articlePath, mode: '100644', type: 'blob', sha: articleBlob },
      { path: article.coverPath, mode: '100644', type: 'blob', sha: coverBlob },
      ...(oldCoverFile ? [{ path: oldCoverPath, mode: '100644' as const, type: 'blob' as const, sha: null }] : []),
    ],
  });

  return {
    articleUrl: `${config.siteUrl}/newsroom/${article.slug}`,
    commitUrl: commit.html_url,
  };
}

export async function deleteArticle(input: {
  slug: string;
  requestedBy: string;
  approvedBy?: string;
  operationId?: string;
  config: PublishingConfig;
  originalSha: string;
}): Promise<{ newsroomUrl: string; commitUrl: string }> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) throw new Error('Invalid article slug.');
  const articlePath = `content/articles/${input.slug}.mdx`;
  const previous = await findOperationCommit(input.config, input.operationId);
  if (previous) return { newsroomUrl: `${input.config.siteUrl}/newsroom`, commitUrl: previous.html_url };
  const articleFile = await getContentFile(input.config, articlePath);
  if (!articleFile) {
    throw new Error(`No published article with the slug “${input.slug}” was found.`);
  }

  if (articleFile.sha !== input.originalSha) {
    throw new Error('The article changed since this preview. Create a new preview before confirming.');
  }
  const raw = Buffer.from(articleFile.content.replace(/\s/g, ''), 'base64').toString('utf8');
  const { data } = parseFrontmatter<Record<string, unknown>>(raw);
  const cover = typeof data.cover === 'string' ? data.cover : '';
  const coverPath = `public${cover}`;
  const safeCover = new RegExp(`^public/media/articles/${input.slug}(?:-[a-f0-9]{8})?\\.jpg$`).test(coverPath);
  const coverFile = safeCover ? await getContentFile(input.config, coverPath) : null;

  const changes: TreeChange[] = [
    { path: articlePath, mode: '100644', type: 'blob', sha: null },
  ];
  if (coverFile) changes.push({ path: coverPath, mode: '100644', type: 'blob', sha: null });

  const commit = await commitChanges({
    config: input.config,
    message: [
      `Delete article: ${input.slug}`,
      `Requested from Slack by ${input.requestedBy}`,
      input.approvedBy ? `Approved in Slack by ${input.approvedBy}` : '',
      input.operationId ? `Publisher operation: ${input.operationId}` : '',
    ].filter(Boolean).join('\n\n'),
    changes,
    expected: [
      { path: articlePath, sha: input.originalSha },
      ...(coverFile ? [{ path: coverPath, sha: coverFile.sha }] : []),
    ],
  });

  return { newsroomUrl: `${input.config.siteUrl}/newsroom`, commitUrl: commit.html_url };
}

export async function readPublishedArticle(slug: string, config: PublishingConfig) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid article slug.');
  const file = await getContentFile(config, `content/articles/${slug}.mdx`);
  if (!file) throw new Error(`No published article with the slug “${slug}” was found.`);
  const raw = Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8');
  const parsed = parseFrontmatter<Record<string, unknown>>(raw);
  return { sha: file.sha, raw, ...parsed };
}

export async function listPublishedArticles(config: PublishingConfig): Promise<{ slug: string }[]> {
  const entries = await github<{ name: string; type: string }[]>(config,
    `${repoPath(config)}/contents/content/articles?ref=${encodeURIComponent(config.githubDefaultBranch)}`);
  return entries.filter((entry) => entry.type === 'file' && entry.name.endsWith('.mdx'))
    .slice(0, 100).map((entry) => ({ slug: entry.name.slice(0, -4) }));
}

export async function readPublishedCover(cover: unknown, config: PublishingConfig): Promise<Buffer | null> {
  if (typeof cover !== 'string' || !/^\/media\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/i.test(cover)) return null;
  const file = await getContentFile(config, `public${cover}`);
  return file ? Buffer.from(file.content.replace(/\s/g, ''), 'base64') : null;
}
