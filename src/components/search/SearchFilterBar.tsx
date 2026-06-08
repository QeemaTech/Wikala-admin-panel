'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { useCategories } from '@/features/categories/use-categories';
import {
  AD_CONDITIONS,
  CONDITION_LABELS,
  GOVERNORATES,
  GOVERNORATE_LABELS,
  conditionLabel,
  governorateLabel,
} from '@/lib/constants/enums';
import {
  isEmptyFilters,
  toggleFacetValue,
  type SearchFilters,
} from '@/features/search/use-search-filters';
import type { SearchFacets } from '@/features/search/use-search';
import { FacetCounts } from './FacetCounts';

/** Which facet controls to surface. Lets host views show only relevant facets
 *  (e.g. moderation only maps text + category to its endpoint). */
export interface FacetVisibility {
  category?: boolean;
  price?: boolean;
  condition?: boolean;
  brand?: boolean;
  governorate?: boolean;
  district?: boolean;
}

const ALL_FACETS: Required<FacetVisibility> = {
  category: true,
  price: true,
  condition: true,
  brand: true,
  governorate: true,
  district: true,
};

interface SearchFilterBarProps {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  /** Server-driven counts. Only valid where `GET /search` is the source
   *  (active-ads browse) — omit in the moderation queue. */
  facets?: SearchFacets;
  facetsLoading?: boolean;
  /** Restrict which facets render. Defaults to all. */
  show?: FacetVisibility;
  placeholder?: string;
}

