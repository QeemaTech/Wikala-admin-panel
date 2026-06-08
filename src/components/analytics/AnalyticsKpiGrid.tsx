import { KpiCard } from '@/components/ui/KpiCard';
import { Icon } from '@/components/ui/Icon';
import { formatPercent, formatDurationShort } from '@/lib/i18n/format';
import type { AnalyticsOverview, AnalyticsRange } from '@/features/analytics/use-analytics';

const DELTA_LABEL: Record<AnalyticsRange, string> = {
  '7d': 'مقارنة بالأسبوع السابق',
  '30d': 'مقارنة بالشهر السابق',
  '90d': 'مقارنة بالربع السابق',
};

interface AnalyticsKpiGridProps {
  data: AnalyticsOverview;
  range: AnalyticsRange;
}

export function AnalyticsKpiGrid({ data, range }: AnalyticsKpiGridProps) {
  const deltaLabel = DELTA_LABEL[range];
  const { kpis, deltas } = data;

  return (
    <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
      <KpiCard
        label="الجلسات اليومية"
        value={kpis.dailySessions}
        icon={<Icon name="activity" size={18} />}
        tintColor="#226199"
        unit="جلسة"
        delta={deltas.dailySessions}
        deltaLabel={deltaLabel}
      />
      <KpiCard
        label="مدة الجلسة المتوسطة"
        value={kpis.avgSessionSec == null ? 'غير متاح' : formatDurationShort(kpis.avgSessionSec)}
        icon={<Icon name="clock" size={18} />}
        tintColor="#178a8a"
        delta={deltas.avgSessionSec}
        deltaLabel={deltaLabel}
      />
      <KpiCard
        label="معدل التحويل لإعلان"
        value={kpis.conversionRate == null ? 'غير متاح' : formatPercent(kpis.conversionRate, 2)}
        icon={<Icon name="shopping-bag" size={18} />}
        tintColor="#1f9c63"
        delta={deltas.conversionRate}
        deltaLabel={deltaLabel}
      />
      <KpiCard
        label="معدل النشر لكل مشاهد"
        value={kpis.listingRatePerViewer == null ? 'غير متاح' : formatPercent(kpis.listingRatePerViewer, 1)}
        icon={<Icon name="sparkles" size={18} />}
        tintColor="#7a4cc4"
        delta={deltas.listingRatePerViewer}
        deltaLabel={deltaLabel}
      />
    </div>
  );
}
