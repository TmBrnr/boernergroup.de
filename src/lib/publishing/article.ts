import sharp from 'sharp';
import { z } from 'zod';

import { getArticles } from '@/lib/articles';
import { parseFrontmatter, stringifyFrontmatter } from '@/lib/frontmatter';
import { slugify } from '@/lib/utils';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const articleDraftSchema = z.object({
  title: z.string().min(10).max(120),
  description: z.string().min(40).max(320),
  categories: z.array(z.string().min(2).max(40)).min(1).max(5),
  coverAlt: z.string().min(10).max(220),
  body: z.string().min(500).max(30_000),
});

export type ArticleDraft = z.infer<typeof articleDraftSchema>;

export type PreparedCover = {
  bytes: Buffer;
  dataUrl: string;
  width: 1600;
  height: 900;
};

export type PreparedArticle = {
  slug: string;
  articlePath: string;
  coverPath: string;
  mdx: string;
};

export function getEditorialStyleContext(): string {
  const samples = getArticles()
    .slice(0, 3)
    .map(
      (article, index) =>
        `SAMPLE ${index + 1}\nTitle: ${article.title}\nDescription: ${article.description}\nCategories: ${article.categories.join(', ')}\n\n${article.body.slice(0, 3_500)}`,
    );

  return samples.length
    ? samples.join('\n\n---\n\n')
    : 'No published examples are available. Use a precise, restrained editorial voice.';
}

