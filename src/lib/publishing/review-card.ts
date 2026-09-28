import { Actions, Button, Card, CardText, Field, Fields, Image } from 'chat';
import type { Review } from './review-store';
import { previewParts } from './preview-text';

export function reviewCard(review: Review, siteUrl: string) {
  const label = review.kind === 'delete' ? 'Confirm deletion' : review.kind === 'update' ? 'Confirm update' : 'Publish article';
  return Card({
    title: review.title,
    subtitle: review.kind === 'delete' ? 'Deletion preview — confirmation required' : 'Draft preview — confirmation required',
    children: [
      CardText(review.description),
      ...(review.coverBase64 ? [Image({ url: `${siteUrl}/api/publishing/previews/${review.token}/cover`, alt: review.draft?.coverAlt ?? review.title })] : review.existingCover ? [Image({ url: `${siteUrl}${review.existingCover}`, alt: review.draft?.coverAlt ?? review.title })] : []),
      CardText(review.kind === 'delete'
        ? 'Confirming removes this article from the website in a recoverable Git commit.'
        : 'Review the complete article, cover, and sources before confirming. Nothing has been published or updated.'),
      Fields([
        Field({ label: 'Action', value: review.kind }),
        Field({ label: 'Article', value: `${siteUrl}/newsroom/${review.slug}` }),
        Field({ label: 'Review ID', value: review.id }),
        Field({ label: 'Sources', value: String(review.sources.length) }),
      ]),
      CardText('This preview expires after 24 hours. Only authorised publishers can confirm or cancel it in this thread.'),
      Actions([
        Button({ id: 'publisher-confirm', value: review.id, label, style: review.kind === 'delete' ? 'danger' : 'primary' }),
        Button({ id: 'publisher-cancel', value: review.id, label: 'Cancel' }),
      ]),
    ],
  });
}

export async function postReviewPreview(thread: { post: (message: { markdown: string } | ReturnType<typeof reviewCard>) => Promise<unknown> }, review: Review, siteUrl: string) {
  await thread.post({ markdown: `# ${review.title}\n\n${review.description}\n\nCategories: ${review.draft?.categories.join(', ') ?? ''}\nPreview ${review.id} — ${review.kind}` });
  for (const part of previewParts(review)) await thread.post({ markdown: part });
  // Approval controls follow the entire text and cover, never precede them.
  await thread.post(reviewCard(review, siteUrl));
}
