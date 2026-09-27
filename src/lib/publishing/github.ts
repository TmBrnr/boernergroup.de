import 'server-only';

import { parseFrontmatter } from '@/lib/frontmatter';

import type { PreparedArticle, PreparedCover } from './article';
import type { PublishingConfig } from './config';

type GitRef = { object: { sha: string } };
type GitCommit = { sha: string; tree: { sha: string }; html_url: string };
type GitBlob = { sha: string };
type GitTree = { sha: string };
type ContentFile = { type: 'file'; content: string; encoding: 'base64'; sha: string };

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
): Promise<ContentFile | null> {
  try {
    const result = await github<ContentFile>(
      config,
      `${repoPath(config)}/contents/${encodePath(path)}?ref=${encodeURIComponent(config.githubDefaultBranch)}`,
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
}): Promise<GitCommit> {
  const { config } = input;
  const refPath = `${repoPath(config)}/git/ref/heads/${encodeURIComponent(config.githubDefaultBranch)}`;
  const baseRef = await github<GitRef>(config, refPath);
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
  config: PublishingConfig;
}): Promise<{ articleUrl: string; commitUrl: string }> {
  const { article, config } = input;
  const [existingArticle, existingCover] = await Promise.all([
    getContentFile(config, article.articlePath),
    getContentFile(config, article.coverPath),
  ]);
  if (existingArticle || existingCover) {
    throw new Error(
      `An article or cover with the slug “${article.slug}” already exists. Use a different title or delete the existing article first.`,
    );
  }

  const [articleBlob, coverBlob] = await Promise.all([
    createBlob(config, article.mdx),
    createBlob(config, input.cover.bytes),
  ]);
  const commit = await commitChanges({
    config,
    message: `Publish article: ${article.slug}\n\nRequested from Slack by ${input.requestedBy}`,
    changes: [
      { path: article.articlePath, mode: '100644', type: 'blob', sha: articleBlob },
      { path: article.coverPath, mode: '100644', type: 'blob', sha: coverBlob },
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
  config: PublishingConfig;
}): Promise<{ newsroomUrl: string; commitUrl: string }> {
  const articlePath = `content/articles/${input.slug}.mdx`;
  const articleFile = await getContentFile(input.config, articlePath);
  if (!articleFile) throw new Error(`No published article with the slug “${input.slug}” was found.`);

  const raw = Buffer.from(articleFile.content.replace(/\s/g, ''), 'base64').toString('utf8');
  const { data } = parseFrontmatter<Record<string, unknown>>(raw);
  const cover = typeof data.cover === 'string' ? data.cover : '';
  const coverPath = `public${cover}`;
  const safeCover = /^public\/media\/articles\/[a-z0-9-]+\.jpg$/.test(coverPath);
  const coverFile = safeCover ? await getContentFile(input.config, coverPath) : null;

  const changes: TreeChange[] = [
    { path: articlePath, mode: '100644', type: 'blob', sha: null },
  ];
  if (coverFile) changes.push({ path: coverPath, mode: '100644', type: 'blob', sha: null });

  const commit = await commitChanges({
    config: input.config,
    message: `Delete article: ${input.slug}\n\nRequested from Slack by ${input.requestedBy}`,
    changes,
  });

  return { newsroomUrl: `${input.config.siteUrl}/newsroom`, commitUrl: commit.html_url };
}
