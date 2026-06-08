import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api/client';
import type { ChatSafetySeverity, ChatSafetyAutoAction } from './use-flagged-threads';

export interface DetectionRule {
  enabled: boolean;
  severity: ChatSafetySeverity;
  action: ChatSafetyAutoAction;
}

export type DetectionRuleKey = 'externalUrl' | 'phoneInText' | 'noWatermark' | 'fraudMatch';

export interface DetectionRulesDTO {
  urlAllowlist: string[];
  fraudPhrases: string[];
  rules: Record<DetectionRuleKey, DetectionRule>;
}

export type DetectionRulesUpdate = Partial<{
  urlAllowlist: string[];
  fraudPhrases: string[];
  rules: Partial<Record<DetectionRuleKey, Partial<DetectionRule>>>;
}>;

export function useDetectionRules() {
  return useQuery({
    queryKey: ['chat-safety', 'detection-rules'],
    queryFn: () => get<DetectionRulesDTO>('/admin/chat-safety/detection-rules'),
    staleTime: 60_000,
  });
}

export function useUpdateDetectionRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (update: DetectionRulesUpdate) =>
      patch<DetectionRulesDTO>('/admin/chat-safety/detection-rules', update),
    onSuccess: (data) => {
      qc.setQueryData(['chat-safety', 'detection-rules'], data);
    },
  });
}
