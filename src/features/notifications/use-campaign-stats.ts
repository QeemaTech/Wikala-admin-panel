import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import type { CampaignStats } from './use-campaigns';

/** GET /admin/push-campaigns/:id/stats — delivered / opened / ctr. */
export function useCampaignStats(campaignId: string | null) {
  return useQuery({
    queryKey: ['campaign-stats', campaignId],
    queryFn: () => get<CampaignStats>(`/admin/push-campaigns/${campaignId}/stats`),
    enabled: !!campaignId,
    staleTime: 30_000,
  });
}
