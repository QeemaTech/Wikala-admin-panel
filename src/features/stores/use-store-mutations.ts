import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch } from '@/lib/api/client';
import type { StoreDTO } from './use-stores';

export interface InviteStorePayload {
  phoneE164: string;
  email?: string;
  suggestedName?: string;
  categories?: string[];
}

export interface InviteStoreResult {
  inviteToken: string;
  /** Registration deeplink to share with the merchant (carries the invite). */
  inviteUrl: string;
  phoneE164: string;
  email: string | null;
  suggestedName: string | null;
  categories: string[];
  /** True when the invite email was delivered (email given + SMTP configured). */
  emailSent: boolean;
  expiresAt: string;
  note: string;
}

export interface StoreUpdatePayload {
  name?: string;
  categories?: string[];
  featured?: boolean;
}

export function useInviteStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteStorePayload) => post<InviteStoreResult>('/admin/stores/invite', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StoreUpdatePayload }) =>
      patch<StoreDTO>(`/admin/stores/${id}`, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      if (data?.id) qc.invalidateQueries({ queryKey: ['stores', 'detail', data.id] });
    },
  });
}
