import { cn } from '@/lib/utils';
import { formatNumber, formatPercent } from '@/lib/i18n/format';
import { Icon } from '@/components/ui/Icon';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tintColor: string;
  delta?: number | null;
  deltaLabel?: string;
  formatter?: (v: number) => string;
  unit?: string;
  className?: string;
}

export function KpiCard({ label, value, icon, tintColor, delta, deltaLabel = 'مقارنة بالفترة السابقة', formatter, unit, className }: KpiCardProps) {
  const displayValue =
    typeof value === 'number' ? (formatter ? formatter(value) : formatNumber(value)) : value;

  const hasDelta = delta != null && isFinite(delta);
  const isPositive = hasDelta && delta >= 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface px-5 py-[18px] shadow-sm',
        className,
      )}
    >
      <div
        className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-[8px] opacity-90"
        style={{ backgroundColor: `${tintColor}18`, color: tintColor }}
        aria-hidden="true"
      >
        {icon}
      </div>

      <p className="text-[12.5px] font-medium text-muted">{label}</p>
      <p className="mt-1.5 font-mono text-[26px] font-bold leading-none tracking-tight text-ink">
        {displayValue}
        {unit && <span className="ms-1.5 font-mono text-[14px] font-semibold text-muted">{unit}</span>}
      </p>

      {hasDelta && (
        <p
          className={cn(
            'mt-2 text-[11.5px] font-medium',
            isPositive ? 'text-green' : 'text-red',
          )}
        >
          <Icon name={isPositive ? 'arrow-up' : 'arrow-down'} size={11} className="inline-block" strokeWidth={2.2} />
          {' '}<span className="font-mono">{formatPercent(Math.abs(delta))}</span> {deltaLabel}
        </p>
      )}
    </div>
  );
}
