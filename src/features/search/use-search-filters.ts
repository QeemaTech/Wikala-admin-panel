'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Typed filter object emitted by the shared search/filter bar. Field names map
 * 1:1 to the `GET /api/v1/search` query params (API Contract §7.11). `condition`
 * and `brand` are multi-select; everything else is single-valued.
 */
export interface SearchFilters {
  q: string;
  categoryId: string | null;
  condition: string[];
  brand: string[];
  governorate: string | null;
  district: string;
  priceMin: number | null;
  priceMax: number | null;
  sortBy: string;
}

export const DEFAULT_SORT = 'boostRank';

export const EMPTY_FILTERS: SearchFilters = {
  q: '',
  categoryId: null,
  condition: [],
  brand: [],
  governorate: null,
  district: '',
  priceMin: null,
  priceMax: null,
  sortBy: DEFAULT_SORT,
};

/** Pure add/remove toggle for multi-select facets (e.g. condition, brand). */
export function toggleFacetValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}

/** True when the filter set carries no active constraint beyond the default sort. */
export function isEmptyFilters(f: SearchFilters): boolean {
  return (
    !f.q.trim() &&
    !f.categoryId &&
    f.condition.length === 0 &&
    f.brand.length === 0 &&
    !f.governorate &&
    !f.district.trim() &&
    f.priceMin == null &&
    f.priceMax == null
  );
}

/**
 * Composes a `SearchFilters` object into a query string matching the search
 * endpoint contract. Multi-select facets are emitted as repeated params
 * (`brand=a&brand=b`), which the backend accepts. Pagination can be appended
 * via `extra`. Returns the string WITHOUT a leading `?`.
 */
export function composeSearchQuery(
  f: SearchFilters,
  extra?: Record<string, string | number | undefined>,
): string {
  const q = new URLSearchParams();
  if (f.q.trim()) q.set('q', f.q.trim());
  if (f.categoryId) q.set('categoryId', f.categoryId);
  f.condition.forEach((c) => q.append('condition', c));
  f.brand.forEach((b) => q.append('brand', b));
  if (f.governorate) q.set('governorate', f.governorate);
  if (f.district.trim()) q.set('district', f.district.trim());
  if (f.priceMin != null) q.set('priceMin', String(f.priceMin));
  if (f.priceMax != null) q.set('priceMax', String(f.priceMax));
  if (f.sortBy && f.sortBy !== DEFAULT_SORT) q.set('sortBy', f.sortBy);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== '') q.set(k, String(v));
    }
  }
  return q.toString();
}

/** Inverse of `composeSearchQuery` — reconstructs filters from URL params. */
export function parseSearchParams(sp: URLSearchParams): SearchFilters {
  const num = (v: string | null) => (v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);
  return {
    q: sp.get('q') ?? '',
    categoryId: sp.get('categoryId') || null,
    condition: sp.getAll('condition'),
    brand: sp.getAll('brand'),
    governorate: sp.get('governorate') || null,
    district: sp.get('district') ?? '',
    priceMin: num(sp.get('priceMin')),
    priceMax: num(sp.get('priceMax')),
    sortBy: sp.get('sortBy') || DEFAULT_SORT,
  };
}

/**
 * URL-synced filter state for shareable search views. Reads the current filters
 * from the URL and writes updates back via a shallow `router.replace`, so the
 * address bar always reflects the active filter set.
 */
export function useSearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: SearchFilters) => {
      const qs = composeSearchQuery(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const patch = useCallback(
    (partial: Partial<SearchFilters>) => setFilters({ ...filters, ...partial }),
    [filters, setFilters],
  );

  const toggleCondition = useCallback(
    (value: string) => patch({ condition: toggleFacetValue(filters.condition, value) }),
    [filters.condition, patch],
  );

  const toggleBrand = useCallback(
    (value: string) => patch({ brand: toggleFacetValue(filters.brand, value) }),
    [filters.brand, patch],
  );

  const clearAll = useCallback(() => setFilters(EMPTY_FILTERS), [setFilters]);

  return { filters, setFilters, patch, toggleCondition, toggleBrand, clearAll };
}
