import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import type { AdAdminDTO } from './use-ads';

/**
 * Full ad (AdAdminDTO, incl. the moderation block) from `GET /admin/ads/:id`.
 * Drives both the staff view drawer (AdDetail) and the edit form from the
 * ads-management grid, where the list only carries the lightweight card DTO.
 */
export function useAdDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin-ad', id],
    queryFn: () => get<AdAdminDTO>(`/admin/ads/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}
