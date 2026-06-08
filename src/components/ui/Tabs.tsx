'use client';

import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number | null;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn('mb-[18px] flex gap-1 border-b border-border', className)}
    >
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            '-mb-px inline-flex items-center gap-[7px] border-b-2 px-[14px] py-[10px] text-[13.5px] font-semibold transition-colors',
            value === it.id
              ? 'border-wk-blue text-wk-blue'
              : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {it.label}
          {it.count != null && (
            <span
              className={cn(
                'rounded-full px-[7px] py-[1px] text-[11px]',
                value === it.id ? 'bg-wk-blue text-white' : 'bg-surface-2 text-muted',
              )}
            >
              {it.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
