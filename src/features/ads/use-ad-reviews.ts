import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api/client';
import { buildQuery, type ListMeta } from '@/features/products/use-products';

/**
 * Buyer reviews left on an **ad** (the listing), not on a seller and not on a
 * store product. They arrive `PENDING` and stay invisible in the app until a
 * moderator publishes one — at which point the backend recomputes the ad's
 * `ratingAvg` / `reviewCount`. Rejecting a published review pulls it back down.
 *
 * Deliberately a separate endpoint from `/admin/reviews` (store products):
 * the two are different collections with different DTOs.
 */

export type AdReviewStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED';

export interface AdReviewDTO {
  id: string;
  adId: string;
  /** Resolved by the admin list only; the app-facing endpoint omits it. */
  adTitle: string | null;
  rating: number;
  body: string;
  status: AdReviewStatus;
  author: { id: string; name: string; avatarUrl: string | null } | null;
  createdAt: string | null;
}

export function useAdReviewQueue(
  params: { status?: AdReviewStatus | ''; adId?: string; page?: number } = {},
) {
  const qs = buildQuery({ status: params.status, adId: params.adId, page: params.page });
  return useQuery({
    queryKey: ['ad-reviews', params],
    queryFn: () => get<{ items: AdReviewDTO[]; meta: ListMeta }>(`/admin/ad-reviews${qs}`),
    staleTime: 30_000,
  });
}

export function useModerateAdReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PUBLISHED' | 'REJECTED' }) =>
      patch<AdReviewDTO>(`/admin/ad-reviews/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ad-reviews'] });
      // Publishing or rejecting recomputes the ad's denormalised rating, so any
      // list or detail showing stars is now stale.
      qc.invalidateQueries({ queryKey: ['admin-ads'] });
      qc.invalidateQueries({ queryKey: ['admin-ad'] });
    },
  });
}
