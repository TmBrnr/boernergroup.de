import { Actions, Button, Card, CardText, Field, Fields, LinkButton } from 'chat';
import { previewUrl, type Review } from './reviews';

export function reviewCard(review: Review, siteUrl: string) {
  const label = review.kind === 'delete' ? 'Confirm deletion' : review.kind === 'update' ? 'Confirm update' : 'Publish article';
  return Card({
    title: review.title,
    subtitle: review.kind === 'delete' ? 'Deletion preview — confirmation required' : 'Draft preview — confirmation required',
    children: [
      CardText(review.description),
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
        LinkButton({ url: previewUrl(review, siteUrl), label: 'Open full preview' }),
        Button({ id: 'publisher-confirm', value: review.id, label, style: review.kind === 'delete' ? 'danger' : 'primary' }),
        Button({ id: 'publisher-cancel', value: review.id, label: 'Cancel' }),
      ]),
    ],
  });
}
