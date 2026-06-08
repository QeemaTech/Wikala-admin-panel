'use client';

import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/forms/Field';
import type { SystemSettingsDTO } from '@/features/settings/use-system-settings';

interface DealRadarLimitsPanelProps {
  settings: SystemSettingsDTO;
  onChange: (patch: Partial<SystemSettingsDTO>) => void;
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink">{title}</div>
        <div className="mt-0.5 text-[12px] leading-relaxed text-muted">{desc}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

const numInput =
  'w-[60px] rounded-[8px] border border-border bg-surface px-2 py-1.5 text-center font-mono text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10';

/**
 * Deal Radar saved-search limits per tier + geo notification radius (TASK-F-15.7).
 * Persists to `dealRadarLimits` and `geo.userConfigurable` on system settings.
 */
export function DealRadarLimitsPanel({ settings, onChange }: DealRadarLimitsPanelProps) {
  const limits = settings.dealRadarLimits;
  const proUnlimited = limits.pro === -1;

  const patchLimits = (p: Partial<SystemSettingsDTO['dealRadarLimits']>) =>
    onChange({ dealRadarLimits: { ...limits, ...p } });

  return (
    <Card title="حدود واستحقاق Deal Radar" sub="عدد التنبيهات المحفوظة لكل مستخدم" pad={false}>
      <div className="px-5">
        <Row title="الخطة المجانية" desc="عدد عمليات البحث المحفوظة بالحد الأقصى">
          <input
            type="number"
            min={0}
            max={10}
            value={limits.free}
            onChange={(e) => patchLimits({ free: Number(e.target.value) })}
            className={numInput}
          />
        </Row>

        <Row title="خطة Basic" desc="باقة الاشتراك الأساسية">
          <input
            type="number"
            min={1}
            max={50}
            value={limits.basic}
            onChange={(e) => patchLimits({ basic: Number(e.target.value) })}
            className={numInput}
          />
        </Row>

        <Row title="خطة Pro" desc="باقة الاشتراك المتقدمة">
          <label className="flex items-center gap-2 text-[12px] text-muted">
            غير محدود
            <Switch
              checked={proUnlimited}
              onChange={(on) => patchLimits({ pro: on ? -1 : 25 })}
            />
          </label>
          {!proUnlimited && (
            <input
              type="number"
              min={1}
              value={limits.pro}
              onChange={(e) => patchLimits({ pro: Number(e.target.value) })}
              className={numInput}
            />
          )}
        </Row>

        <Row title="نطاق الإشعار الجغرافي" desc='المسافة التي يُعتبر فيها الإعلان "قريب"'>
          <select
            value={settings.geo.userConfigurable ? 'user' : 'fixed'}
            onChange={(e) => onChange({ geo: { ...settings.geo, userConfigurable: e.target.value === 'user' } })}
            className="rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
          >
            <option value="fixed">{settings.geo.defaultRadiusKm} كم (ثابت)</option>
            <option value="user">قابل للتخصيص من المستخدم</option>
          </select>
        </Row>
      </div>
    </Card>
  );
}
