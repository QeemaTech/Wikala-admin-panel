import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del } from '@/lib/api/client';
import type { StaffRole, StaffPermission } from '@/features/auth/auth-store';
import type { StaffMember } from './use-staff';

export interface CreateStaffPayload {
  email: string;
  name: string;
  role: StaffRole;
  permissions: StaffPermission[];
  /** Optional explicit password; if omitted the backend emails a temp one. */
  password?: string;
}

/** Create response includes a one-time temp password (emailed by the backend). */
export type CreatedStaff = StaffMember & { tempPassword?: string };

export interface UpdateStaffPayload {
  name?: string;
  role?: StaffRole;
  permissions?: StaffPermission[];
}

/** `POST /admin/staff` — super-admin only (enforced server-side). */
export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) =>
      post<{ staff: CreatedStaff }>('/admin/staff', payload).then((r) => r.staff),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

/** `PATCH /admin/staff/:id` — name / role / permissions. */
export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffPayload }) =>
      patch<{ staff: StaffMember }>(`/admin/staff/${id}`, payload).then((r) => r.staff),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

/** `POST /admin/staff/:id/password` — super-admin sets/resets a member's password. */
export function useSetStaffPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      post<{ staff: StaffMember }>(`/admin/staff/${id}/password`, { password }).then((r) => r.staff),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

/** `POST /admin/staff/:id/suspend` — revokes the member's sessions. */
export function useSuspendStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      post<{ staff: StaffMember }>(`/admin/staff/${id}/suspend`, {}).then((r) => r.staff),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

/** `DELETE /admin/staff/:id` — super-admin only; soft-disables the account. */
export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/admin/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
