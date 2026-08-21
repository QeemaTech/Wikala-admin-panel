'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { cn } from '@/lib/utils';
import {
  useTargetSearch,
  SEARCHABLE_TYPES,
  DESTINATION_LABELS,
  DESTINATION_TYPES,
  type DestinationType,
  type TargetSearchResult,
} from '@/features/banners/use-target-search';

export interface PickedTarget {
  id: string;
  label: string;
  slug: string | null;
  thumbUrl: string | null;
}

interface DestinationPickerProps {
  type: DestinationType;
  onTypeChange: (type: DestinationType) => void;
  /** The currently selected target (AD/PRODUCT/CATEGORY/AUCTION). */
  target: PickedTarget | null;
  onTargetSelect: (target: TargetSearchResult | null) => void;
  /** External URL for type=URL. */
  url: string;
  onUrlChange: (url: string) => void;
  /** Page slug for type=PAGE. */
  pageSlug: string;
  onPageSlugChange: (slug: string) => void;
  /** Resolved deep link preview. */
  resolvedLink: string | null;
  error?: string;
}

export function DestinationPicker({
  type,
  onTypeChange,
  target,
  onTargetSelect,
  url,
  onUrlChange,
  pageSlug,
  onPageSlugChange,
  resolvedLink,
  error,
}: DestinationPickerProps) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data: results, isFetching } = useTargetSearch(open ? type : 'NONE', q);

  const needsSearch = SEARCHABLE_TYPES.includes(type);
  const needsUrl = type === 'URL';
  const needsPage = type === 'PAGE';

  return (
    <div className="space-y-2">
      {/* Type select */}
      <div className="flex items-center gap-2">
        <label className="text-[12.5px] font-medium text-ink whitespace-nowrap">نوع الوجهة</label>
        <select
          value={type}
          onChange={(e) => {
            onTypeChange(e.target.value as DestinationType);
            onTargetSelect(null);
            setQ('');
            setOpen(false);
          }}
          className="flex-1 rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink"
          data-testid="destination-type-select"
        >
          {DESTINATION_TYPES.map((t) => (
            <option key={t} value={t}>{DESTINATION_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* URL input */}
      {needsUrl && (
        <input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          dir="ltr"
          placeholder="https://..."
          className={cn(
            'w-full rounded-[8px] border bg-surface px-3 py-2 text-[13px] text-ink outline-none',
            error ? 'border-red' : 'border-border'
          )}
          data-testid="destination-url-input"
        />
      )}

      {/* Page slug input */}
      {needsPage && (
        <input
          value={pageSlug}
          onChange={(e) => onPageSlugChange(e.target.value)}
          dir="ltr"
          placeholder="privacy-policy"
          className={cn(
            'w-full rounded-[8px] border bg-surface px-3 py-2 text-[13px] text-ink outline-none',
            error ? 'border-red' : 'border-border'
          )}
          data-testid="destination-page-input"
        />
      )}

      {/* Target search bar */}
      {needsSearch && !target && (
        <div className="relative">
          <div className={cn('flex items-center gap-2 rounded-[8px] border bg-surface px-3 py-2', error ? 'border-red' : 'border-border')}>
            <Icon name="search" size={14} className="text-muted" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="ابحث بالاسم..."
              className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
              data-testid="destination-search-input"
            />
            {isFetching && <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-muted border-t-transparent" aria-label="جارٍ البحث" />}
          </div>

          {open && q.trim().length >= 2 && (
            <>
              <button type="button" aria-label="إغلاق" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-[8px] border border-border bg-white py-1 shadow-lg">
                {isFetching && (!results || results.length === 0) ? (
                  <p className="px-3 py-3 text-center text-[12.5px] text-muted">جارٍ البحث...</p>
                ) : !results || results.length === 0 ? (
                  <p className="px-3 py-3 text-center text-[12.5px] text-muted">لا توجد نتائج مطابقة</p>
                ) : (
                  results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { onTargetSelect(item); setOpen(false); setQ(''); }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-start hover:bg-surface-2"
                    >
                      <Thumbnail src={item.thumbUrl} alt={item.label} icon="shopping-bag" iconSize={16} className="h-9 w-9 rounded-[6px] bg-gradient-to-br from-wk-blue to-[#4d85bc]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-ink">{item.label}</div>
                        {item.sublabel && <div className="text-[11px] text-muted">{item.sublabel}</div>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Selected target display */}
      {needsSearch && target && (
        <div className="flex items-center gap-3 rounded-[8px] border border-border bg-surface px-3 py-2">
          <Thumbnail src={target.thumbUrl} alt={target.label} icon="shopping-bag" iconSize={16} className="h-9 w-9 rounded-[6px] bg-gradient-to-br from-wk-blue to-[#4d85bc]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-ink">{target.label}</div>
            <div className="font-mono text-[11px] text-muted" dir="ltr">#{target.id.slice(-6)}</div>
          </div>
          <button type="button" onClick={() => onTargetSelect(null)} aria-label="إزالة الاختيار" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Resolved deep link preview */}
      {resolvedLink && (
        <div className="rounded-[6px] bg-surface-2 px-3 py-1.5" data-testid="resolved-link-preview">
          <span className="text-[11px] text-muted">الرابط النهائي: </span>
          <code className="text-[11px] font-mono text-ink break-all" dir="ltr">{resolvedLink}</code>
        </div>
      )}

      {error && <p className="text-[12px] text-red">{error}</p>}
    </div>
  );
}
