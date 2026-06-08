import { useQuery } from '@tanstack/react-query';
import { get, getPaged } from '@/lib/api/client';

export type StoreStatus = 'REGISTERED' | 'VERIFIED' | 'PREMIUM';

export interface StoreBranch {
  id: string;
  name: string;
  addressText: string;
  location: { lng: number; lat: number } | null;
}

export interface StoreDTO {
  id: string;
  slug: string;
  userId: string;
  name: string;
  bio: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  branches: StoreBranch[];
  categories: string[];
  categoryNames: string[];
  rating: number | null;
  reviewCount: number;
  joinedAt: string | null;
  stats: { views: number; likes: number; contacted: number };
  premiumActive: boolean;
  featured: boolean;
  adsCount: number;
}

export interface StoreListParams {
  status?: StoreStatus;
  search?: string;
  page?: number;
}

export function useStores({ status, search, page = 1 }: StoreListParams = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (search) qs.set('search', search);
  qs.set('page', String(page));
  return useQuery({
    queryKey: ['stores', { status, search, page }],
    queryFn: () => getPaged<StoreDTO>(`/admin/stores?${qs.toString()}`),
    staleTime: 60_000,
  });
}

export function useStore(id: string | null) {
  return useQuery({
    queryKey: ['stores', 'detail', id],
    queryFn: () => get<StoreDTO>(`/admin/stores/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/** Minimal shape of a store's public ad (whitelisted Ad fields used by the UI). */
export interface StoreAd {
  _id: string;
  title: string;
  price_minor: number | null;
  currency: string;
  media?: { original_url?: string | null; variants?: { w720?: string | null; thumb?: string | null } }[];
  governorate?: string | null;
  view_count?: number;
}

/** Recent active ads for a store (public `GET /stores/:slug/ads`). */
export function useStoreAds(slugOrId: string | null) {
  return useQuery({
    queryKey: ['stores', 'ads', slugOrId],
    queryFn: () => get<StoreAd[]>(`/stores/${slugOrId}/ads`),
    enabled: !!slugOrId,
    staleTime: 60_000,
  });
}
