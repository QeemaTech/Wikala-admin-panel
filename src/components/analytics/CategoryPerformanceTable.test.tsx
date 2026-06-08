import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CategoryPerformanceTable } from './CategoryPerformanceTable';
import type { CategoryPerformance } from '@/features/analytics/use-analytics';

const categories: CategoryPerformance[] = [
  {
    categoryId: 'c1',
    nameAr: 'الهواتف',
    nameEn: 'Phones',
    totalAds: 12603,
    sessions: 9000,
    conversionRate: 0.048,
    avgPriceMinor: 1840000,
    priceCurrency: 'EGP',
    sparkline: [{ date: '2026-06-01', count: 3 }, { date: '2026-06-02', count: 6 }],
  },
  {
    categoryId: 'c2',
    nameAr: 'العقارات',
    nameEn: null,
    totalAds: 8412,
    sessions: 21000,
    conversionRate: null,
    avgPriceMinor: null,
    priceCurrency: null,
    sparkline: [],
  },
];

/** Reads the category name from each body row, top to bottom. */
function rowOrder(): string[] {
  const rows = screen.getAllByRole('row').slice(1); // drop header
  return rows.map((r) => within(r).getAllByRole('cell')[0].textContent ?? '');
}

describe('CategoryPerformanceTable', () => {
  it('renders a row per category with conversion chip and price dash', () => {
    renderWithProviders(<CategoryPerformanceTable categories={categories} />);
    expect(screen.getByText('الهواتف')).toBeInTheDocument();
    expect(screen.getByText('العقارات')).toBeInTheDocument();
    // null avgPrice + null conversion render an em dash, not a fabricated value.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('defaults to published-ads desc, and re-sorts when a column header is clicked', () => {
    renderWithProviders(<CategoryPerformanceTable categories={categories} />);
    // Default: totalAds desc → الهواتف (12603) before العقارات (8412).
    expect(rowOrder()).toEqual(['الهواتف', 'العقارات']);

    // Click "الجلسات" → sessions desc → العقارات (21000) first.
    fireEvent.click(screen.getByRole('button', { name: 'ترتيب حسب الجلسات' }));
    expect(rowOrder()).toEqual(['العقارات', 'الهواتف']);

    // Click again → sessions asc → الهواتف (9000) first.
    fireEvent.click(screen.getByRole('button', { name: 'ترتيب حسب الجلسات' }));
    expect(rowOrder()).toEqual(['الهواتف', 'العقارات']);
  });
});
