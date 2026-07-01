'use client';

import { Card } from '@/components/ui/Card';
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
 * Free-tier Deal Radar saved-search limit + geo notification radius (TASK-F-15.7).
 * Persists to `dealRadarLimits.free` and `geo.userConfigurable` on system settings.
 * Paid-plan radar limits live on their PlanConfig (edited from the Plans page) and
 * are the values actually enforced for subscribers — they are NOT set here.
 */
export function DealRadarLimitsPanel({ settings, onChange }: DealRadarLimitsPanelProps) {
  const limits = settings.dealRadarLimits;

  const patchLimits = (p: Partial<SystemSettingsDTO['dealRadarLimits']>) =>
    onChange({ dealRadarLimits: { ...limits, ...p } });

  return (
    <Card title="حدود واستحقاق Deal Radar" sub="الحد المجاني لعمليات البحث المحفوظة — حدود الباقات المدفوعة تُدار من صفحة الباقات" pad={false}>
      <div className="px-5">
        <Row title="الخطة المجانية" desc="عدد عمليات البحث المحفوظة للمستخدم غير المشترك (0 = لا يوجد)">
          <input
            type="number"
            min={0}
            max={10}
            value={limits.free}
            onChange={(e) => patchLimits({ free: Number(e.target.value) })}
            className={numInput}
          />
        </Row>

        <p className="border-b border-border py-3.5 text-[12px] leading-relaxed text-muted">
          حدود الباقات المدفوعة (Basic وPro وأي باقة أخرى) تُضبط من{' '}
          <span className="font-medium text-ink">صفحة الباقات</span>؛ القيمة المحددة لكل باقة هناك هي المطبَّقة فعليًا على المشتركين.
        </p>

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
