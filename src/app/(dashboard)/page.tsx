'use client';

import { useState, useCallback } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { RangeToggle } from '@/components/analytics/RangeToggle';
import { Icon } from '@/components/ui/Icon';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { TrafficChart } from '@/components/dashboard/TrafficChart';
import { CategoryDonut } from '@/components/dashboard/CategoryDonut';
import { QueuesCard } from '@/components/dashboard/QueuesCard';
import { ActivityFeedCard } from '@/components/dashboard/ActivityFeedCard';
import { RevenueCard } from '@/components/dashboard/RevenueCard';
import { TopCategoriesCard } from '@/components/dashboard/TopCategoriesCard';
import { TrustIndicatorsCard } from '@/components/dashboard/TrustIndicatorsCard';
import { useDashboard, type DashboardRange, type DashboardData } from '@/features/dashboard/use-dashboard';
import { exportCsv } from '@/lib/export/csv';
import { formatNumber, formatCurrencyMinor, formatPercent } from '@/lib/i18n/format';

const RANGE_LABEL: Record<DashboardRange, string> = {
  '7d': 'آخر 7 أيام',
  '30d': 'آخر 30 يوم',
  '90d': 'آخر 90 يوم',
};

function buildExportRows(data: DashboardData, range: DashboardRange) {
  const rangeLabel = RANGE_LABEL[range];
  const now = new Intl.DateTimeFormat('ar-SA', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

  const rows: Record<string, string>[] = [
    { المؤشر: 'الفترة', القيمة: rangeLabel },
    { المؤشر: 'تاريخ التصدير', القيمة: now },
    { المؤشر: '— مؤشرات الأداء الرئيسية —', القيمة: '' },
    { المؤشر: 'المستخدمون النشطون شهرياً', القيمة: formatNumber(data.kpis.monthlyActiveUsers) },
    { المؤشر: 'إعلانات جديدة', القيمة: formatNumber(data.kpis.newAds) },
    { المؤشر: 'إيرادات Boost', القيمة: formatCurrencyMinor(data.kpis.boostRevenueMinor) },
    { المؤشر: 'نسبة البلاغات', القيمة: formatPercent(data.kpis.reportRate) },
    ...(data.kpis.deltas.newAds != null
      ? [{ المؤشر: 'تغيّر الإعلانات (مقارنة بالفترة السابقة)', القيمة: formatPercent(data.kpis.deltas.newAds) }]
      : []),
    ...(data.kpis.deltas.newUsers != null
      ? [{ المؤشر: 'تغيّر المستخدمين الجدد', القيمة: formatPercent(data.kpis.deltas.newUsers) }]
      : []),
    { المؤشر: '— قوائم الانتظار —', القيمة: '' },
    { المؤشر: 'إعلانات للمراجعة', القيمة: formatNumber(data.queues.moderation) },
    { المؤشر: 'طلبات توثيق فردي', القيمة: formatNumber(data.queues.verificationsIndividual) },
    { المؤشر: 'طلبات توثيق متجر', القيمة: formatNumber(data.queues.verificationsStore) },
    { المؤشر: 'بلاغات نشطة', القيمة: formatNumber(data.queues.reportsOpen) },
    { المؤشر: 'مزادات تنتهي اليوم', القيمة: formatNumber(data.queues.auctionsEndingToday) },
    { المؤشر: '— إيرادات اليوم —', القيمة: '' },
    { المؤشر: 'الإجمالي', القيمة: formatCurrencyMinor(data.todayRevenue.totalMinor) },
    ...Object.entries(data.todayRevenue.byPackage).map(([pkg, amt]) => ({
      المؤشر: pkg,
      القيمة: formatCurrencyMinor(amt),
    })),
    ...(data.todayRevenue.subscriptions > 0
      ? [{ المؤشر: 'اشتراكات Pro', القيمة: formatCurrencyMinor(data.todayRevenue.subscriptions) }]
      : []),
    { المؤشر: '— مؤشرات الثقة —', القيمة: '' },
    { المؤشر: 'موثّقون', القيمة: formatNumber(data.trustIndicators.verified) },
    { المؤشر: 'مميّزون', القيمة: formatNumber(data.trustIndicators.premium) },
    { المؤشر: 'تحت المراقبة', القيمة: formatNumber(data.trustIndicators.monitored) },
    { المؤشر: 'محظورون', القيمة: formatNumber(data.trustIndicators.banned) },
    { المؤشر: '— الالتزام بالـ SLA (آخر 7 أيام) —', القيمة: '' },
    { المؤشر: 'بلاغات', القيمة: `${data.slaCompliance.reports7d}%` },
    { المؤشر: 'توثيقات', القيمة: `${data.slaCompliance.verifications7d}%` },
    { المؤشر: '— توزيع الفئات —', القيمة: '' },
    ...data.topCategoriesByTraffic.map((c) => ({
      المؤشر: c.name ?? 'أخرى',
      القيمة: formatNumber(c.count),
    })),
  ];

  return rows;
}

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>('30d');
  const { data, isLoading, isError } = useDashboard(range);

  const handleExport = useCallback(() => {
    if (!data) return;
    exportCsv(buildExportRows(data, range), `لوحة-التحكم-${range}`);
  }, [data, range]);

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
        <p className="rounded-[10px] bg-red-50 p-4 text-[13px] text-red">
          حدث خطأ أثناء تحميل لوحة التحكم. يرجى تحديث الصفحة.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="لوحة التحكم"
        sub="نظرة عامة على نشاط وكالة خلال آخر فترة"
        actions={
          <div className="flex items-center gap-2">
            <RangeToggle value={range} onChange={setRange} />
            <button
              onClick={handleExport}
              disabled={!data}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-[7px] text-[13px] font-medium text-ink shadow-sm transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              <Icon name="download" size={14} />
              تصدير التقرير
            </button>
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="space-y-5 animate-pulse">
          <div className="grid grid-cols-4 gap-[14px]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[104px] rounded-[var(--radius)] bg-surface" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 h-[280px] rounded-[var(--radius)] bg-surface" />
            <div className="h-[280px] rounded-[var(--radius)] bg-surface" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <KpiGrid kpis={data.kpis} range={range} />

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <TrafficChart
                labels={data.adVolumeSeries.labels}
                values={data.adVolumeSeries.values}
                range={range}
              />
            </div>
            <CategoryDonut distribution={data.categoryDistribution} />
          </div>

          <div className="grid grid-cols-3 gap-5">
            <QueuesCard queues={data.queues} />
            <ActivityFeedCard entries={data.recentActivity} />
            <RevenueCard
              totalMinor={data.todayRevenue.totalMinor}
              byPackage={data.todayRevenue.byPackage}
              subscriptions={data.todayRevenue.subscriptions}
              deltaVsYesterday={data.todayRevenue.deltaVsYesterday}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <TopCategoriesCard categories={data.topCategoriesByTraffic} />
            <TrustIndicatorsCard indicators={data.trustIndicators} slaCompliance={data.slaCompliance} />
          </div>
        </div>
      )}
    </div>
  );
}
