import { useQuery } from '@tanstack/react-query';
import { getPaged, type PageMeta } from '@/lib/api/client';

export type FlashStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED';
export type FlashSource = 'ADMIN' | 'SELLER_PAID';

export interface FlashAdMini {
  id: string;
  title?: string;
  coverUrl?: string | null;
}

/** FlashSaleDTO (§9) — `ad` is an AdCardDTO mini (or {id} when the ad is gone). */
export interface FlashSaleDTO {
  id: string;
  ad: FlashAdMini | null;
  title: string;
  originalPriceMinor: number;
  salePriceMinor: number;
  currency: string;
  stock: number;
  sold: number;
  startsAt: string | null;
  endsAt: string | null;
  curatorId: string | null;
  source: FlashSource;
  status: FlashStatus;
  createdAt: string | null;
}

export interface FlashSalesParams {
  status?: FlashStatus;
  page?: number;
}

function buildQuery(params: FlashSalesParams): string {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useFlashSales(params: FlashSalesParams = {}) {
  return useQuery({
    queryKey: ['flash-sales', params],
    queryFn: () => getPaged<FlashSaleDTO>(`/admin/flash-sales${buildQuery(params)}`),
    staleTime: 10_000,
  });
}

/**
 * Sold-vs-total stock percentage, clamped to 0–100. The backend models `stock`
 * as the TOTAL capacity (set at creation) and `sold` as units sold — so the
 * total is `stock`, not `sold + stock` as the static prototype assumed.
 */
export function stockPercent(sold: number, stock: number): number {
  if (stock <= 0) return 0;
  return Math.min(100, Math.round((sold / stock) * 100));
}

export type { PageMeta };
