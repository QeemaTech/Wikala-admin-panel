import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  composeSearchQuery,
  isEmptyFilters,
  parseSearchParams,
  toggleFacetValue,
  type SearchFilters,
} from './use-search-filters';

describe('toggleFacetValue', () => {
  it('adds a value when absent', () => {
    expect(toggleFacetValue(['NEW'], 'PRELOVED')).toEqual(['NEW', 'PRELOVED']);
  });

  it('removes a value when present', () => {
    expect(toggleFacetValue(['NEW', 'PRELOVED'], 'NEW')).toEqual(['PRELOVED']);
  });

  it('does not mutate the input array', () => {
    const input = ['NEW'];
    toggleFacetValue(input, 'PRELOVED');
    expect(input).toEqual(['NEW']);
  });
});

describe('composeSearchQuery', () => {
  it('returns empty string for default filters', () => {
    expect(composeSearchQuery(EMPTY_FILTERS)).toBe('');
  });

  it('emits multi-select facets as repeated params', () => {
    const f: SearchFilters = {
      ...EMPTY_FILTERS,
      condition: ['NEW', 'PRELOVED'],
      brand: ['Toyota', 'Honda'],
    };
    const qs = composeSearchQuery(f);
    const sp = new URLSearchParams(qs);
    expect(sp.getAll('condition')).toEqual(['NEW', 'PRELOVED']);
    expect(sp.getAll('brand')).toEqual(['Toyota', 'Honda']);
  });

  it('composes single-valued filters and trims text', () => {
    const f: SearchFilters = {
      ...EMPTY_FILTERS,
      q: '  macbook  ',
      categoryId: 'cat1',
      governorate: 'CAIRO',
      priceMin: 1000,
      priceMax: 5000,
    };
    const sp = new URLSearchParams(composeSearchQuery(f));
    expect(sp.get('q')).toBe('macbook');
    expect(sp.get('categoryId')).toBe('cat1');
    expect(sp.get('governorate')).toBe('CAIRO');
    expect(sp.get('priceMin')).toBe('1000');
    expect(sp.get('priceMax')).toBe('5000');
  });

  it('omits the default sort but keeps a non-default one', () => {
    expect(new URLSearchParams(composeSearchQuery(EMPTY_FILTERS)).has('sortBy')).toBe(false);
    const sp = new URLSearchParams(composeSearchQuery({ ...EMPTY_FILTERS, sortBy: 'price' }));
    expect(sp.get('sortBy')).toBe('price');
  });

  it('appends pagination via extra', () => {
    const sp = new URLSearchParams(composeSearchQuery(EMPTY_FILTERS, { page: 2, pageSize: 24 }));
    expect(sp.get('page')).toBe('2');
    expect(sp.get('pageSize')).toBe('24');
  });
});

describe('parseSearchParams', () => {
  it('round-trips a composed query', () => {
    const f: SearchFilters = {
      ...EMPTY_FILTERS,
      q: 'macbook',
      categoryId: 'cat1',
      condition: ['NEW', 'PRELOVED'],
      brand: ['Apple'],
      governorate: 'GIZA',
      district: 'الدقي',
      priceMin: 100,
      priceMax: 900,
      sortBy: 'price',
    };
    expect(parseSearchParams(new URLSearchParams(composeSearchQuery(f)))).toEqual(f);
  });

  it('falls back to defaults for missing params', () => {
    expect(parseSearchParams(new URLSearchParams(''))).toEqual(EMPTY_FILTERS);
  });
});

describe('isEmptyFilters', () => {
  it('is true for defaults and false once a facet is set', () => {
    expect(isEmptyFilters(EMPTY_FILTERS)).toBe(true);
    expect(isEmptyFilters({ ...EMPTY_FILTERS, condition: ['NEW'] })).toBe(false);
    expect(isEmptyFilters({ ...EMPTY_FILTERS, q: 'x' })).toBe(false);
  });
});
