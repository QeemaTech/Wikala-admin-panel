import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/api/client';
import type { StaffPermission } from '@/features/auth/auth-store';
import type { StaffMember } from './use-staff';

/**
 * Save a staff member's RBAC permission set (TASK-F-15.3).
 *
 * The contract sketched a dedicated `PUT /admin/staff/:id/permissions`, but the
 * shipped backend exposes permissions only through the general staff update:
 * `PATCH /admin/staff/:id` with `{ permissions }`. We use that real endpoint.
 */
export function useUpdateStaffPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: StaffPermission[] }) =>
      patch<{ staff: StaffMember }>(`/admin/staff/${id}`, { permissions }).then((r) => r.staff),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
