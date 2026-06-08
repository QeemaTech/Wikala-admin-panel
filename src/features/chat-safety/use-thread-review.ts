import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/api/client';
import type { ReviewerDecision } from './use-flagged-threads';

export interface ReviewPayload {
  flagId: string;
  decision: ReviewerDecision;
  note?: string;
}

export interface ReviewResult {
  id: string;
  reviewerDecision: ReviewerDecision;
  reviewerNote: string | null;
  reviewedAt: string;
}

/** Submit a reviewer decision on a flagged thread (POST /admin/chat-safety/flags/:id/review). */
export function useThreadReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ flagId, decision, note }: ReviewPayload) =>
      post<ReviewResult>(`/admin/chat-safety/flags/${flagId}/review`, { decision, note }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['chat-safety', 'flagged'] });
      qc.invalidateQueries({ queryKey: ['chat-safety', 'flag', vars.flagId] });
      qc.invalidateQueries({ queryKey: ['chat-safety', 'stats'] });
    },
  });
}

/**
 * Records a staff PII reveal for audit (POST /admin/chat-safety/flags/:id/reveal).
 * Fire-and-forget — a failed audit must not block the reveal UX.
 */
export function useRevealAudit() {
  return useMutation({
    mutationFn: ({ flagId, field }: { flagId: string; field: string }) =>
      post<{ ok: boolean }>(`/admin/chat-safety/flags/${flagId}/reveal`, { field }),
  });
}
