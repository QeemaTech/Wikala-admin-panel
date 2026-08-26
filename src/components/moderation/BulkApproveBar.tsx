'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useBulkApproveAds, type BulkApproveFailure } from '@/features/moderation/use-moderation-actions';

interface BulkApproveBarProps {
  selected: Set<string>;
  onClear: () => void;
}

// Maps backend failure codes to Arabic copy.
const FAILURE_REASON_AR: Record<string, string> = {
  // Not a fault: another moderator decided on this ad first, or it was
  // approved in an earlier click and this list had not caught up yet.
  NOT_IN_QUEUE: 'راجعه مشرف آخر بالفعل',
  ERROR: 'خطأ غير متوقع',
};
function failureReasonAr(reason: string): string {
  return FAILURE_REASON_AR[reason] ?? reason;
}

export function BulkApproveBar({ selected, onClear }: BulkApproveBarProps) {
  const [confirming, setConfirming] = useState(false);
  const [partialFailure, setPartialFailure] = useState<BulkApproveFailure[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bulkApprove = useBulkApproveAds();

  if (selected.size === 0) return null;

  const handleConfirm = async () => {
    setError(null);
    setPartialFailure(null);
    try {
      const result = await bulkApprove.mutateAsync([...selected]);
      if (result.failed.length > 0) {
        setPartialFailure(result.failed);
        setConfirming(false);
      } else {
        onClear();
        setConfirming(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تنفيذ الموافقة المجمّعة.');
      setConfirming(false);
    }
  };

  return (
    <>
      <div
        role="status"
        className="fixed bottom-6 start-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-[12px] border border-border bg-white px-5 py-3 shadow-lg"
        style={{ transform: 'translateX(50%)' }}
      >
        <Icon name="check" size={18} className="text-wk-blue" />
        <span className="text-[13.5px] font-semibold text-ink">
          تم اختيار {selected.size} إعلان
        </span>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={bulkApprove.isPending}
          className="rounded-[8px] bg-green px-4 py-2 text-[13px] font-medium text-white hover:bg-green/90 disabled:opacity-50"
        >
          <Icon name="check" size={14} className="me-1.5 inline" />
          {bulkApprove.isPending ? 'جاري الموافقة...' : 'موافقة مجمّعة'}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-[8px] border border-border px-3 py-2 text-[13px] font-medium text-muted hover:bg-surface-2"
        >
          إلغاء
        </button>
      </div>

      {error && (
        <div className="fixed bottom-24 start-1/2 z-40 -translate-x-1/2 rounded-[8px] border border-red/30 bg-red-50 px-4 py-2.5 text-[13px] text-red shadow"
          style={{ transform: 'translateX(50%)' }}>
          {error}
          <button onClick={() => setError(null)} className="ms-3 text-red/70 hover:text-red">
            <Icon name="x" size={12} />
          </button>
        </div>
      )}

      {partialFailure && (
        <div className="fixed bottom-24 start-1/2 z-40 -translate-x-1/2 max-w-sm rounded-[8px] border border-amber/30 bg-amber-50 px-4 py-3 text-[13px] shadow"
          style={{ transform: 'translateX(50%)' }}>
          <p className="font-semibold text-amber">
            تمّت الموافقة على البقية — {partialFailure.length} لم تُنفَّذ:
          </p>
          <ul className="mt-1.5 list-inside list-disc text-[11.5px] text-ink/70">
            {partialFailure.map((f) => (
              <li key={f.adId}>
                <span className="font-mono">{f.adId.slice(-6)}</span>
                {' — '}
                {failureReasonAr(f.reason)}
              </li>
            ))}
          </ul>
          <button
            onClick={() => { setPartialFailure(null); onClear(); }}
            className="mt-2 text-[12px] text-amber underline"
          >
            إغلاق
          </button>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
            <h3 className="mb-1 text-[15px] font-semibold text-ink">تأكيد الموافقة المجمّعة</h3>
            <p className="mb-4 text-[13px] text-muted">
              سيتم قبول {selected.size} إعلان وتفعيلها. هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirm}
                disabled={bulkApprove.isPending}
                className="rounded-[8px] bg-green px-4 py-2 text-[13px] font-medium text-white hover:bg-green/90 disabled:opacity-50"
              >
                {bulkApprove.isPending ? 'جاري التنفيذ...' : 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
