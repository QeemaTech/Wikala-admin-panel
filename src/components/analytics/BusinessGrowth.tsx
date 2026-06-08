'use client';

import { KpiCard } from '@/components/ui/KpiCard';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { AreaChart } from '@/components/charts/AreaChart';
import { formatCurrencyMinor } from '@/lib/i18n/format';
import { RANGE_LABEL } from '@/components/analytics/RangeToggle';
import type { AnalyticsRevenue, AnalyticsRange } from '@/features/analytics/use-analytics';

const DELTA_LABEL: Record<AnalyticsRange, string> = {
  '7d': 'مقارنة بالأسبوع السابق',
  '30d': 'مقارنة بالشهر السابق',
  '90d': 'مقارنة بالربع السابق',
};

/** "YYYY-MM-DD" → "DD/MM" for compact axis labels. */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : iso;
}

interface BusinessGrowthProps {
  data: AnalyticsRevenue;
  range: AnalyticsRange;
}

export function BusinessGrowth({ data, range }: BusinessGrowthProps) {
  const deltaLabel = DELTA_LABEL[range];
  const labels = data.ads.series.labels.map(shortDate);
  const values = data.ads.series.values;
  const hasSeries = values.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
        <KpiCard
          label="نمو الإعلانات"
          value={data.ads.newInRange}
          icon={<Icon name="shopping-bag" size={18} />}
          tintColor="#226199"
          unit="إعلان"
          delta={data.ads.delta}
          deltaLabel={deltaLabel}
        />
        <KpiCard
          label="المشتركون المدفوعون"
          value={data.subscriptions.activePaid}
          icon={<Icon name="crown" size={18} />}
          tintColor="#7a4cc4"
          unit="مشترك"
          delta={data.subscriptions.delta}
          deltaLabel={`${data.subscriptions.newInRange > 0 ? '+' : ''}${data.subscriptions.newInRange} جديد · ${deltaLabel}`}
        />
        <KpiCard
          label="إيرادات الاشتراكات"
          value={data.revenue.plansMinor}
          icon={<Icon name="credit-card" size={18} />}
          tintColor="#1f9c63"
          formatter={formatCurrencyMinor}
          delta={data.revenue.plansDelta}
          deltaLabel={deltaLabel}
        />
        <KpiCard
          label="إيرادات التعزيز"
          value={data.revenue.boostsMinor}
          icon={<Icon name="flame" size={18} />}
          tintColor="#d98a17"
          formatter={formatCurrencyMinor}
          delta={data.revenue.boostsDelta}
          deltaLabel={deltaLabel}
        />
      </div>

      <Card
        title="نمو الإعلانات المنشورة"
        sub={RANGE_LABEL[range]}
        actions={
          <span className="text-[12.5px] text-muted">
            إجمالي الإيرادات:{' '}
            <b className="font-mono text-ink">{formatCurrencyMinor(data.revenue.totalMinor)}</b>
          </span>
        }
      >
        {hasSeries ? (
          <AreaChart labels={labels} values={values} height={200} tooltipLabel="إعلانات" />
        ) : (
          <div className="grid h-[200px] place-items-center text-[13px] text-muted">
            لا توجد إعلانات منشورة في هذه الفترة
          </div>
        )}
      </Card>
    </div>
  );
}
