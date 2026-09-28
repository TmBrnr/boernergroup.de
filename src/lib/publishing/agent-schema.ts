import { z } from 'zod';
const context = z.object({ jobId: z.string().regex(/^[a-f0-9]{32}$/), threadId: z.string().min(1).max(256), requestedBy: z.string().min(1).max(128) });
export const queuedImageSchema = z.object({ type: z.enum(['image', 'file', 'video', 'audio']), url: z.string().optional(), name: z.string().optional(), mimeType: z.string().optional(), size: z.number().int().nonnegative().optional(), width: z.number().int().positive().optional(), height: z.number().int().positive().optional(), fetchMetadata: z.record(z.string(), z.string()).optional() });
export const agentJobSchema = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('agent-start'), context, text: z.string().min(1).max(16_000), cover: queuedImageSchema.optional(), seenReviewId: z.string().nullable(), pollCount: z.number().int().nonnegative() }),
  z.object({ stage: z.literal('agent-poll'), context, responseId: z.string(), step: z.number().int().nonnegative(), pollCount: z.number().int().nonnegative() }),
]);
export const revisionJobSchema = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('revision-start'), context, baseReviewId: z.string(), instructions: z.string().min(1).max(4_000), research: z.boolean(), coverMode: z.enum(['keep', 'generate', 'edit', 'upload', 'abstract']), cover: queuedImageSchema.optional() }),
  ...(['revision-research-poll', 'revision-text-poll', 'revision-image-poll', 'revision-caption-poll'] as const).map((stage) => z.object({ stage: z.literal(stage), context, baseReviewId: z.string(), responseId: z.string(), pollCount: z.number().int().nonnegative() })),
]);
export type AgentJob = z.infer<typeof agentJobSchema>;
export type RevisionJob = z.infer<typeof revisionJobSchema>;
export type AgentContext = z.infer<typeof context>;
export type QueuedImage = z.infer<typeof queuedImageSchema>;