export function SearchFilterBar({
  value,
  onChange,
  facets,
  facetsLoading = false,
  show,
  placeholder = 'بحث في الإعلانات…',
}: SearchFilterBarProps) {
  const vis = { ...ALL_FACETS, ...show };
  const hasFacets = Object.values(vis).some(Boolean);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value.q);
  const [brandDraft, setBrandDraft] = useState('');
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];

  // Keep local text in sync when filters are reset/changed externally.
  useEffect(() => setText(value.q), [value.q]);

  // Debounce the text query so each keystroke doesn't trigger a fetch / URL write.
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const onText = (v: string) => {
    setText(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange({ ...value, q: v }), 350);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const patch = (partial: Partial<SearchFilters>) => onChange({ ...value, ...partial });

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.nameAr ?? id;

  const addBrand = () => {
    const b = brandDraft.trim();
    if (b && !value.brand.includes(b)) patch({ brand: [...value.brand, b] });
    setBrandDraft('');
  };

  const empty = isEmptyFilters(value);

  return (
    <div className="space-y-2.5">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-border bg-surface px-3 focus-within:border-brand">
          <Icon name="search" size={15} className="shrink-0 text-muted" />
          <input
            type="search"
            value={text}
            onChange={(e) => onText(e.target.value)}
            placeholder={placeholder}
            className="h-9 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
            aria-label="بحث"
          />
        </div>
        {hasFacets && (
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            aria-expanded={open}
            className={`flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-[12.5px] font-medium transition-colors ${
              open || !empty
                ? 'border-brand/30 bg-brand/8 text-brand'
                : 'border-border bg-surface text-ink hover:bg-surface-2'
            }`}
          >
            <Icon name="sliders" size={14} />
            فلترة
          </button>
        )}
      </div>

      {/* Facet panel */}
      {hasFacets && open && (
        <div className="rounded-[12px] border border-border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vis.category && (
              <Field label="الفئة">
                <select
                  value={value.categoryId ?? ''}
                  onChange={(e) => patch({ categoryId: e.target.value || null })}
                  className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                >
                  <option value="">كل الفئات</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                  ))}
                </select>
              </Field>
            )}

            {vis.governorate && (
              <Field label="المحافظة">
                <select
                  value={value.governorate ?? ''}
                  onChange={(e) => patch({ governorate: e.target.value || null })}
                  className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                >
                  <option value="">كل المحافظات</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{GOVERNORATE_LABELS[g]}</option>
                  ))}
                </select>
              </Field>
            )}

            {vis.district && (
              <Field label="المنطقة">
                <input
                  type="text"
                  value={value.district}
                  onChange={(e) => patch({ district: e.target.value })}
                  placeholder="اسم المنطقة"
                  className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                />
              </Field>
            )}

            {vis.price && (
              <Field label="نطاق السعر">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={value.priceMin ?? ''}
                    onChange={(e) => patch({ priceMin: e.target.value ? Number(e.target.value) : null })}
                    placeholder="من"
                    className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 font-mono text-[12.5px] text-ink outline-none focus:border-brand"
                  />
                  <span className="text-muted">—</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={value.priceMax ?? ''}
                    onChange={(e) => patch({ priceMax: e.target.value ? Number(e.target.value) : null })}
                    placeholder="إلى"
                    className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 font-mono text-[12.5px] text-ink outline-none focus:border-brand"
                  />
                </div>
              </Field>
            )}

            {vis.brand && (
              <Field label="الماركة">
                <input
                  type="text"
                  value={brandDraft}
                  onChange={(e) => setBrandDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addBrand(); }
                  }}
                  placeholder="أضف ماركة ثم Enter"
                  className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                />
              </Field>
            )}

            {vis.condition && (
              <Field label="الحالة">
                <div className="flex flex-wrap gap-2">
                  {AD_CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => patch({ condition: toggleFacetValue(value.condition, c) })}
                      className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                        value.condition.includes(c)
                          ? 'border-wk-blue bg-wk-blue text-white'
                          : 'border-border text-muted hover:bg-surface-2'
                      }`}
                    >
                      {CONDITION_LABELS[c]}
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </div>

          {/* Server-driven facet counts (only when a facets payload is supplied) */}
          {facets && (
            <div className="mt-4 border-t border-border pt-4">
              <FacetCounts
                facets={facets}
                loading={facetsLoading}
                selectedConditions={value.condition}
                selectedGovernorate={value.governorate}
                onToggleCondition={(c) => patch({ condition: toggleFacetValue(value.condition, c) })}
                onSelectGovernorate={(g) =>
                  patch({ governorate: value.governorate === g ? null : g })
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Applied facet chips */}
      {!empty && (
        <div className="flex flex-wrap items-center gap-1.5">
          {value.q.trim() && (
            <RemovableChip label="إزالة البحث" onRemove={() => { setText(''); patch({ q: '' }); }}>
              بحث: {value.q}
            </RemovableChip>
          )}
          {value.categoryId && (
            <RemovableChip label="إزالة الفئة" onRemove={() => patch({ categoryId: null })}>
              فئة: {categoryName(value.categoryId)}
            </RemovableChip>
          )}
          {value.governorate && (
            <RemovableChip label="إزالة المحافظة" onRemove={() => patch({ governorate: null })}>
              {governorateLabel(value.governorate)}
            </RemovableChip>
          )}
          {value.district.trim() && (
            <RemovableChip label="إزالة المنطقة" onRemove={() => patch({ district: '' })}>
              {value.district}
            </RemovableChip>
          )}
          {(value.priceMin != null || value.priceMax != null) && (
            <RemovableChip
              label="إزالة نطاق السعر"
              onRemove={() => patch({ priceMin: null, priceMax: null })}
            >
              السعر: {value.priceMin ?? '0'} — {value.priceMax ?? '∞'}
            </RemovableChip>
          )}
          {value.condition.map((c) => (
            <RemovableChip key={c} label={`إزالة ${conditionLabel(c)}`} onRemove={() => patch({ condition: toggleFacetValue(value.condition, c) })}>
              {conditionLabel(c)}
            </RemovableChip>
          ))}
          {value.brand.map((b) => (
            <RemovableChip key={b} label={`إزالة ${b}`} onRemove={() => patch({ brand: toggleFacetValue(value.brand, b) })}>
              {b}
            </RemovableChip>
          ))}
          <button
            type="button"
            onClick={() => { setText(''); onChange({ ...value, q: '', categoryId: null, condition: [], brand: [], governorate: null, district: '', priceMin: null, priceMax: null }); }}
            className="ms-1 text-[12px] font-medium text-muted underline-offset-2 hover:text-red hover:underline"
          >
            مسح الكل
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}

function RemovableChip({
  children,
  onRemove,
  label,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  label: string;
}) {
  return (
    <Chip tone="gray">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={label}
        className="-me-1 ms-0.5 rounded-full p-0.5 text-muted hover:bg-border hover:text-ink"
      >
        <Icon name="x" size={11} />
      </button>
    </Chip>
  );
}
