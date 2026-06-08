import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put } from '@/lib/api/client';
import type { FlashSource } from './use-flash-sales';

export interface FlashRules {
  defaultSource: FlashSource;
  maxConcurrent: number;
  defaultDurationHours: number;
}

interface SettingsEnvelope {
  settings: { flash: FlashRules };
}

/** Reads the `flash` block from system settings (Contract §7.42). */
export function useFlashRules() {
  return useQuery({
    queryKey: ['flash-rules'],
    queryFn: async () => {
      const data = await get<SettingsEnvelope>('/admin/settings');
      return data.settings.flash;
    },
    staleTime: 60_000,
  });
}

export function useUpdateFlashRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<FlashRules>) => {
      const data = await put<SettingsEnvelope>('/admin/settings', { flash: updates });
      return data.settings.flash;
    },
    onSuccess: (flash) => qc.setQueryData(['flash-rules'], flash),
  });
}