export async function prepareCover(input: Buffer, declaredSize?: number): Promise<PreparedCover> {
  if (declaredSize && declaredSize > MAX_IMAGE_BYTES) {
    throw new Error('The cover image is larger than 10 MB.');
  }
  if (input.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('The cover image is larger than 10 MB.');
  }

  try {
    const bytes = await sharp(input)
      .rotate()
      .resize(1600, 900, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();

    return {
      bytes,
      dataUrl: `data:image/jpeg;base64,${bytes.toString('base64')}`,
      width: 1600,
      height: 900,
    };
  } catch {
    throw new Error('The attached file could not be decoded as an image.');
  }
}

function seededRandom(value: string): () => number {
  let state = 2166136261;
  for (const character of value) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function coverTheme(draft: ArticleDraft): 'sovereignty' | 'ai' | 'business' {
  const topic = `${draft.title} ${draft.categories.join(' ')}`.toLowerCase();
  return /sovereign|souver|europe|europa|control|security/.test(topic) ? 'sovereignty'
    : /ai|intelligence|model|technology|technologie/.test(topic) ? 'ai' : 'business';
}

export function generatedCoverAlt(draft: ArticleDraft): string {
  const theme = coverTheme(draft);
  return theme === 'sovereignty' ? 'Abstract editorial illustration of concentric boundaries and connected nodes on a dark background.'
    : theme === 'ai' ? 'Abstract editorial illustration of layered computational grids on a dark background.'
    : 'Abstract editorial illustration of rising geometric columns and connecting trajectories on a dark background.';
}

export async function createGeneratedCover(draft: ArticleDraft): Promise<PreparedCover> {
  const random = seededRandom(`${draft.title}|${draft.description}|${draft.categories.join('|')}|${draft.body.slice(0, 600)}`);
  const theme = coverTheme(draft);
  const colors = ['#4f7cff', '#4bada0', '#b594d9', '#bc9463', '#729bca'];
  const accent = colors[Math.floor(random() * colors.length)];
  const centerX = 650 + Math.round(random() * 400);
  const centerY = 340 + Math.round(random() * 200);
  const rotation = Math.round(random() * 80 - 40);
  let shapes: string;
  if (theme === 'sovereignty') {
    shapes = Array.from({ length: 7 }, (_, i) => {
      const radius = 65 + i * (30 + random() * 25);
      const angle = random() * Math.PI * 2;
      const x = Math.round(centerX + Math.cos(angle) * radius);
      const y = Math.round(centerY + Math.sin(angle) * radius);
      return `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${accent}" stroke-opacity="${0.2 + i * 0.09}" stroke-width="${i % 3 === 0 ? 3 : 1}"/><path d="M ${centerX} ${centerY} L ${x} ${y}" stroke="${accent}" opacity="0.4"/><circle cx="${x}" cy="${y}" r="${5 + random() * 9}" fill="${accent}"/>`;
    }).join('');
  } else if (theme === 'ai') {
    shapes = Array.from({ length: 6 }, (_, i) => {
      const x = 300 + i * 95 + random() * 80;
      const y = 160 + i * 55;
      const cells = Array.from({ length: 6 }, (_, j) => `<path d="M ${x + j * 65} ${y} v 330 M ${x} ${y + j * 55} h 390" stroke="${accent}" stroke-opacity="${0.15 + random() * 0.35}"/>`).join('');
      return `<rect x="${x}" y="${y}" width="390" height="330" fill="#101720" fill-opacity="0.25" stroke="${accent}" stroke-opacity="0.65"/>${cells}`;
    }).join('');
  } else {
    shapes = Array.from({ length: 10 }, (_, i) => {
      const height = 70 + random() * 340 + i * 20;
      return `<rect x="${220 + i * 115}" y="${720 - height}" width="${40 + random() * 40}" height="${height}" rx="4" fill="${accent}" fill-opacity="${0.15 + random() * 0.5}"/><circle cx="${245 + i * 115}" cy="${700 - height}" r="6" fill="${accent}"/>`;
    }).join('');
  }
  const svg = `<svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="glow" cx="${centerX / 16}%" cy="${centerY / 9}%" r="65%"><stop stop-color="${accent}" stop-opacity="0.22"/><stop offset="1" stop-color="#0d1015" stop-opacity="0"/></radialGradient></defs>
    <rect width="1600" height="900" fill="#0d1015"/><rect width="1600" height="900" fill="url(#glow)"/>
    <g transform="rotate(${rotation} 800 450)">${shapes}</g>
    <path d="M 100 800 H 1500 M 100 100 V 800" stroke="#dce2e8" stroke-opacity="0.12"/>
  </svg>`;
  const bytes = await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  return { bytes, dataUrl: `data:image/jpeg;base64,${bytes.toString('base64')}`, width: 1600, height: 900 };
}

function validateMdx(body: string): string {
  const trimmed = body.trim();
  const forbidden = [
    /^\s*(?:import|export)\s/m,
    /<\s*(?:script|iframe|object|embed)\b/i,
    /javascript\s*:/i,
    /\son\w+\s*=/i,
    /[{}]/,
  ];

  const unsupportedTag = [...trimmed.matchAll(/<\/?([A-Za-z][\w-]*)([^>]*)>/g)]
    .some((match) => match[1] !== 'Aside' || match[2].trim() !== '');
  if (unsupportedTag || forbidden.some((pattern) => pattern.test(trimmed))) {
    throw new Error('The generated article contained unsafe MDX and was not committed.');
  }

  return trimmed;
}

export function prepareArticle(draft: ArticleDraft, options: {
  slug?: string;
  originalRaw?: string;
  operationId?: string;
} = {}): PreparedArticle {
  articleDraftSchema.parse(draft);
  const slug = options.slug ?? slugify(draft.title);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('The generated title did not produce a valid URL slug.');

  const revision = options.originalRaw && options.operationId ? `-${options.operationId.slice(0, 8)}` : '';
  const coverPath = `/media/articles/${slug}${revision}.jpg`;
  const original = options.originalRaw ? parseFrontmatter<Record<string, unknown>>(options.originalRaw).data : {};
  const data = {
    ...original,
    title: draft.title.trim(),
    description: draft.description.trim(),
    date: original.date ?? new Date().toISOString().slice(0, 10),
    ...(options.originalRaw ? { updated: new Date().toISOString().slice(0, 10) } : {}),
    ...(options.operationId ? { publisherOperation: options.operationId } : {}),
    categories: [...new Set(draft.categories.map((category) => category.trim()).filter(Boolean))],
    cover: coverPath,
    coverAlt: draft.coverAlt.trim(),
    draft: false,
  };

  const body = validateMdx(draft.body);

  return {
    slug,
    articlePath: `content/articles/${slug}.mdx`,
    coverPath: `public${coverPath}`,
    mdx: stringifyFrontmatter(`${body}\n`, data),
  };
}
