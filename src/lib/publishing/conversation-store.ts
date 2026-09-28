import type { StateAdapter } from 'chat';

const TTL = 7 * 24 * 60 * 60 * 1_000;
export type Conversation = {
  activeReviewId?: string;
  busyJobId?: string;
  busyTurnId?: string;
  pendingTurnIds?: string[];
  history: { role: 'user' | 'assistant'; content: string }[];
};

export function conversationStore(state: StateAdapter) {
  const key = (threadId: string) => `conversation:${threadId}`;
  const get = async (threadId: string): Promise<Conversation> =>
    (await state.get<Conversation>(key(threadId))) ?? { history: [] };
  const save = (threadId: string, conversation: Conversation) => state.set(key(threadId), conversation, TTL);
  return {
    get,
    save,
    async locked<T>(threadId: string, operation: () => Promise<T>): Promise<T> {
      const lock = await state.acquireLock(`conversation-lock:${threadId}`, 120_000);
      if (!lock) throw new Error('This conversation is processing another change. Please try again shortly.');
      try { return await operation(); } finally { await state.releaseLock(lock); }
    },
    async select(threadId: string, reviewId: string) {
      await this.locked(threadId, async () => {
        const conversation = await get(threadId);
        if (await state.get(`cancelled-task:${reviewId}`)) return;
        if (conversation.busyJobId && conversation.busyJobId !== reviewId) return;
        if (!conversation.busyJobId && conversation.activeReviewId && conversation.activeReviewId !== reviewId) return;
        await save(threadId, { ...conversation, activeReviewId: reviewId, busyJobId: undefined });
      });
    },
    async cancelled(jobId: string) { return Boolean(await state.get(`cancelled-task:${jobId}`)); },
    async cancelTask(jobId: string) { await state.set(`cancelled-task:${jobId}`, true, TTL); },
    async append(threadId: string, message: { role: 'user' | 'assistant'; content: string }) {
      await this.locked(threadId, async () => {
        const conversation = await get(threadId);
        await save(threadId, { ...conversation, history: [...conversation.history, { ...message, content: message.content.slice(0, 16_000) }].slice(-16) });
      });
    },
  };
}
