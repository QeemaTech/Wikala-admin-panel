'use client';

import { KpiCard } from '@/components/ui/KpiCard';
import { Icon } from '@/components/ui/Icon';
import { formatCompactMinor } from '@/lib/i18n/format';
import { useAuctionsKpi } from '@/features/auctions/use-auctions';

/** Auctions KPI strip (design: pages-catalog Auctions). */
export function AuctionsKpiStrip() {
  const { data, isLoading, isError } = useAuctionsKpi();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[104px] rounded-[var(--radius)] bg-surface" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface py-8 text-center">
        <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
        <p className="mt-2 text-[12.5px] text-muted">تعذّر تحميل مؤشرات المزادات</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
      <KpiCard label="مزادات نشطة" value={data.active} icon={<Icon name="gavel" size={18} />} tintColor="#226199" />
      <KpiCard label="إجمالي المزايدات اليوم" value={data.todayBids} icon={<Icon name="activity" size={18} />} tintColor="#1f9c63" />
      <KpiCard
        label="قيمة المزادات النشطة"
        value={data.totalValueMinor}
        formatter={formatCompactMinor}
        icon={<Icon name="wallet" size={18} />}
        tintColor="#d98a17"
      />
      <KpiCard label="مزادات تنتهي قريباً" value={data.endingSoon} icon={<Icon name="clock" size={18} />} tintColor="#d44030" />
    </div>
  );
}
