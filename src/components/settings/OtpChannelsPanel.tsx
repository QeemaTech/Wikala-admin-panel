'use client';

import { Switch } from '@/components/forms/Field';
import { SettingsSection } from './SettingsSection';
import type { SystemSettingsDTO } from '@/features/settings/use-system-settings';

/** OTP channel codes surfaced as toggles, matching the prototype's 3 rows. */
const CHANNELS: { code: string; title: string; desc: string }[] = [
  { code: 'WHATSAPP', title: 'WhatsApp', desc: 'تفعيل إرسال رموز التحقق عبر واتساب' },
  { code: 'EMAIL', title: 'البريد الإلكتروني', desc: 'للتسجيل عبر البريد' },
  { code: 'CALL', title: 'مكالمة هاتفية', desc: 'لاسترجاع كلمة المرور' },
];

interface OtpChannelsPanelProps {
  settings: SystemSettingsDTO;
  onChange: (patch: Partial<SystemSettingsDTO>) => void;
}

/**
 * OTP channel toggles (TASK-F-15.8). Backed by the flat `otpChannels` array on
 * system settings — toggling a row adds/removes its channel code.
 */
export function OtpChannelsPanel({ settings, onChange }: OtpChannelsPanelProps) {
  const enabled = new Set(settings.otpChannels);

  const toggle = (code: string, on: boolean) => {
    const next = new Set(enabled);
    if (on) next.add(code);
    else next.delete(code);
    onChange({ otpChannels: [...next] });
  };

  return (
    <SettingsSection
      title="قنوات OTP"
      rows={CHANNELS.map((ch) => ({
        title: ch.title,
        desc: ch.desc,
        control: <Switch checked={enabled.has(ch.code)} onChange={(on) => toggle(ch.code, on)} />,
      }))}
    />
  );
}
