'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

export interface SettingRow {
  title: string;
  desc: string;
  /** The control rendered at the row's end — a Switch, Select, Input, etc. */
  control: ReactNode;
}

interface SettingsSectionProps {
  title: string;
  sub?: string;
  rows: SettingRow[];
}

/**
 * Presentational settings card — mirrors the prototype `SETTINGS` card/`row-cell`
 * layout (`pages-system.jsx`): a titled card whose rows pair a label + description
 * with an end-aligned control.
 */
export function SettingsSection({ title, sub, rows }: SettingsSectionProps) {
  return (
    <Card title={title} sub={sub} pad={false}>
      <div className="px-5">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0"
          >
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-ink">{row.title}</div>
              <div className="mt-0.5 text-[12px] leading-relaxed text-muted">{row.desc}</div>
            </div>
            <div className="shrink-0">{row.control}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
