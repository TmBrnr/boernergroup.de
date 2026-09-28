import 'server-only';
import { getPublishingChat } from './chat';
import { reviewStore } from './review-store';
import { conversationStore } from './conversation-store';

export * from './review-store';

export async function getReviewStore() {
  const state = getPublishingChat().getState();
  await state.connect();
  return reviewStore(state);
}

export async function getConversationStore() {
  const state = getPublishingChat().getState();
  await state.connect();
  return conversationStore(state);
}
