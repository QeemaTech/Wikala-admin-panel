'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

type MaskKind = 'phone' | 'url' | 'text';

interface MaskedValueProps {
  value: string;
  kind?: MaskKind;
  /** Fired exactly once, the first time staff reveal the value (for audit). */
  onReveal?: () => void;
  className?: string;
}

function mask(value: string, kind: MaskKind): string {
  const v = value.trim();
  if (!v) return v;
  if (kind === 'phone') {
    const digits = v.replace(/\D/g, '');
    const tail = digits.slice(-3);
    return `${'•'.repeat(Math.max(4, digits.length - 3))}${tail}`;
  }
  if (kind === 'url') {
    // keep scheme/first token, mask the rest
    const head = v.slice(0, 6);
    return `${head}${'•'.repeat(Math.min(10, Math.max(4, v.length - 6)))}`;
  }
  if (v.length <= 4) return '•'.repeat(v.length);
  return `${v.slice(0, 2)}${'•'.repeat(Math.min(12, v.length - 2))}`;
}

/**
 * Renders PII (phone numbers, external URLs) masked by default with an explicit
 * reveal affordance. Reusable anywhere chat content is shown to staff; the
 * `onReveal` callback lets the caller audit-log the reveal (Plan §7 privacy).
 */
export function MaskedValue({ value, kind = 'text', onReveal, className }: MaskedValueProps) {
  const [revealed, setRevealed] = useState(false);

  const toggle = () => {
    setRevealed((prev) => {
      if (!prev) onReveal?.();
      return !prev;
    });
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span dir="ltr" className="font-mono text-[12.5px]">
        {revealed ? value : mask(value, kind)}
      </span>
      <button
        type="button"
        onClick={toggle}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-muted hover:bg-surface-2 hover:text-ink"
        aria-label={revealed ? 'إخفاء' : 'إظهار'}
        title={revealed ? 'إخفاء' : 'إظهار (يُسجَّل في السجل)'}
      >
        <Icon name={revealed ? 'lock' : 'eye'} size={13} />
      </button>
    </span>
  );
}
