import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put } from '@/lib/api/client';

export interface SystemSettingsDTO {
  /** Flat list of enabled OTP channel codes (backend `otp_channels`). */
  otpChannels: string[];
  security: {
    jwtAccessTtlSec: number;
    refreshTtlSec: number;
    otpAttemptsMax: number;
  };
  auction: {
    defaultDurationDays: number;
    maxDurationDays: number;
    minBidIncrementMinor: number;
    autoExtendSeconds: number;
    autoExtendEnabled: boolean;
    verifiedOnly: boolean;
    outbidPushEnabled: boolean;
  } | null;
  flash: {
    defaultSource: string;
    maxConcurrent: number;
    defaultDurationHours: number;
  };
  dealRadarLimits: { free: number; basic: number; pro: number };
  geo: { defaultRadiusKm: number; maxRadiusKm: number; userConfigurable: boolean };
  numberSystem: 'arabic' | 'latin';
  trust: {
    autoWatermark: boolean;
    duplicateDetection: boolean;
    chatLinkDetection: boolean;
    chatEncryption: boolean;
  };
  moderation: {
    autoBanEnabled: boolean;
    humanReviewEnabled: boolean;
    reviewSlaHours: number;
  };
  /** Identity-verification AI auto-decision thresholds (scores 0–1). */
  verification: {
    autoDecisionEnabled: boolean;
    ocrApprove: number;
    livenessApprove: number;
    faceMatchApprove: number;
    rejectFloor: number;
  };
  localeDefault: 'ar' | 'en';
  currencyDefault: string;
  adExpiryDays: number;
  freeTierAdLimit: number;
}

/** `GET /admin/settings` → `{ settings: SystemSettingsDTO }`. */
export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { settings } = await get<{ settings: SystemSettingsDTO }>('/admin/settings');
      return settings;
    },
    staleTime: 60_000,
  });
}

/** `PUT /admin/settings` — partial update; returns the full updated settings. */
export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SystemSettingsDTO>) =>
      put<{ settings: SystemSettingsDTO }>('/admin/settings', payload).then((r) => r.settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-settings'] }),
  });
}
