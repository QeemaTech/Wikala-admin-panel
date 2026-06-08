'use client';

import { Suspense } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { RangeToggle, useRangeParam } from '@/components/analytics/RangeToggle';
import { AnalyticsKpiGrid } from '@/components/analytics/AnalyticsKpiGrid';
import { BusinessGrowth } from '@/components/analytics/BusinessGrowth';
import { NewVsReturningChart } from '@/components/analytics/NewVsReturningChart';
import { AcquisitionSources } from '@/components/analytics/AcquisitionSources';
import { CategoryPerformanceTable } from '@/components/analytics/CategoryPerformanceTable';
import {
  useAnalyticsOverview,
  useAnalyticsUsers,
  useAnalyticsAcquisition,
  useAnalyticsCategories,
  useAnalyticsRevenue,
} from '@/features/analytics/use-analytics';
import { useAnalyticsExport } from '@/features/analytics/use-analytics-export';

function AnalyticsContent() {
  const [range, setRange] = useRangeParam();

  const overview = useAnalyticsOverview(range);
  const revenue = useAnalyticsRevenue(range);
  const users = useAnalyticsUsers(range);
  const acquisition = useAnalyticsAcquisition(range);
  const categories = useAnalyticsCategories(range);

  const runExport = useAnalyticsExport();
  const canExport = !!overview.data && !!categories.data;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="التحليلات"
        sub="نمو المنصة، سلوك المستخدمين، أداء الفئات"
        actions={
          <div className="flex items-center gap-2">
            <RangeToggle value={range} onChange={setRange} />
            <button
              onClick={() => {
                if (overview.data && categories.data)
                  runExport(overview.data, categories.data, range, revenue.data);
              }}
              disabled={!canExport}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-[7px] text-[13px] font-medium text-ink shadow-sm transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              <Icon name="download" size={14} />
              تصدير
            </button>
          </div>
        }
      />

      {overview.isError ? (
        <p className="rounded-[10px] bg-red-50 p-4 text-[13px] text-red">
          حدث خطأ أثناء تحميل التحليلات. يرجى تحديث الصفحة.
        </p>
      ) : (
        <div className="space-y-4">
          {overview.isLoading || !overview.data ? (
            <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[104px] animate-pulse rounded-[var(--radius)] bg-surface" />
              ))}
            </div>
          ) : (
            <AnalyticsKpiGrid data={overview.data} range={range} />
          )}

          <div>
            <h2 className="mb-3 mt-2 text-[15px] font-semibold text-ink">نمو الأعمال والإيرادات</h2>
            {revenue.isLoading || !revenue.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[104px] animate-pulse rounded-[var(--radius)] bg-surface" />
                  ))}
                </div>
                <div className="h-[280px] animate-pulse rounded-[var(--radius)] bg-surface" />
              </div>
            ) : (
              <BusinessGrowth data={revenue.data} range={range} />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {users.isLoading || !users.data ? (
              <div className="h-[300px] animate-pulse rounded-[var(--radius)] bg-surface" />
            ) : (
              <NewVsReturningChart data={users.data} range={range} />
            )}
            {acquisition.isLoading || !acquisition.data ? (
              <div className="h-[300px] animate-pulse rounded-[var(--radius)] bg-surface" />
            ) : (
              <AcquisitionSources data={acquisition.data} />
            )}
          </div>

          {categories.isLoading || !categories.data ? (
            <div className="h-[280px] animate-pulse rounded-[var(--radius)] bg-surface" />
          ) : (
            <CategoryPerformanceTable categories={categories.data} />
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  // useRangeParam reads search params → must be inside a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  );
}
