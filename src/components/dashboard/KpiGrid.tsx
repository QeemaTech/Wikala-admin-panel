import { KpiCard } from '@/components/ui/KpiCard';
import { Icon } from '@/components/ui/Icon';
import { formatCurrencyMinor, formatPercent } from '@/lib/i18n/format';
import type { DashboardKpis, DashboardRange } from '@/features/dashboard/use-dashboard';

const DELTA_LABEL: Record<DashboardRange, string> = {
  '7d': 'مقارنة بالأسبوع السابق',
  '30d': 'مقارنة بالشهر السابق',
  '90d': 'مقارنة بالربع السابق',
};

interface KpiGridProps {
  kpis: DashboardKpis;
  range: DashboardRange;
}

export function KpiGrid({ kpis, range }: KpiGridProps) {
  const deltaLabel = DELTA_LABEL[range];
  return (
    <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
      <KpiCard
        label="المستخدمون النشطون شهرياً"
        value={kpis.monthlyActiveUsers}
        icon={<Icon name="users" size={18} />}
        tintColor="#226199"
        unit="مستخدم"
        delta={kpis.deltas.newUsers}
        deltaLabel={deltaLabel}
      />
      <KpiCard
        label="الإعلانات الجديدة"
        value={kpis.newAds}
        icon={<Icon name="shopping-bag" size={18} />}
        tintColor="#1f9c63"
        delta={kpis.deltas.newAds}
        deltaLabel={deltaLabel}
        unit="إعلان"
      />
      <KpiCard
        label="إيرادات التعزيز"
        value={kpis.boostRevenueMinor}
        icon={<Icon name="flame" size={18} />}
        tintColor="#d98a17"
        formatter={formatCurrencyMinor}
        unit="ر.س"
        delta={kpis.deltas.boostRevenue}
        deltaLabel={deltaLabel}
      />
      <KpiCard
        label="معدل البلاغات"
        value={kpis.reportRate}
        icon={<Icon name="shield-alert" size={18} />}
        tintColor="#d44030"
        formatter={(v) => formatPercent(v, 2)}
        unit="%"
        delta={kpis.deltas.reportRate}
        deltaLabel={deltaLabel}
      />
    </div>
  );
}
