'use client';

import { Card } from '@/components/ui/Card';
import type { SystemSettingsDTO } from '@/features/settings/use-system-settings';

interface SecuritySettingsPanelProps {
  settings: SystemSettingsDTO;
  onChange: (patch: Partial<SystemSettingsDTO>) => void;
}

interface NumRowProps {
  title: string;
  desc: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (v: number) => void;
}

function NumRow({ title, desc, value, min, max, suffix, onChange }: NumRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink">{title}</div>
        <div className="mt-0.5 text-[12px] leading-relaxed text-muted">{desc}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          dir="ltr"
          className="w-24 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-center font-mono text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
        {suffix && <span className="text-[12px] text-muted">{suffix}</span>}
      </div>
    </div>
  );
}

/**
 * Security settings (TASK-F-15.8): JWT access/refresh TTLs + max OTP attempts.
 * Not in the visual prototype — driven by the contract's `SystemSettingsDTO.security`.
 */
export function SecuritySettingsPanel({ settings, onChange }: SecuritySettingsPanelProps) {
  const sec = settings.security;
  const patchSecurity = (p: Partial<SystemSettingsDTO['security']>) =>
    onChange({ security: { ...sec, ...p } });

  return (
    <Card title="إعدادات الأمان" sub="مدد صلاحية الجلسات وحدود محاولات التحقق" pad={false}>
      <div className="px-5">
        <NumRow
          title="مدة صلاحية رمز الوصول"
          desc="مدة صلاحية access token قبل التجديد"
          value={sec.jwtAccessTtlSec}
          min={60}
          max={86400}
          suffix="ثانية"
          onChange={(v) => patchSecurity({ jwtAccessTtlSec: v })}
        />
        <NumRow
          title="مدة صلاحية رمز التجديد"
          desc="مدة بقاء جلسة المستخدم قبل إعادة تسجيل الدخول"
          value={sec.refreshTtlSec}
          min={3600}
          max={31536000}
          suffix="ثانية"
          onChange={(v) => patchSecurity({ refreshTtlSec: v })}
        />
        <NumRow
          title="الحد الأقصى لمحاولات OTP"
          desc="عدد المحاولات الخاطئة قبل الحظر المؤقت"
          value={sec.otpAttemptsMax}
          min={1}
          max={10}
          onChange={(v) => patchSecurity({ otpAttemptsMax: v })}
        />
      </div>
    </Card>
  );
}
