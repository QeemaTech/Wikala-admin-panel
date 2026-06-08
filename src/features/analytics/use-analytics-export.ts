import { useCallback } from 'react';
import { exportCsv } from '@/lib/export/csv';
import { formatAmountMinor, formatCurrencyMinor, formatNumber, formatPercent, formatDurationShort } from '@/lib/i18n/format';
import { RANGE_LABEL } from '@/components/analytics/RangeToggle';
import type {
  AnalyticsOverview,
  AnalyticsRange,
  AnalyticsRevenue,
  CategoryPerformance,
} from '@/features/analytics/use-analytics';

/** Two Arabic columns (المؤشر/القيمة); indexable so it satisfies `exportCsv`. */
export type AnalyticsExportRow = Record<string, string>;

/**
 * Builds the analytics CSV payload (KPIs + per-category performance) for the
 * selected range. Pure — unit-tested for shape. Only real values are emitted;
 * untracked metrics (e.g. conversion when no views) render "غير متاح".
 */
export function buildAnalyticsExportRows(
  overview: AnalyticsOverview,
  categories: CategoryPerformance[],
  range: AnalyticsRange,
  revenue?: AnalyticsRevenue,
): AnalyticsExportRow[] {
  const k = overview.kpis;
  const rows: AnalyticsExportRow[] = [
    { المؤشر: 'الفترة', القيمة: RANGE_LABEL[range] },
    { المؤشر: '— مؤشرات الأداء —', القيمة: '' },
    { المؤشر: 'الجلسات اليومية', القيمة: formatNumber(k.dailySessions) },
    {
      المؤشر: 'مدة الجلسة المتوسطة',
      القيمة: k.avgSessionSec == null ? 'غير متاح' : formatDurationShort(k.avgSessionSec),
    },
    {
      المؤشر: 'معدل التحويل لإعلان',
      القيمة: k.conversionRate == null ? 'غير متاح' : formatPercent(k.conversionRate, 2),
    },
    {
      المؤشر: 'معدل النشر لكل مشاهد',
      القيمة: k.listingRatePerViewer == null ? 'غير متاح' : formatPercent(k.listingRatePerViewer, 1),
    },
  ];

  if (revenue) {
    rows.push(
      { المؤشر: '— نمو الأعمال والإيرادات —', القيمة: '' },
      { المؤشر: 'نمو الإعلانات', القيمة: formatNumber(revenue.ads.newInRange) },
      { المؤشر: 'المشتركون المدفوعون', القيمة: formatNumber(revenue.subscriptions.activePaid) },
      { المؤشر: 'مشتركون جدد', القيمة: formatNumber(revenue.subscriptions.newInRange) },
      { المؤشر: 'إيرادات الاشتراكات', القيمة: formatCurrencyMinor(revenue.revenue.plansMinor) },
      { المؤشر: 'إيرادات التعزيز', القيمة: formatCurrencyMinor(revenue.revenue.boostsMinor) },
      { المؤشر: 'إجمالي الإيرادات', القيمة: formatCurrencyMinor(revenue.revenue.totalMinor) },
    );
  }

  rows.push({ المؤشر: '— أداء الفئات —', القيمة: '' });

  for (const cat of categories) {
    const price = cat.avgPriceMinor == null ? '—' : `${formatAmountMinor(cat.avgPriceMinor)} ${cat.priceCurrency ?? ''}`.trim();
    const conv = cat.conversionRate == null ? '—' : formatPercent(cat.conversionRate, 1);
    rows.push({
      المؤشر: cat.nameAr,
      القيمة: `إعلانات: ${formatNumber(cat.totalAds)} · جلسات: ${formatNumber(cat.sessions)} · تحويل: ${conv} · متوسط السعر: ${price}`,
    });
  }

  return rows;
}

export function useAnalyticsExport() {
  return useCallback(
    (
      overview: AnalyticsOverview,
      categories: CategoryPerformance[],
      range: AnalyticsRange,
      revenue?: AnalyticsRevenue,
    ) => {
      const rows = buildAnalyticsExportRows(overview, categories, range, revenue);
      exportCsv(rows, `التحليلات-${range}`);
    },
    [],
  );
}
