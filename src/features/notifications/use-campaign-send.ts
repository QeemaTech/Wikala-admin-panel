import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/api/client';
import type { AudienceQuery, CampaignDTO, CampaignPriority, CampaignType } from './use-campaigns';

export type CampaignAction = 'SEND_NOW' | 'SCHEDULE' | 'SAVE_DRAFT';

export interface CampaignCreatePayload {
  title: string;
  body: string;
  type: CampaignType;
  priority: CampaignPriority;
  audienceQuery: AudienceQuery;
  action: CampaignAction;
  scheduledAt?: string;
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['campaigns'] });
}

/** POST /admin/push-campaigns — unified create (send-now / schedule / save-draft). */
export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CampaignCreatePayload) =>
      post<CampaignDTO>('/admin/push-campaigns', payload),
    onSuccess: () => invalidate(qc),
  });
}

/** POST /admin/push-campaigns/:id/cancel — archives a DRAFT/SCHEDULED campaign. */
export function useCancelCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<CampaignDTO>(`/admin/push-campaigns/${id}/cancel`, {}),
    onSuccess: () => invalidate(qc),
  });
}

/** POST /admin/push-campaigns/:id/reschedule — moves a SCHEDULED campaign to a new time. */
export function useRescheduleCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      post<CampaignDTO>(`/admin/push-campaigns/${id}/reschedule`, { scheduledAt }),
    onSuccess: () => invalidate(qc),
  });
}
