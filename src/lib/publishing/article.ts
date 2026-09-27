import sharp from 'sharp';
import { z } from 'zod';

import { getArticles } from '@/lib/articles';
import { stringifyFrontmatter } from '@/lib/frontmatter';
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

export async function createGeneratedCover(draft: ArticleDraft): Promise<PreparedCover> {
  const random = seededRandom(`${draft.title}|${draft.categories.join('|')}`);
  const trajectories = Array.from({ length: 18 }, (_, index) => {
    const startY = 115 + index * 41 + Math.round(random() * 28);
    const controlY = Math.max(70, startY - 40 - Math.round(random() * 170));
    const endY = Math.max(60, startY - 20 - Math.round(random() * 230));
    const opacity = (0.1 + random() * 0.14).toFixed(2);
    return `<path d="M -80 ${startY} C 420 ${startY + 80}, 920 ${controlY}, 1680 ${endY}" fill="none" stroke="#aeb6bd" stroke-opacity="${opacity}" stroke-width="1.4"/>`;
  }).join('');
  const marketNodes = Array.from({ length: 28 }, (_, index) => {
    const x = 155 + Math.round(random() * 1290);
    const y = 115 + Math.round(random() * 660);
    const radius = index % 7 === 0 ? 5 : 2.5;
    const opacity = (0.16 + random() * 0.3).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="#c8ced3" fill-opacity="${opacity}"/>`;
  }).join('');
  const svg = `
    <svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="72%" cy="42%" r="72%">
          <stop offset="0" stop-color="#173673" stop-opacity="0.34"/>
          <stop offset="0.45" stop-color="#18243b" stop-opacity="0.2"/>
          <stop offset="1" stop-color="#0d1015" stop-opacity="0"/>
        </radialGradient>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed="17"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.08"/></feComponentTransfer>
        </filter>
        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="12"/>
        </filter>
      </defs>
      <rect width="1600" height="900" fill="#0d1015"/>
      <rect width="1600" height="900" fill="url(#glow)"/>
      ${trajectories}
      ${marketNodes}
      <path d="M 105 735 C 360 690, 520 625, 710 590 S 1015 480, 1190 365 S 1400 260, 1515 150" fill="none" stroke="#315fdd" stroke-opacity="0.22" stroke-width="20" filter="url(#softGlow)"/>
      <path d="M 105 735 C 360 690, 520 625, 710 590 S 1015 480, 1190 365 S 1400 260, 1515 150" fill="none" stroke="#4f7cff" stroke-width="2.5"/>
      <g fill="#4f7cff">
        <circle cx="360" cy="690" r="6"/><circle cx="710" cy="590" r="6"/>
        <circle cx="1015" cy="480" r="6"/><circle cx="1190" cy="365" r="6"/>
        <circle cx="1400" cy="260" r="6"/>
      </g>
      <rect x="1477" y="112" width="76" height="76" fill="none" stroke="#c8ced3" stroke-opacity="0.82" stroke-width="3"/>
      <circle cx="1515" cy="150" r="8" fill="#dce2e8"/>
      <rect width="1600" height="900" filter="url(#grain)" opacity="0.55"/>
    </svg>`;

  const bytes = await sharp(Buffer.from(svg))
    .resize(1600, 900, { fit: 'cover' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return {
    bytes,
    dataUrl: `data:image/jpeg;base64,${bytes.toString('base64')}`,
    width: 1600,
    height: 900,
  };
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

  if (forbidden.some((pattern) => pattern.test(trimmed))) {
    throw new Error('The generated article contained unsafe MDX and was not committed.');
  }

  return trimmed;
}

export function prepareArticle(draft: ArticleDraft): PreparedArticle {
  const slug = slugify(draft.title);
  if (!slug) throw new Error('The generated title did not produce a valid URL slug.');

  const coverPath = `/media/articles/${slug}.jpg`;
  const data = {
    title: draft.title.trim(),
    description: draft.description.trim(),
    date: new Date().toISOString().slice(0, 10),
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
