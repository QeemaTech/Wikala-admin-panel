import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/api/client';
import type { BoostPackage, BoostPackageDTO, BoostPlacement, BoostBadge } from './use-boosts';

export interface BoostPackageUpdatePayload {
  priceMinor: number;
  currency: string;
  durationDays: number;
  placement: BoostPlacement;
  badge: BoostBadge;
  pushToFollowers: boolean;
  marketingBullets: string[];
}

/** PATCH /admin/boosts/packages/:package — Contract §7.37. */
export function useUpdateBoostPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pkg, payload }: { pkg: BoostPackage; payload: Partial<BoostPackageUpdatePayload> }) =>
      patch<BoostPackageDTO>(`/admin/boosts/packages/${pkg}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boost-packages'] });
      qc.invalidateQueries({ queryKey: ['boost-revenue'] });
    },
  });
}
