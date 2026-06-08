import { formatNumber } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

interface BarRowProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  right?: string;
  className?: string;
}

export function BarRow({ label, value, max, color = '#226199', right, className }: BarRowProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="truncate text-ink-2">{label}</span>
        <span className="shrink-0 font-mono text-[12px] font-medium text-ink">
          {right ?? formatNumber(value)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
