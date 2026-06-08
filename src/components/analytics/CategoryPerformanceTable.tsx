'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { formatAmountMinor, formatNumber, formatPercent } from '@/lib/i18n/format';
import type { CategoryPerformance } from '@/features/analytics/use-analytics';

type SortKey = 'totalAds' | 'sessions' | 'conversionRate' | 'avgPriceMinor';

interface SortState {
  key: SortKey;
  dir: 'asc' | 'desc';
}

/** Inline bar sparkline mirroring the design's `.spark` treatment. */
function Sparkline({ points }: { points: { count: number }[] }) {
  if (points.length === 0) {
    return <span className="text-muted">—</span>;
  }
  const max = Math.max(...points.map((p) => p.count), 1);
  return (
    <span className="inline-flex h-6 items-end gap-[2px]" aria-hidden="true">
      {points.map((p, i) => (
        <span
          key={i}
          className="w-[3px] rounded-[1px] bg-wk-blue"
          style={{ height: `${Math.max((p.count / max) * 24, 2)}px` }}
        />
      ))}
    </span>
  );
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'totalAds', label: 'إعلانات منشورة' },
  { key: 'sessions', label: 'الجلسات' },
  { key: 'conversionRate', label: 'معدل التحويل' },
  { key: 'avgPriceMinor', label: 'متوسط السعر' },
];

interface CategoryPerformanceTableProps {
  categories: CategoryPerformance[];
}

export function CategoryPerformanceTable({ categories }: CategoryPerformanceTableProps) {
  const [sort, setSort] = useState<SortState>({ key: 'totalAds', dir: 'desc' });

  const sorted = useMemo(() => {
    const rows = [...categories];
    rows.sort((a, b) => {
      const av = a[sort.key] ?? -Infinity;
      const bv = b[sort.key] ?? -Infinity;
      return sort.dir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [categories, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' },
    );
  };

  return (
    <Card title="أداء الفئات" pad={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start font-medium text-muted">الفئة</th>
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 text-start font-medium text-muted">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    aria-label={`ترتيب حسب ${col.label}`}
                    className="inline-flex items-center gap-1 transition-colors hover:text-ink"
                  >
                    {col.label}
                    {sort.key === col.key && (
                      <Icon name={sort.dir === 'asc' ? 'chevron-up' : 'chevron-down'} size={12} />
                    )}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-start font-medium text-muted">الاتجاه</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">
                  لا توجد بيانات لهذه الفترة
                </td>
              </tr>
            ) : (
              sorted.map((cat) => (
                <tr key={cat.categoryId} className="border-b border-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <b className="text-ink">{cat.nameAr}</b>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">{formatNumber(cat.totalAds)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatNumber(cat.sessions)}</td>
                  <td className="px-4 py-3">
                    {cat.conversionRate == null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <Chip tone="green">{formatPercent(cat.conversionRate, 1)}</Chip>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    {cat.avgPriceMinor == null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <>
                        {formatAmountMinor(cat.avgPriceMinor)}{' '}
                        <span className="text-[11px] text-muted">{cat.priceCurrency}</span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Sparkline points={cat.sparkline} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
