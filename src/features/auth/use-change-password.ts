import { useMutation } from '@tanstack/react-query';
import { post } from '@/lib/api/client';

/**
 * Change the signed-in staff member's own password.
 * `POST /admin/auth/change-password` — requires the current password.
 */
export function useChangeMyPassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      post<{ success: boolean }>('/admin/auth/change-password', payload),
  });
}
