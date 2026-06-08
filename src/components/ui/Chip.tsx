import { cn } from '@/lib/utils';

type ChipTone = 'green' | 'red' | 'amber' | 'violet' | 'teal' | 'blue' | 'gray';

const TONE_CLASSES: Record<ChipTone, string> = {
  green: 'bg-green-50 text-green border-green/20',
  red: 'bg-red-50 text-red border-red/20',
  amber: 'bg-amber-50 text-amber border-amber/20',
  violet: 'bg-violet-50 text-violet border-violet/20',
  teal: 'bg-teal-50 text-teal border-teal/20',
  blue: 'bg-wk-blue-50 text-wk-blue border-wk-blue/20',
  gray: 'bg-surface-2 text-muted border-border',
};

const DOT_COLORS: Record<ChipTone, string> = {
  green: 'bg-green',
  red: 'bg-red',
  amber: 'bg-amber',
  violet: 'bg-violet',
  teal: 'bg-teal',
  blue: 'bg-wk-blue',
  gray: 'bg-muted',
};

interface ChipProps {
  tone?: ChipTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ tone = 'gray', dot = false, children, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_COLORS[tone])} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
