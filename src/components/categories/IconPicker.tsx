'use client';

import { useState } from 'react';
import { Icon as Iconify } from '@iconify/react';
import '@/lib/icons/fluent';
import { Icon } from '@/components/ui/Icon';
import { CATEGORY_ICONS } from '@/lib/constants/category-icons';

interface IconPickerProps {
  value?: string;
  onChange: (id: string) => void;
}

/** Searchable grid picker for category glyphs (Fluent Emoji 3D, Arabic search). */
export function IconPicker({ value, onChange }: IconPickerProps) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const filtered = term
    ? CATEGORY_ICONS.filter((o) => `${o.ar} ${o.kw}`.toLowerCase().includes(term))
    : CATEGORY_ICONS;

  return (
    <div className="rounded-[8px] border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-2.5 py-1.5">
        <Icon name="search" size={13} className="text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن أيقونة… (سيارة، منزل، جوال)"
          className="h-7 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted"
          aria-label="بحث عن أيقونة"
        />
        {value && (
          <span className="flex items-center gap-1 rounded-[6px] bg-surface-2 px-1.5 py-0.5">
            <Iconify icon={value} width={18} height={18} />
          </span>
        )}
      </div>
      <div className="grid max-h-44 grid-cols-7 gap-1 overflow-y-auto p-2 sm:grid-cols-8">
        {filtered.map((o) => (
          <button
            key={o.id}
            type="button"
            title={o.ar}
            onClick={() => onChange(o.id)}
            className={`grid aspect-square place-items-center rounded-[7px] border transition-colors ${
              value === o.id
                ? 'border-brand bg-brand/8'
                : 'border-transparent hover:bg-surface-2'
            }`}
          >
            <Iconify icon={o.id} width={24} height={24} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-4 text-center text-[12px] text-muted">لا توجد نتائج</p>
        )}
      </div>
    </div>
  );
}
