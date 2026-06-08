'use client';

import { formatNumber } from '@/lib/i18n/format';
import { AD_CONDITIONS, CONDITION_LABELS, governorateLabel } from '@/lib/constants/enums';
import type { SearchFacets } from '@/features/search/use-search';

interface FacetCountsProps {
  facets: SearchFacets;
  loading?: boolean;
  selectedConditions: string[];
  selectedGovernorate: string | null;
  onToggleCondition: (condition: string) => void;
  onSelectGovernorate: (governorate: string) => void;
}

/**
 * Renders server-driven faceted counts beside each option, updating as other
 * filters change. Only `condition` and `governorate` are backed by the search
 * endpoint (it does not emit brand counts); price/brand/district have no count
 * source. Zero-count options are de-emphasized.
 */
export function FacetCounts({
  facets,
  loading = false,
  selectedConditions,
  selectedGovernorate,
  onToggleCondition,
  onSelectGovernorate,
}: FacetCountsProps) {
  const conditionCount = (c: string) =>
    facets.conditionCounts.find((x) => x.condition === c)?.count ?? 0;

  // Governorates are numerous; show only those with results, busiest first.
  const govRows = [...facets.governorateCounts]
    .filter((g) => g.governorate)
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="h-7 animate-pulse rounded-[7px] bg-surface-2" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {/* Condition facet */}
      <div>
        <h4 className="mb-2 text-[12px] font-semibold text-muted">الحالة</h4>
        <div className="space-y-1">
          {AD_CONDITIONS.map((c) => {
            const count = conditionCount(c);
            const active = selectedConditions.includes(c);
            const zero = count === 0;
            return (
              <FacetRow
                key={c}
                label={CONDITION_LABELS[c]}
                count={count}
                active={active}
                zero={zero}
                onClick={() => onToggleCondition(c)}
              />
            );
          })}
        </div>
      </div>

      {/* Governorate facet */}
      <div>
        <h4 className="mb-2 text-[12px] font-semibold text-muted">المحافظة</h4>
        {govRows.length === 0 ? (
          <p className="py-2 text-[12px] text-muted">لا نتائج</p>
        ) : (
          <div className="max-h-44 space-y-1 overflow-y-auto pe-1">
            {govRows.map((g) => (
              <FacetRow
                key={g.governorate}
                label={governorateLabel(g.governorate)}
                count={g.count}
                active={selectedGovernorate === g.governorate}
                zero={g.count === 0}
                onClick={() => onSelectGovernorate(g.governorate)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FacetRow({
  label,
  count,
  active,
  zero,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  zero: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={zero && !active}
      aria-pressed={active}
      className={`flex w-full items-center justify-between rounded-[7px] border px-2.5 py-1.5 text-[12.5px] transition-colors ${
        active
          ? 'border-brand/30 bg-brand/8 text-brand'
          : zero
            ? 'border-transparent text-muted/50'
            : 'border-transparent text-ink hover:bg-surface-2'
      }`}
    >
      <span>{label}</span>
      <span className={`font-mono text-[11.5px] ${active ? 'text-brand' : 'text-muted'}`}>
        {formatNumber(count)}
      </span>
    </button>
  );
}
