import { useMutation } from '@tanstack/react-query';
import { post } from '@/lib/api/client';
import { useAuthStore, type StaffUserDTO } from './auth-store';

interface EnrollResponse {
  provisioningUri: string;
  secret: string;
}

interface VerifyPayload {
  totp: string;
}

interface VerifyResponse {
  accessToken: string;
  refreshToken: string;
  staff: StaffUserDTO;
}

export function use2faEnroll() {
  const challengeToken = useAuthStore((s) => s.challengeToken);

  return useMutation({
    mutationFn: () =>
      post<EnrollResponse>('/admin/auth/2fa/enroll', { challengeToken }),
  });
}

export function use2faVerify() {
  const challengeToken = useAuthStore((s) => s.challengeToken);
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: ({ totp }: VerifyPayload) =>
      post<VerifyResponse>('/admin/auth/2fa/verify', { challengeToken, totp }),
    onSuccess: (data) => {
      setSession(data.accessToken, data.refreshToken, data.staff);
    },
  });
}
