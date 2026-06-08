'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { formatRelativeTime } from '@/lib/i18n/format';
import { IndividualVerificationDetail } from './IndividualVerificationDetail';
import { StoreVerificationDetail } from './StoreVerificationDetail';
import { useVerificationDetail, type VerificationTimelineEntry } from '@/features/verifications/use-verifications';
import {
  useVerificationActions,
  type VerificationDecision,
} from '@/features/verifications/use-verification-actions';

const reasonSchema = z.string().trim().min(5, 'يرجى كتابة سبب لا يقل عن 5 أحرف');

const ACTION_AR: Record<string, { label: string; color: string }> = {
  submitted: { label: 'رفع المستندات', color: '#226199' },
  finalized: { label: 'أكمل التقديم', color: '#226199' },
  approved: { label: 'اعتُمد الطلب', color: '#1f9c63' },
  rejected: { label: 'رُفض الطلب', color: '#d44030' },
  returned_for_revision: { label: 'أُعيد للتعديل', color: '#d98a17' },
};

function timelineMeta(e: VerificationTimelineEntry) {
  const m = ACTION_AR[e.action] ?? { label: e.action, color: '#6c7b91' };
  const actor = e.actorName ?? (e.actorType === 'staff' ? 'موظف' : e.actorType === 'system' ? 'النظام' : 'المستخدم');
  return { ...m, actor };
}

interface VerificationDetailPanelProps {
  id: string | null;
  onDecided?: () => void;
}

export function VerificationDetailPanel({ id, onDecided }: VerificationDetailPanelProps) {
  const { data: v, isLoading, isError } = useVerificationDetail(id);
  const actions = useVerificationActions();

  const [dialog, setDialog] = useState<null | 'reject' | 'return-for-revision'>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!id) {
    return (
      <div className="grid h-full place-items-center rounded-[var(--radius)] border border-border bg-surface p-10 text-[13px] text-muted">
        اختر طلباً من القائمة لعرض تفاصيله
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid h-full place-items-center rounded-[var(--radius)] border border-border bg-surface p-10 text-[13px] text-red">
        تعذّر تحميل الطلب
      </div>
    );
  }

  if (isLoading || !v) {
    return <div className="h-full animate-pulse rounded-[var(--radius)] border border-border bg-surface" />;
  }

  const decided = v.status === 'APPROVED' || v.status === 'REJECTED';
  const isStore = v.kind === 'STORE';
  const name = v.user?.name ?? 'مستخدم محذوف';

  const run = (action: VerificationDecision, body?: { reason?: string }) => {
    setActionError(null);
    actions.mutate(
      { id: v.id, action, ...body },
      {
        onSuccess: () => {
          setDialog(null);
          setReason('');
          onDecided?.();
        },
        onError: (e) => setActionError(e instanceof ApiError ? e.message : 'تعذّر تنفيذ الإجراء'),
      },
    );
  };

  const confirmReason = () => {
    const parsed = reasonSchema.safeParse(reason);
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0].message);
      return;
    }
    setReasonError(null);
    run(dialog as VerificationDecision, { reason: parsed.data });
  };

  return (
    <Card
      title={`مراجعة طلب ${v.id.slice(-6)} — ${name}`}
      sub={isStore ? 'توثيق متجر (هوية + صورة شخصية + وثائق المتجر)' : 'توثيق فردي (هوية + صورة شخصية)'}
      actions={
        decided ? (
          <span className="text-[12.5px] font-medium text-muted">
            {v.status === 'APPROVED' ? 'تم الاعتماد' : 'تم الرفض'}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setDialog('return-for-revision'); setReason(''); setReasonError(null); }}
              disabled={actions.isPending}
              className="flex items-center gap-1.5 rounded-[8px] border border-border px-3 py-[7px] text-[13px] font-medium text-ink-2 hover:bg-surface-2 disabled:opacity-50"
            >
              <Icon name="message-square" size={14} /> طلب توضيح
            </button>
            <button
              type="button"
              onClick={() => { setDialog('reject'); setReason(''); setReasonError(null); }}
              disabled={actions.isPending}
              className="flex items-center gap-1.5 rounded-[8px] border border-red/30 bg-red-50 px-3 py-[7px] text-[13px] font-medium text-red hover:bg-red-50/70 disabled:opacity-50"
            >
              <Icon name="x" size={14} /> رفض
            </button>
            <button
              type="button"
              onClick={() => run('approve')}
              disabled={actions.isPending}
              className="flex items-center gap-1.5 rounded-[8px] bg-green px-3 py-[7px] text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              <Icon name="badge-check" size={14} /> اعتماد
            </button>
          </div>
        )
      }
    >
      {actionError && <p className="mb-3 rounded-[8px] bg-red-50 p-2.5 text-[12.5px] text-red">{actionError}</p>}

      <IndividualVerificationDetail v={v} />
      {isStore && <StoreVerificationDetail v={v} />}

      <div className="mt-6">
        <p className="mb-3 text-[12px] font-medium text-muted">سجل الإجراءات</p>
        {v.timeline.length === 0 ? (
          <p className="text-[12.5px] text-muted">لا توجد إجراءات مسجلة بعد</p>
        ) : (
          <ol className="space-y-3">
            {v.timeline.map((e, i) => {
              const m = timelineMeta(e);
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: m.color }} />
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink">{m.label}</div>
                    <div className="mt-0.5 text-[11.5px] text-muted">
                      {e.at && <span className="font-mono">{formatRelativeTime(e.at)}</span>}
                      {' · '}{m.actor}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {v.decisionReason && (
        <p className="mt-4 rounded-[8px] bg-surface-2 p-3 text-[12.5px] text-ink-2">
          <b>السبب:</b> {v.decisionReason}
        </p>
      )}

      {dialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">
                {dialog === 'reject' ? 'رفض الطلب' : 'طلب توضيح / إعادة للتعديل'}
              </h3>
              <button type="button" onClick={() => setDialog(null)} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2">
                <Icon name="x" size={16} />
              </button>
            </div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-ink-2">السبب</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              autoFocus
              className="w-full resize-none rounded-[8px] border border-border p-2.5 text-[13px] outline-none focus:border-wk-blue"
              placeholder={dialog === 'reject' ? 'سبب رفض الطلب...' : 'ما الذي يحتاج المستخدم لتعديله؟'}
            />
            {reasonError && <p className="mt-1 text-[12px] text-red">{reasonError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setDialog(null)} className="rounded-[8px] border border-border px-3.5 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-2">
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmReason}
                disabled={actions.isPending}
                className="rounded-[8px] bg-wk-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
