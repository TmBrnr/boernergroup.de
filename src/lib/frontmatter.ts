import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const FRONTMATTER = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/;

export function parseFrontmatter<T extends Record<string, unknown>>(
  raw: string,
): { data: T; content: string } {
  const match = FRONTMATTER.exec(raw);
  if (!match) throw new Error('Content file is missing valid YAML frontmatter.');

  const parsed = parseYaml(match[1]);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Content frontmatter must be a YAML object.');
  }

  return { data: parsed as T, content: match[2] };
}

export function stringifyFrontmatter(
  content: string,
  data: Record<string, unknown>,
): string {
  const yaml = stringifyYaml(data, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n\n${content.replace(/^\s+/, '')}`;
}
