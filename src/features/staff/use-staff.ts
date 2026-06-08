import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import type { StaffRole, StaffPermission, StaffUserDTO } from '@/features/auth/auth-store';

/**
 * Staff team member as returned by `GET /admin/staff`.
 *
 * Note: the backend serializes the join timestamp as `createdAt` (the contract
 * names it `joinedAt`). We consume the real field, `createdAt`. Flagged for the
 * contract to be reconciled.
 */
export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  permissions: StaffPermission[];
  twoFactorEnabled: boolean;
  status: StaffUserDTO['status'];
  lastActiveAt: string | null;
  createdAt: string | null;
}

/** List the admin team. `GET /admin/staff` → `{ staff: StaffMember[] }`. */
export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { staff } = await get<{ staff: StaffMember[] }>('/admin/staff');
      return staff;
    },
    staleTime: 60_000,
  });
}
