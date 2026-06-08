import { describe, expect, it } from 'vitest';
import { buildAnalyticsExportRows } from './use-analytics-export';
import type { AnalyticsOverview, AnalyticsRevenue, CategoryPerformance } from './use-analytics';

const revenue: AnalyticsRevenue = {
  ads: { newInRange: 14827, delta: 0.06, series: { labels: ['2026-06-01'], values: [120] } },
  subscriptions: { activePaid: 412, newInRange: 38, delta: 0.1 },
  revenue: {
    plansMinor: 4200000,
    boostsMinor: 1425800,
    totalMinor: 5625800,
    plansDelta: 0.12,
    boostsDelta: -0.03,
    totalDelta: 0.08,
  },
  currency: 'SAR',
  range: '30d',
  days: 30,
};

const overview: AnalyticsOverview = {
  kpis: { dailySessions: 24810, avgSessionSec: 402, conversionRate: 0.0342, listingRatePerViewer: 0.148 },
  deltas: { dailySessions: 0.082, avgSessionSec: 0.05, conversionRate: null, listingRatePerViewer: 0.021 },
  range: '30d',
  days: 30,
};

const categories: CategoryPerformance[] = [
  {
    categoryId: 'c1',
    nameAr: 'الهواتف',
    nameEn: 'Phones',
    totalAds: 12603,
    sessions: 34210,
    conversionRate: 0.048,
    avgPriceMinor: 1840000,
    priceCurrency: 'EGP',
    sparkline: [{ date: '2026-06-01', count: 3 }],
  },
  {
    categoryId: 'c2',
    nameAr: 'وظائف',
    nameEn: null,
    totalAds: 3309,
    sessions: 12420,
    conversionRate: null,
    avgPriceMinor: null,
    priceCurrency: null,
    sparkline: [],
  },
];

describe('buildAnalyticsExportRows', () => {
  it('emits Arabic-headed KPI rows then one row per category', () => {
    const rows = buildAnalyticsExportRows(overview, categories, '30d');

    // Every row has exactly the two Arabic columns.
    for (const row of rows) {
      expect(Object.keys(row)).toEqual(['المؤشر', 'القيمة']);
    }

    const byMetric = Object.fromEntries(rows.map((r) => [r.المؤشر, r.القيمة]));
    expect(byMetric['الجلسات اليومية']).toBeTruthy();
    expect(byMetric['مدة الجلسة المتوسطة']).toBeTruthy();
    expect(byMetric['معدل النشر لكل مشاهد']).toBeTruthy();
    // One row per category, keyed by Arabic name.
    expect(byMetric['الهواتف']).toContain('إعلانات');
    expect(byMetric['وظائف']).toContain('تحويل: —');
  });

  it('appends real business-growth + revenue rows when revenue is provided', () => {
    const rows = buildAnalyticsExportRows(overview, categories, '30d', revenue);
    const byMetric = Object.fromEntries(rows.map((r) => [r.المؤشر, r.القيمة]));
    expect(byMetric['نمو الإعلانات']).toBeTruthy();
    expect(byMetric['المشتركون المدفوعون']).toBeTruthy();
    expect(byMetric['إيرادات الاشتراكات']).toBeTruthy();
    expect(byMetric['إيرادات التعزيز']).toBeTruthy();
    expect(byMetric['إجمالي الإيرادات']).toBeTruthy();
    // The business-growth section header is emitted only with revenue.
    expect(byMetric['— نمو الأعمال والإيرادات —']).toBe('');
  });

  it('omits the revenue section when no revenue is passed', () => {
    const rows = buildAnalyticsExportRows(overview, categories, '30d');
    expect(rows.some((r) => r.المؤشر === '— نمو الأعمال والإيرادات —')).toBe(false);
  });

  it('renders "غير متاح" for a null platform conversion rate', () => {
    const rows = buildAnalyticsExportRows(
      { ...overview, kpis: { ...overview.kpis, conversionRate: null } },
      [],
      '7d',
    );
    const conv = rows.find((r) => r.المؤشر === 'معدل التحويل لإعلان');
    expect(conv?.القيمة).toBe('غير متاح');
  });
});
