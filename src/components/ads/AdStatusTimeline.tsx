import { cn } from '@/lib/utils';
import type { AdStatus } from '@/features/ads/use-ads';

const FLOW: AdStatus[] = ['DRAFT', 'PENDING_AI', 'FLAGGED', 'PENDING_HUMAN', 'ACTIVE', 'EXPIRED', 'ARCHIVED'];

const LABELS: Record<AdStatus, string> = {
  DRAFT: 'مسودة',
  PENDING_AI: 'مراجعة آلية',
  FLAGGED: 'مُعلَّم',
  PENDING_HUMAN: 'مراجعة بشرية',
  ACTIVE: 'نشط',
  EXPIRED: 'منتهي',
  ARCHIVED: 'مؤرشف',
  REJECTED: 'مرفوض',
};

interface AdStatusTimelineProps {
  status: AdStatus;
  rejectionReason?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
}

function fmt(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return null;
  }
}

export function AdStatusTimeline({ status, rejectionReason, publishedAt, expiresAt }: AdStatusTimelineProps) {
  // Rejected is a terminal branch off the review stage.
  if (status === 'REJECTED') {
    const upto: AdStatus[] = ['DRAFT', 'PENDING_AI', 'FLAGGED', 'PENDING_HUMAN'];
    return (
      <div>
        {upto.map((s) => (
          <Row key={s} label={LABELS[s]} state="done" />
        ))}
        <Row label={LABELS.REJECTED} state="rejected" when={null} note={rejectionReason ?? undefined} />
      </div>
    );
  }

  const currentIdx = FLOW.indexOf(status);
  return (
    <div>
      {FLOW.map((s, i) => {
        const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'upcoming';
        const when = s === 'ACTIVE' ? fmt(publishedAt) : s === 'EXPIRED' ? fmt(expiresAt) : null;
        return <Row key={s} label={LABELS[s]} state={state} when={when} />;
      })}
    </div>
  );
}

type RowState = 'done' | 'current' | 'upcoming' | 'rejected';

function Row({ label, state, when, note }: { label: string; state: RowState; when?: string | null; note?: string }) {
  return (
    <div className="flex items-start gap-3 border-t border-border py-2.5 first:border-t-0">
      <span
        className={cn(
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          state === 'done' && 'bg-brand',
          state === 'current' && 'bg-brand ring-2 ring-brand/25',
          state === 'upcoming' && 'bg-border',
          state === 'rejected' && 'bg-red',
        )}
        aria-hidden="true"
      />
      <div className="flex-1">
        <div
          className={cn(
            'text-[13px]',
            state === 'upcoming' ? 'text-muted' : 'text-ink',
            state === 'current' && 'font-semibold',
            state === 'rejected' && 'font-semibold text-red',
          )}
        >
          {label}
        </div>
        {when && <div className="mt-0.5 text-[11.5px] text-muted">{when}</div>}
        {note && <div className="mt-0.5 text-[11.5px] text-red">{note}</div>}
      </div>
    </div>
  );
}
