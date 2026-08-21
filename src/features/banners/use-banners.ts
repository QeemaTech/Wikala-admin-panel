import { useQuery } from '@tanstack/react-query';
import { getPaged, type PageMeta } from '@/lib/api/client';
import type { DestinationType } from './use-target-search';

export type BannerStatus = 'DRAFT' | 'LIVE' | 'ENDED';

export type BannerSlot =
  | 'HOME_TOP' | 'HOME_MID' | 'AUCTIONS'
  | 'CATEGORY_PROPERTY' | 'CATEGORY_PHONES' | 'CATEGORY_FASHION' | 'CATEGORY_BABIES'
  | 'CATEGORY_JOBS' | 'CATEGORY_SPORT' | 'CATEGORY_SERVICE' | 'CATEGORY_FURNITURE'
  | 'CATEGORY_ELECTRONICS' | 'CATEGORY_VEHICLES';

export const BANNER_SLOTS: BannerSlot[] = [
  'HOME_TOP', 'HOME_MID', 'AUCTIONS',
  'CATEGORY_PROPERTY', 'CATEGORY_PHONES', 'CATEGORY_FASHION', 'CATEGORY_BABIES',
  'CATEGORY_JOBS', 'CATEGORY_SPORT', 'CATEGORY_SERVICE', 'CATEGORY_FURNITURE',
  'CATEGORY_ELECTRONICS', 'CATEGORY_VEHICLES',
];

export const SLOT_LABELS: Record<BannerSlot, string> = {
  HOME_TOP: 'الرئيسية — أعلى',
  HOME_MID: 'الرئيسية — وسط',
  AUCTIONS: 'المزادات',
  CATEGORY_PROPERTY: 'قسم العقارات',
  CATEGORY_PHONES: 'قسم الهواتف',
  CATEGORY_FASHION: 'قسم الأزياء',
  CATEGORY_BABIES: 'قسم مستلزمات الأطفال',
  CATEGORY_JOBS: 'قسم الوظائف',
  CATEGORY_SPORT: 'قسم الرياضة',
  CATEGORY_SERVICE: 'قسم الخدمات',
  CATEGORY_FURNITURE: 'قسم الأثاث',
  CATEGORY_ELECTRONICS: 'قسم الإلكترونيات',
  CATEGORY_VEHICLES: 'قسم المركبات',
};

export interface BannerDestination {
  type: DestinationType;
  targetId: string | null;
  targetSlug: string | null;
  targetLabel: string | null;
  searchQuery: Record<string, string> | null;
  url: string | null;
}

export interface BannerDTO {
  id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  ctaText: string;
  imageUrl: string | null;
  linkUrl: string | null;
  destination: BannerDestination;
  slot: BannerSlot;
  status: BannerStatus;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  order: number;
}

export interface BannersParams {
  /** true → LIVE only; false → non-LIVE; undefined → all. */
  live?: boolean;
  slot?: BannerSlot;
  page?: number;
}

function buildQuery(params: BannersParams): string {
  const q = new URLSearchParams();
  if (params.live !== undefined) q.set('live', String(params.live));
  if (params.slot) q.set('slot', params.slot);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useBanners(params: BannersParams = {}) {
  return useQuery({
    queryKey: ['banners', params],
    queryFn: () => getPaged<BannerDTO>(`/admin/banners${buildQuery(params)}`),
    staleTime: 15_000,
  });
}

export type { PageMeta };
