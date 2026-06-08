'use client';

import { Icon } from '@/components/ui/Icon';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import {
  boostTone,
  boostPackageLabel,
  type BoostPackageDTO,
} from '@/features/boosts/use-boosts';

interface BoostPackageCardProps {
  pkg: BoostPackageDTO;
  onEdit: (pkg: BoostPackageDTO) => void;
  onStats: () => void;
}

function durationLabel(days: number): string {
  if (days === 7) return 'أسبوع';
  if (days === 30) return 'شهر';
  return `${formatNumber(days)} يوم`;
}

export function BoostPackageCard({ pkg, onEdit, onStats }: BoostPackageCardProps) {
  const tone = boostTone(pkg.package);

  return (
    <div className="flex flex-col rounded-[var(--radius)] border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="grid h-11 w-11 place-items-center rounded-[12px]"
            style={{ background: tone.bg, color: tone.fg }}
          >
            <Icon name={tone.icon} size={22} />
          </div>
          <div>
            <div className="text-[16px] font-bold text-ink">{boostPackageLabel(pkg.package)}</div>
            <div className="text-[12px] text-muted">{durationLabel(pkg.durationDays)}</div>
          </div>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium ${
            pkg.active
              ? 'border-green/20 bg-green-50 text-green'
              : 'border-border bg-surface-2 text-muted'
          }`}
        >
          {pkg.active ? 'نشطة' : 'معطّلة'}
        </span>
      </div>

      <div className="mt-3 font-mono text-[28px] font-bold tracking-[-0.5px] text-ink">
        {formatAmountMinor(pkg.priceMinor)}
        <span className="ms-1 text-[13px] font-medium text-muted">
          {pkg.currency} / {durationLabel(pkg.durationDays)}
        </span>
      </div>

      <div className="mt-2.5 space-y-0.5">
        {pkg.benefits.map((b, i) => (
          <div key={i} className="flex items-center gap-1.5 py-1 text-[12.5px] text-ink-2">
            <Icon name="check" size={14} className="shrink-0 text-green" />
            <span>{b}</span>
          </div>
        ))}
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-border pt-3.5">
        <div>
          <div className="text-[12px] text-muted">إيراد آخر 7 أيام</div>
          <div className="font-mono text-[18px] font-bold text-ink">
            {formatAmountMinor(pkg.weeklyRevenueMinor)}{' '}
            <span className="text-[12px] font-medium text-muted">{pkg.currency}</span>
          </div>
        </div>
        <div>
          <div className="text-[12px] text-muted">عدد المشتركين</div>
          <div className="font-mono text-[18px] font-bold text-ink">{formatNumber(pkg.activeCount)}</div>
        </div>
      </div>

      <div className="mt-3.5 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(pkg)}
          className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-2"
        >
          <Icon name="pencil" size={13} /> تعديل
        </button>
        <button
          type="button"
          onClick={onStats}
          className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-2"
        >
          <Icon name="pie-chart" size={13} /> إحصائيات
        </button>
      </div>
    </div>
  );
}
