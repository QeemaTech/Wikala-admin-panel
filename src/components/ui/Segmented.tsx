'use client';

import { cn } from '@/lib/utils';

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Segmented({ options, value, onChange, className }: SegmentedProps) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex rounded-[8px] border border-border bg-surface-2 p-[3px]',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            'rounded-[6px] px-3 py-1.5 text-[12.5px] font-medium transition-colors',
            value === opt.value
              ? 'bg-white text-ink shadow-sm'
              : 'text-muted hover:text-ink',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
