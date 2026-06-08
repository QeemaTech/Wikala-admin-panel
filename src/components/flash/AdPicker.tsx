'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { formatAmountMinor } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';
import { useAdSearch, type AdSearchResult } from '@/features/flash/use-ad-search';

export interface PickedAd {
  id: string;
  title?: string;
  coverUrl?: string | null;
}

interface AdPickerProps {
  value: PickedAd | null;
  onSelect: (ad: AdSearchResult | null) => void;
  error?: boolean;
  /** Edit mode: the ad can't be changed once the sale exists. */
  disabled?: boolean;
}

/** Type-ahead product picker — searches ACTIVE ads by title and selects one. */
export function AdPicker({ value, onSelect, error, disabled }: AdPickerProps) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data: results, isFetching } = useAdSearch(open ? q : '');

  if (value) {
    return (
      <div className={cn('flex items-center gap-3 rounded-[8px] border bg-surface px-3 py-2', error ? 'border-red' : 'border-border')}>
        <Thumbnail src={value.coverUrl} alt={value.title ?? ''} icon="shopping-bag" iconSize={16} className="h-9 w-9 rounded-[6px] bg-gradient-to-br from-wk-blue to-[#4d85bc]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-ink">{value.title ?? 'إعلان محدد'}</div>
          <div className="font-mono text-[11px] text-muted" dir="ltr">#{value.id.slice(-6)}</div>
        </div>
        {!disabled && (
          <button type="button" onClick={() => onSelect(null)} aria-label="إزالة الاختيار" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2">
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={cn('flex items-center gap-2 rounded-[8px] border bg-surface px-3 py-2', error ? 'border-red' : 'border-border')}>
        <Icon name="search" size={14} className="text-muted" />
        <input
          value={q}
          disabled={disabled}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="ابحث عن المنتج بالاسم..."
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
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
              <p className="px-3 py-3 text-center text-[12.5px] text-muted">لا توجد إعلانات مطابقة</p>
            ) : (
              results.map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => { onSelect(ad); setOpen(false); setQ(''); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-start hover:bg-surface-2"
                >
                  <Thumbnail src={ad.coverUrl} alt={ad.title} icon="shopping-bag" iconSize={16} className="h-9 w-9 rounded-[6px] bg-gradient-to-br from-wk-blue to-[#4d85bc]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-ink">{ad.title}</div>
                    <div className="font-mono text-[11px] text-muted">
                      {ad.priceMinor != null ? `${formatAmountMinor(ad.priceMinor)} ${ad.currency}` : '—'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
