'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Segmented } from '@/components/ui/Segmented';
import { KpiCard } from '@/components/ui/KpiCard';
import { AreaChart } from '@/components/charts/AreaChart';
import { AdLocationMap } from '@/components/map/AdLocationMap';
import { formatNumber } from '@/lib/i18n/format';
import { EMPTY_FILTERS } from '@/features/search/use-search-filters';
import {
  useCategoryAnalytics,
  type AnalyticsRangeDays,
} from '@/features/categories/use-category-analytics';
import type { CategoryDTO } from '@/features/categories/use-categories';

interface CategoryAnalyticsDrawerProps {
  category: CategoryDTO;
  onClose: () => void;
}

const RANGE_OPTIONS = [
  { value: '7', label: '٧ أيام' },
  { value: '30', label: '٣٠ يوم' },
  { value: '90', label: '٩٠ يوم' },
];

/**
 * Per-category drill-down opened from a category tile. Renders the REAL backed
 * subset: ad-volume area chart + total ads (from /admin/analytics/categories),
 * a top sub-categories breakdown (from the category's children ad counts), and
 * a category-filtered ad-location map. Conversion/session metrics do NOT exist
 * per-category in the backend — surfaced as an explicit "not available" state
 * rather than fabricated (see Week 6 gap analysis).
 */
export function CategoryAnalyticsDrawer({ category, onClose }: CategoryAnalyticsDrawerProps) {
  const [days, setDays] = useState<AnalyticsRangeDays>(30);
  const { data, isLoading, isError } = useCategoryAnalytics(days);

  const row = useMemo(
    () => data?.find((r) => r.categoryId === category.id) ?? null,
    [data, category.id],
  );

  const sparkline = row?.sparkline ?? [];
  const labels = sparkline.map((s) => s.date.slice(5)); // MM-DD
  const values = sparkline.map((s) => s.count);

  // Top sub-categories by ad count — real data from the category's children.
  const topSubs = useMemo(
    () => [...category.children].sort((a, b) => b.adCount - a.adCount).slice(0, 6),
    [category.children],
  );
  const maxSub = topSubs[0]?.adCount || 1;

  const mapFilters = useMemo(
    () => ({ ...EMPTY_FILTERS, categoryId: category.id }),
    [category.id],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/30" role="dialog" aria-modal="true">
      {/* Backdrop click closes */}
      <button type="button" aria-label="إغلاق" className="flex-1" onClick={onClose} />

      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-[10px]"
              style={{ background: `linear-gradient(135deg, ${category.color}22, ${category.color}55)` }}
            >
              <CategoryIcon glyph={category.glyph} size={24} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-ink">{category.nameAr}</h2>
              <p className="text-[12px] text-muted">تحليلات الفئة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] p-1.5 text-muted hover:bg-surface-2"
            aria-label="إغلاق"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Range toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-ink">حجم الإعلانات عبر الزمن</h3>
            <Segmented
              options={RANGE_OPTIONS}
              value={String(days)}
              onChange={(v) => setDays(Number(v) as AnalyticsRangeDays)}
            />
          </div>

          {/* Ad-volume chart */}
          <div className="rounded-[12px] border border-border bg-white p-4">
            {isLoading ? (
              <div className="h-[200px] animate-pulse rounded-[8px] bg-surface-2" />
            ) : isError ? (
              <div className="grid h-[200px] place-items-center text-center">
                <div>
                  <Icon name="alert-triangle" size={24} className="mx-auto text-red" />
                  <p className="mt-1.5 text-[12.5px] text-muted">تعذّر تحميل التحليلات</p>
                </div>
              </div>
            ) : sparkline.length === 0 ? (
              <div className="grid h-[200px] place-items-center text-center">
                <p className="text-[12.5px] text-muted">لا توجد بيانات في هذه الفترة</p>
              </div>
            ) : (
              <AreaChart labels={labels} values={values} height={200} color={category.color} fill={category.color} />
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KpiCard
              label="إجمالي الإعلانات"
              value={row?.totalAds ?? category.adCount}
              icon={<Icon name="grid" size={18} />}
              tintColor={category.color}
            />
            <KpiCard
              label="الأقسام الفرعية"
              value={category.subCount}
              icon={<Icon name="layers" size={18} />}
              tintColor="#226199"
            />
          </div>

          {/* Top sub-categories */}
          <div className="rounded-[12px] border border-border bg-white p-4">
            <h3 className="mb-3 text-[13px] font-semibold text-ink">أعلى الأقسام الفرعية</h3>
            {topSubs.length === 0 ? (
              <p className="py-3 text-center text-[12.5px] text-muted">لا توجد أقسام فرعية</p>
            ) : (
              <div className="space-y-2.5">
                {topSubs.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-[12.5px] text-ink">{sub.nameAr}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(4, (sub.adCount / maxSub) * 100)}%`, backgroundColor: category.color }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-end font-mono text-[12px] text-muted">
                      {formatNumber(sub.adCount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conversion / session — not available per-category in the backend */}
          <div className="rounded-[12px] border border-dashed border-border bg-surface-2 p-4">
            <div className="flex items-start gap-2.5">
              <Icon name="help" size={16} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <h4 className="text-[12.5px] font-semibold text-ink">معدّل التحويل ومقاييس الجلسات</h4>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  غير متاحة على مستوى الفئة حاليًا — يوفّر الـ API هذه المقاييس بشكل إجمالي فقط
                  (<span dir="ltr" className="font-mono">/admin/analytics/overview</span>). بانتظار دعم تقسيمها حسب الفئة من الخادم.
                </p>
              </div>
            </div>
          </div>

          {/* Category-filtered ad-location map */}
          <div>
            <h3 className="mb-2.5 text-[13px] font-semibold text-ink">مواقع الإعلانات</h3>
            <AdLocationMap filters={mapFilters} height={300} />
          </div>
        </div>
      </div>
    </div>
  );
}
