import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del } from '@/lib/api/client';
import type { AdAdminDTO, AdCondition } from './use-ads';

export interface AdEditPayload {
  title?: string;
  description?: string;
  priceMinor?: number;
  currency?: string;
  condition?: AdCondition;
  governorate?: string;
  district?: string;
  dynamicFields?: Record<string, unknown>;
}

/** Per-ad failure entry returned by POST /admin/moderation/bulk-approve.
 *  Backend shape: `{ adId, reason }` (reason ∈ NOT_IN_QUEUE | ERROR). */
export interface BulkApproveFailure {
  adId: string;
  reason: string;
}

export interface BulkApproveResult {
  approved: number;
  failed: BulkApproveFailure[];
}

function invalidateModeration(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['moderation'] }); // queue + stats (prefix match)
  // ['moderation-count'] is a SEPARATE key — ['moderation'] does not prefix-match it,
  // so the tab badges go stale unless we invalidate it explicitly.
  qc.invalidateQueries({ queryKey: ['moderation-count'] });
  // An approved ad leaves the queue and appears in the live ads catalog + KPIs.
  qc.invalidateQueries({ queryKey: ['admin-ads'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useApproveAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => post(`/admin/moderation/${adId}/approve`, {}),
    onSuccess: () => invalidateModeration(qc),
  });
}

export function useRejectAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adId, reason }: { adId: string; reason: string }) =>
      post(`/admin/moderation/${adId}/reject`, { reason }),
    onSuccess: () => invalidateModeration(qc),
  });
}

export function useEscalateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adId, reason }: { adId: string; reason: string }) =>
      post(`/admin/moderation/${adId}/escalate`, { reason }),
    onSuccess: () => invalidateModeration(qc),
  });
}

export function useBulkApproveAds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (adIds: string[]) => post<BulkApproveResult>(
      '/admin/moderation/bulk-approve',
      { adIds },
    ),
    onSuccess: () => invalidateModeration(qc),
  });
}

export function useAdminEditAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adId, payload }: { adId: string; payload: AdEditPayload }) =>
      patch<AdAdminDTO>(`/admin/moderation/${adId}`, payload),
    onSuccess: (_, { adId }) => { invalidateModeration(qc); invalidateAds(qc, adId); },
  });
}

function invalidateAds(qc: ReturnType<typeof useQueryClient>, adId?: string) {
  qc.invalidateQueries({ queryKey: ['admin-ads'] });
  // A status change (takedown/restore/delete/edit) is also visible in the
  // moderation views, the dashboard KPIs, and the open ad detail drawer.
  qc.invalidateQueries({ queryKey: ['moderation'] });
  qc.invalidateQueries({ queryKey: ['moderation-count'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  if (adId) qc.invalidateQueries({ queryKey: ['admin-ad', adId] });
}

/** Post-publish enforcement: ACTIVE → ARCHIVED. */
export function useTakedownAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adId, reason }: { adId: string; reason?: string }) =>
      post<AdAdminDTO>(`/admin/ads/${adId}/takedown`, reason ? { reason } : {}),
    onSuccess: (_, { adId }) => invalidateAds(qc, adId),
  });
}

/** ARCHIVED → ACTIVE. */
export function useRestoreAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => post<AdAdminDTO>(`/admin/ads/${adId}/restore`, {}),
    onSuccess: (_, adId) => invalidateAds(qc, adId),
  });
}

/** Soft-delete an ad. */
export function useDeleteAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => del<void>(`/admin/ads/${adId}`),
    onSuccess: (_, adId) => invalidateAds(qc, adId),
  });
}

export interface TodaysDealPayload {
  isTodaysDeal: boolean;
  /** Omit for "featured until I unfeature it". */
  dealEndsAt?: string | null;
  dealStartsAt?: string | null;
  /** The "was" price for a strike-through. Must exceed the asking price. */
  originalPriceMinor?: number | null;
}

/**
 * Feature (or unfeature) an ad on the app's Today's Deal rail.
 *
 * Editorial, not a boost: a boost is something a seller pays for, so reusing it
 * here would let money buy a slot on what is meant to be a recommendation.
 *
 * The backend refuses a non-ACTIVE ad (409), a past `dealEndsAt` (422) and an
 * `originalPriceMinor` at or below the current price (422) — that last one
 * would render a strike-through that reads as a price *rise*.
 */
export function useSetTodaysDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adId, payload }: { adId: string; payload: TodaysDealPayload }) =>
      patch<AdAdminDTO>(`/admin/ads/${adId}/todays-deal`, payload),
    onSuccess: (_, { adId }) => invalidateAds(qc, adId),
  });
}
