import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  sub?: string;
  actions?: ReactNode;
  pad?: boolean;
  bodyFill?: boolean;
  children: ReactNode;
  className?: string;
}

export function Card({ title, sub, actions, pad = true, bodyFill, children, className }: CardProps) {
  const hasHead = title || sub || actions;
  return (
    <div className={cn('rounded-[var(--radius)] border border-border bg-surface shadow-sm', className)}>
      {hasHead && (
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-[14px]">
          <div className="min-w-0">
            {title && (
              <h3 className="text-[14px] font-semibold leading-snug text-ink">{title}</h3>
            )}
            {sub && <p className="mt-0.5 text-[12px] text-muted">{sub}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn(pad && 'p-5', bodyFill && 'flex-1 min-h-0')}>{children}</div>
    </div>
  );
}
