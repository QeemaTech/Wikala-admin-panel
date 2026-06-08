import type { ReactNode } from 'react';

interface PageHeadProps {
  title: string;
  sub?: string;
  actions?: ReactNode;
}

export function PageHead({ title, sub, actions }: PageHeadProps) {
  return (
    <div className="mb-[22px] flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.2px] text-ink">{title}</h1>
        {sub && <p className="mt-1 text-[13.5px] text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
