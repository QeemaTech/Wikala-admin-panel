import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put } from '@/lib/api/client';

export interface TextRule {
  pattern: string;
  action: 'FLAG' | 'REJECT';
  /**
   * Human-readable label shown to moderators instead of the raw regex, e.g.
   * WALLET_TRANSFER_REQUEST. Optional: rules added by hand before this existed
   * have none. Preserved on save so editing one rule cannot silently strip the
   * labels off the others.
   */
  reason?: string | null;
}

export interface ImageRule {
  category: string;
  action: 'FLAG' | 'REJECT';
}

export interface AiRulesDTO {
  thresholdReview: number;
  thresholdReject: number;
  textRules: TextRule[];
  imageRules: ImageRule[];
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
}

export type AiRulesSavePayload = Pick<
  AiRulesDTO,
  'thresholdReview' | 'thresholdReject' | 'textRules' | 'imageRules'
>;

export function useAiRules() {
  return useQuery({
    queryKey: ['moderation', 'ai-rules'],
    queryFn: () => get<AiRulesDTO>('/admin/moderation/ai-rules'),
    staleTime: 5 * 60_000,
  });
}

export function useSaveAiRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AiRulesSavePayload) =>
      put<AiRulesDTO>('/admin/moderation/ai-rules', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moderation', 'ai-rules'] }),
  });
}
