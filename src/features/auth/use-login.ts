import { useMutation } from '@tanstack/react-query';
import { post } from '@/lib/api/client';
import { useAuthStore } from './auth-store';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  challengeToken: string;
  twoFactorRequired: boolean;
}

export function useLogin() {
  const setChallenge = useAuthStore((s) => s.setChallenge);

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      post<LoginResponse>('/admin/auth/login', payload),
    onSuccess: (data) => {
      setChallenge(data.challengeToken);
    },
  });
}
