import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch } from '@/lib/api/client';
import type { BannerDTO, BannerSlot } from './use-banners';
import type { DestinationType } from './use-target-search';

export interface BannerDestinationPayload {
  type: DestinationType;
  targetId?: string | null;
  targetSlug?: string | null;
  searchQuery?: Record<string, string> | null;
  url?: string | null;
}

export interface BannerCreatePayload {
  title: string;
  subtitle?: string;
  body?: string;
  ctaText: string;
  imageCloudinaryPublicId?: string;
  linkUrl?: string;
  destination?: BannerDestinationPayload;
  slot: BannerSlot;
  startsAt?: string;
  endsAt?: string;
  order?: number;
}

export type BannerUpdatePayload = Partial<BannerCreatePayload>;

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['banners'] });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BannerCreatePayload) => post<BannerDTO>('/admin/banners', payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BannerUpdatePayload }) =>
      patch<BannerDTO>(`/admin/banners/${id}`, payload),
    onSuccess: () => invalidate(qc),
  });
}

export function usePublishBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<BannerDTO>(`/admin/banners/${id}/publish`, {}),
    onSuccess: () => invalidate(qc),
  });
}

export function useEndBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<BannerDTO>(`/admin/banners/${id}/end`, {}),
    onSuccess: () => invalidate(qc),
  });
}
