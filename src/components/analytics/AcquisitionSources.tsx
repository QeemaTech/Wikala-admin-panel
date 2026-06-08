'use client';

import { Card } from '@/components/ui/Card';
import { BarRow } from '@/components/ui/BarRow';
import { Icon } from '@/components/ui/Icon';
import { formatNumber, formatPercent } from '@/lib/i18n/format';
import type { AnalyticsAcquisition } from '@/features/analytics/use-analytics';

const SOURCE_COLORS = ['#226199', '#1f9c63', '#d44030', '#7a4cc4', '#178a8a', '#d98a17'];

/** Arabic labels for known acquisition channels; unknown keys pass through. */
const SOURCE_LABELS: Record<string, string> = {
  direct: 'إحالات مباشرة',
  organic: 'بحث عضوي',
  google: 'بحث Google',
  meta: 'إعلانات Meta',
  facebook: 'إعلانات Meta',
  tiktok: 'TikTok',
  other: 'مصادر أخرى',
};

interface AcquisitionSourcesProps {
  data: AnalyticsAcquisition;
}

export function AcquisitionSources({ data }: AcquisitionSourcesProps) {
  const hasData = data.tracked && data.sources.length > 0;

  return (
    <Card title="مصادر التحميل" sub="من أين يأتي مستخدمو وكالة">
      {hasData ? (
        <div className="space-y-3.5">
          {data.sources.map((s, i) => (
            <BarRow
              key={s.source}
              label={SOURCE_LABELS[s.source] ?? s.source}
              value={s.percentage}
              max={100}
              color={SOURCE_COLORS[i % SOURCE_COLORS.length]}
              right={`${formatPercent(s.percentage / 100, 0)} · ${formatNumber(s.count)}`}
            />
          ))}
        </div>
      ) : (
        <div className="grid place-items-center gap-2 py-10 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted">
            <Icon name="pie-chart" size={18} />
          </span>
          <p className="text-[13px] font-medium text-ink-2">غير متاح حالياً</p>
          <p className="max-w-[260px] text-[12px] text-muted">
            لا يوجد تتبّع لمصادر التحميل بعد. يتطلب ذلك تفعيل تتبّع مصدر التسجيل (UTM) في الخادم.
          </p>
        </div>
      )}
    </Card>
  );
}
