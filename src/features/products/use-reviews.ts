import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api/client';
import { buildQuery, type ListMeta } from './use-products';

export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED';

export interface ProductReviewDTO {
  id: string;
  productId: string;
  productTitle: string | null;
  rating: number;
  body: string;
  status: ReviewStatus;
  author: { id: string; name: string; avatarUrl: string | null } | null;
  createdAt: string | null;
}

export function useReviewQueue(
  params: { status?: ReviewStatus | ''; productId?: string; page?: number } = {},
) {
  const qs = buildQuery({ status: params.status, productId: params.productId, page: params.page });
  return useQuery({
    queryKey: ['product-reviews', params],
    queryFn: () => get<{ items: ProductReviewDTO[]; meta: ListMeta }>(`/admin/reviews${qs}`),
    staleTime: 30_000,
  });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PUBLISHED' | 'REJECTED' }) =>
      patch<ProductReviewDTO>(`/admin/reviews/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-reviews'] });
      // Publishing/rejecting recomputes the product's rating average.
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
