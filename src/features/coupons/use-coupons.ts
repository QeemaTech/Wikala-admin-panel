import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '@/lib/api/client';
import { buildQuery, type ListMeta } from '@/features/products/use-products';

export type CouponType = 'PERCENT' | 'FIXED';

export const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  PERCENT: 'نسبة مئوية',
  FIXED: 'مبلغ ثابت',
};

export interface CouponDTO {
  id: string;
  code: string;
  type: CouponType;
  /** Percentage points for PERCENT, minor units for FIXED. */
  value: number;
  currency: string;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string | null;
}

/** One order that redeemed the coupon. */
export interface CouponRedemptionDTO {
  orderId: string;
  orderNo: string;
  status: string;
  discountMinor: number;
  totalMinor: number;
  currency: string;
  buyer: { id: string; name: string; phone: string } | null;
  placedAt: string | null;
}

export interface CouponDetailDTO extends CouponDTO {
  /** Cancelled and refunded orders are excluded — they gave the discount back. */
  usage: {
    orderCount: number;
    totalDiscountMinor: number;
    totalRevenueMinor: number;
    currency: string;
  };
  redemptions: CouponRedemptionDTO[];
}

export function useCoupon(id: string | null) {
  return useQuery({
    queryKey: ['coupon', id],
    queryFn: () => get<CouponDetailDTO>(`/admin/coupons/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export interface CouponPayload {
  code?: string;
  type?: CouponType;
  value?: number;
  currency?: string;
  minSubtotalMinor?: number;
  maxDiscountMinor?: number | null;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
}

export function useCoupons(params: { active?: string; search?: string; page?: number } = {}) {
  const qs = buildQuery({ ...params, page: params.page });
  return useQuery({
    queryKey: ['coupons', params],
    queryFn: () => get<{ items: CouponDTO[]; meta: ListMeta }>(`/admin/coupons${qs}`),
    staleTime: 30_000,
  });
}

function useCouponInvalidation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['coupons'] });
    qc.invalidateQueries({ queryKey: ['coupon'] });
  };
}

export function useCreateCoupon() {
  const invalidate = useCouponInvalidation();
  return useMutation({
    mutationFn: (payload: CouponPayload) => post<CouponDTO>('/admin/coupons', payload),
    onSuccess: invalidate,
  });
}

export function useUpdateCoupon() {
  const invalidate = useCouponInvalidation();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CouponPayload }) =>
      patch<CouponDTO>(`/admin/coupons/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteCoupon() {
  const invalidate = useCouponInvalidation();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/admin/coupons/${id}`),
    onSuccess: invalidate,
  });
}
