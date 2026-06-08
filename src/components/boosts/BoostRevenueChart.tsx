'use client';

import { Card } from '@/components/ui/Card';
import { AreaChart } from '@/components/charts/AreaChart';
import { formatAmountMinor } from '@/lib/i18n/format';
import { useBoostRevenue } from '@/features/boosts/use-boosts';

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat(AR_GREG, { day: 'numeric', month: 'short' })
    .format(new Date(iso))
    .replace(BIDI, '');
}

export function BoostRevenueChart() {
  const { data: series, isLoading, isError } = useBoostRevenue(30);

  const hasData = !!series && series.some((p) => p.totalMinor > 0);

  return (
    <Card title="مبيعات التعزيز — آخر 30 يوم">
      {isLoading ? (
        <div className="h-[220px] animate-pulse rounded-[10px] bg-surface-2" />
      ) : isError ? (
        <div className="grid h-[220px] place-items-center text-[13px] text-muted">
          تعذّر تحميل بيانات الإيرادات
        </div>
      ) : !hasData ? (
        <div className="grid h-[220px] place-items-center text-[13px] text-muted">
          لا توجد مبيعات تعزيز خلال آخر 30 يوم
        </div>
      ) : (
        <AreaChart
          labels={series!.map((p) => dayLabel(p.date))}
          values={series!.map((p) => p.totalMinor)}
          color="#d98a17"
          fill="#d98a17"
          height={220}
          tooltipLabel="الإيراد"
          valueFormatter={formatAmountMinor}
        />
      )}
    </Card>
  );
}
