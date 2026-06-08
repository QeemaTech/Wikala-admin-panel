import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/api/client';
import type { AuctionDTO } from './use-auctions';

/**
 * Force-close a live/scheduled auction (POST /admin/auctions/:id/force-close).
 * Status → ENDED_WON (if bids) or ENDED_NO_BIDS. Invalidates list + counts + KPI.
 */
export function useForceCloseAuction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ auctionId, reason }: { auctionId: string; reason?: string }) =>
      post<AuctionDTO>(`/admin/auctions/${auctionId}/force-close`, reason ? { reason } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auctions'] });
      qc.invalidateQueries({ queryKey: ['auctions-count'] });
    },
  });
}

/**
 * Approve a pending (SCHEDULED) auction and launch it now with a chosen
 * duration (POST /admin/auctions/:id/approve). Status SCHEDULED → LIVE.
 */
export function useApproveAuction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ auctionId, durationDays }: { auctionId: string; durationDays: number }) =>
      post<AuctionDTO>(`/admin/auctions/${auctionId}/approve`, { durationDays }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auctions'] });
      qc.invalidateQueries({ queryKey: ['auctions-count'] });
    },
  });
}
