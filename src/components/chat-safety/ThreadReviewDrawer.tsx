'use client';

import { useState, Fragment, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { MaskedValue } from './MaskedValue';
import { formatRelativeTime } from '@/lib/i18n/format';
import { useFlagDetail, type FlaggedThreadDTO, type ReviewerDecision } from '@/features/chat-safety/use-flagged-threads';
import { useThreadReview, useRevealAudit } from '@/features/chat-safety/use-thread-review';
import {
  REASON_LABEL,
  REASON_ICON,
  AUTO_ACTION_LABEL,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  DECISION_LABEL,
} from '@/features/chat-safety/labels';

const PHONE_RE = /(?:(?:\+|00)\d{1,3}[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{2,4}/g;
const URL_RE = /https?:\/\/\S+|\b(?:[a-zA-Z0-9-]+\.)+(?:com|net|org|io|app|me|co|info|biz|ly|store|shop|site)\b\S*/g;

const DECISIONS: { value: ReviewerDecision; tone: string }[] = [
  { value: 'CONFIRM_BLOCK', tone: 'bg-red text-white hover:bg-red/90' },
  { value: 'DISMISS', tone: 'bg-green text-white hover:bg-green/90' },
  { value: 'WARN_USER', tone: 'bg-amber text-white hover:bg-amber/90' },
  { value: 'BAN_USER', tone: 'border border-red text-red hover:bg-red-50' },
];

/** Splits a message body and renders any phone/URL tokens through MaskedValue. */
function renderMaskedBody(body: string, onReveal: (field: string) => void): ReactNode {
  if (!body) return null;
  // Tag sensitive spans, then walk the string preserving order.
  const marks: { start: number; end: number; kind: 'phone' | 'url'; text: string }[] = [];
  for (const re of [{ re: URL_RE, kind: 'url' as const }, { re: PHONE_RE, kind: 'phone' as const }]) {
    re.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.re.exec(body)) !== null) {
      if (m[0].trim().length < 4) continue;
      marks.push({ start: m.index, end: m.index + m[0].length, kind: re.kind, text: m[0] });
    }
  }
  if (marks.length === 0) return <span>{body}</span>;
  marks.sort((a, b) => a.start - b.start);

  const out: ReactNode[] = [];
  let cursor = 0;
  marks.forEach((mk, i) => {
    if (mk.start < cursor) return; // skip overlaps
    if (mk.start > cursor) out.push(<Fragment key={`t-${i}`}>{body.slice(cursor, mk.start)}</Fragment>);
    out.push(
      <MaskedValue key={`m-${i}`} value={mk.text} kind={mk.kind} onReveal={() => onReveal(mk.kind)} />,
    );
    cursor = mk.end;
  });
  if (cursor < body.length) out.push(<Fragment key="t-end">{body.slice(cursor)}</Fragment>);
  return <span>{out}</span>;
}

interface ThreadReviewDrawerProps {
  thread: FlaggedThreadDTO;
  onClose: () => void;
}

export function ThreadReviewDrawer({ thread, onClose }: ThreadReviewDrawerProps) {
  const { data: detail, isLoading, isError } = useFlagDetail(thread.id);
  const review = useThreadReview();
  const revealAudit = useRevealAudit();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const flag = detail ?? thread;
  const onReveal = (field: string) => revealAudit.mutate({ flagId: thread.id, field });

  const submit = (decision: ReviewerDecision) => {
    setError(null);
    review.mutate(
      { flagId: thread.id, decision, note: note.trim() || undefined },
      {
        onSuccess: onClose,
        onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر حفظ القرار.'),
      },
    );
  };

  const alreadyReviewed = !!flag.reviewerDecision;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/30" role="dialog" aria-modal="true">
      <button type="button" aria-label="إغلاق" className="flex-1" onClick={onClose} />

      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-red-50 text-red">
              <Icon name={REASON_ICON[flag.reason]} size={20} />
            </div>
            <div>
              <h2 className="font-mono text-[15px] font-bold text-ink">#{flag.chatId?.slice(-6) ?? '—'}</h2>
              <p className="text-[12px] text-muted">مراجعة محادثة مرفوعة</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-muted hover:bg-surface-2" aria-label="إغلاق">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Flag summary */}
          <div className="rounded-[12px] border border-border bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="red"><Icon name="alert-triangle" size={11} className="inline-block" />{REASON_LABEL[flag.reason]}</Chip>
              <Chip tone={SEVERITY_TONE[flag.severity]}>خطورة {SEVERITY_LABEL[flag.severity]}</Chip>
              <Chip tone="gray">{AUTO_ACTION_LABEL[flag.autoAction]}</Chip>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <p className="text-muted">الأطراف</p>
                <p className="mt-0.5 text-ink">{flag.parties.sender?.name ?? '—'} ◀ {flag.parties.recipient?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted">الإعلان</p>
                <p className="mt-0.5 text-ink">{flag.ad?.title ?? (flag.ad ? `#${flag.ad.id.slice(-6)}` : '—')}</p>
              </div>
            </div>
          </div>

          {/* Thread context */}
          <div>
            <h3 className="mb-2.5 text-[13px] font-semibold text-ink">سياق المحادثة</h3>
            {isError ? (
              <div className="rounded-[12px] border border-border bg-white p-6 text-center text-[12.5px] text-muted">
                <Icon name="alert-triangle" size={20} className="mx-auto text-red" />
                <p className="mt-1.5">تعذّر تحميل سياق المحادثة</p>
              </div>
            ) : isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-[10px] bg-surface-2" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(detail?.context ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-[10px] border px-3.5 py-2.5 text-[12.5px] ${
                      m.isFlagged ? 'border-red/40 bg-red-50' : 'border-border bg-white'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-ink">{m.senderName ?? '—'}</span>
                      <span className="text-[11px] text-muted">{m.createdAt ? formatRelativeTime(m.createdAt) : ''}</span>
                    </div>
                    <div className="text-ink-2 leading-relaxed">
                      {m.body ? renderMaskedBody(m.body, onReveal) : <span className="text-muted">[{m.type}]</span>}
                    </div>
                    {m.isFlagged && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red">
                        <Icon name="flag" size={11} /> الرسالة المرفوعة
                      </p>
                    )}
                  </div>
                ))}
                {(detail?.context?.length ?? 0) === 0 && (
                  <p className="rounded-[10px] border border-border bg-white p-4 text-center text-[12.5px] text-muted">
                    لا يوجد سياق إضافي
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Decision footer */}
        <div className="border-t border-border bg-white px-5 py-4">
          {alreadyReviewed ? (
            <div className="flex items-center gap-2 rounded-[10px] bg-surface-2 px-4 py-3 text-[12.5px] text-muted">
              <Icon name="check" size={15} className="text-green" />
              تمت المراجعة — القرار: <span className="font-medium text-ink">{DECISION_LABEL[flag.reviewerDecision!]}</span>
            </div>
          ) : (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ملاحظة المراجعة (اختياري)..."
                rows={2}
                className="mb-3 w-full resize-none rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
              {error && <p className="mb-2 text-[12px] text-red">{error}</p>}
              <div className="grid grid-cols-2 gap-2">
                {DECISIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    disabled={review.isPending}
                    onClick={() => submit(d.value)}
                    className={`rounded-[8px] px-3.5 py-2.5 text-[13px] font-medium transition-colors disabled:opacity-50 ${d.tone}`}
                  >
                    {DECISION_LABEL[d.value]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
