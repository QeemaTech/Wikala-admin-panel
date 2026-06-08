'use client';

import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

type ConfirmTone = 'red' | 'amber' | 'blue';

const TONE_BTN: Record<ConfirmTone, string> = {
  red: 'bg-red hover:bg-red/90',
  amber: 'bg-amber hover:bg-amber/90',
  blue: 'bg-wk-blue hover:opacity-90',
};

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Lightweight confirmation modal for destructive / sensitive actions. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  tone = 'red',
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          <button type="button" onClick={onCancel} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2">
            <Icon name="x" size={15} />
          </button>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-2">{message}</p>
        {error && <p className="mt-3 rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn('rounded-[8px] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50', TONE_BTN[tone])}
          >
            {loading ? 'جارٍ التنفيذ…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
