import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { Mdx } from '@/components/newsroom/Mdx';
import { getReviewStore } from '@/lib/publishing/reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Private article preview',
  robots: { index: false, follow: false, noarchive: true },
};

export default async function PublisherPreview({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const review = await (await getReviewStore()).byToken(token);
  if (!review?.draft) notFound();
  const cover = review.coverBase64 ? `/api/publishing/previews/${token}/cover` : review.existingCover;
  return (
    <article className="shell pb-24 pt-[calc(var(--nav-h)+3rem)]">
      <div className="mx-auto max-w-prose">
        <aside className="mb-10 rounded-xl border border-line/20 bg-line/5 p-6">
          <p className="eyebrow">{review.kind === 'delete' ? 'Deletion preview' : 'Private draft preview'}</p>
          <p className="mt-3">{review.kind === 'delete' ? 'This is the article that will be removed if you confirm.' : 'Review the full article and cover below.'} Return to the original Slack thread to confirm or cancel.</p>
          <p className="mt-3 text-sm text-faint">Status: {review.status}. Preview expires {new Date(review.expiresAt).toISOString().replace('T', ' ').slice(0, 16)} UTC.</p>
        </aside>
        <h1 className="text-d2">{review.title}</h1>
        <p className="mt-6 text-lead text-bone/60">{review.description}</p>
        <p className="mt-4 text-sm text-faint">{review.draft.categories.join(' · ')}</p>
        <p className="mt-2 break-all font-mono text-xs text-faint">/newsroom/{review.slug}</p>
      </div>
      {cover && <figure className="mx-auto my-12 max-w-5xl">
        <Image src={cover} alt={review.draft.coverAlt} width={1600} height={900} unoptimized className="rounded-2xl" />
        <figcaption className="mt-3 text-sm text-faint">{review.draft.coverAlt}</figcaption>
      </figure>}
      <div className="prose prose-editorial mx-auto max-w-prose"><Mdx source={review.draft.body} /></div>
      {review.sources.length > 0 && <aside className="mx-auto mt-12 max-w-prose border-t border-line/10 pt-6">
        <h2 className="eyebrow">Research sources</h2>
        <ul className="mt-4 space-y-2">{review.sources.map((url) => <li key={url}><a href={url} rel="noreferrer noopener" target="_blank" className="break-all text-sm underline">{url}</a></li>)}</ul>
      </aside>}
    </article>
  );
}
