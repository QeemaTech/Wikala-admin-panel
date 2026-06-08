import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/api/client';
import type { StaffMember } from './use-staff';

/**
 * Reset a staff member's 2FA enrollment (TASK-F-15.4).
 * `POST /admin/staff/:id/2fa/reset` — forces re-enrollment on next login and
 * moves the member back to `pending_2fa`. Super-admin only (server-enforced).
 */
export function useReset2FA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      post<{ staff: StaffMember }>(`/admin/staff/${id}/2fa/reset`, {}).then((r) => r.staff),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
