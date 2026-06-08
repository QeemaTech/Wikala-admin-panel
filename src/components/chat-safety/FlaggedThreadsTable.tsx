'use client';

import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { formatRelativeTime } from '@/lib/i18n/format';
import {
  useFlaggedThreads,
  type FlaggedThreadDTO,
  type FlaggedThreadsParams,
} from '@/features/chat-safety/use-flagged-threads';
import { REASON_LABEL, AUTO_ACTION_LABEL, DECISION_LABEL, DECISION_TONE } from '@/features/chat-safety/labels';
import { buildPages } from '@/lib/ui/build-pages';

function partiesLabel(t: FlaggedThreadDTO): string {
  const a = t.parties.sender?.name ?? '—';
  const b = t.parties.recipient?.name ?? '—';
  return `${a} ◀ ${b}`;
}

interface FlaggedThreadsTableProps {
  params: FlaggedThreadsParams;
  onPageChange: (page: number) => void;
  onOpen: (thread: FlaggedThreadDTO) => void;
}

export function FlaggedThreadsTable({ params, onPageChange, onOpen }: FlaggedThreadsTableProps) {
  const { data, isLoading, isError } = useFlaggedThreads(params);

  return (
    <section className="rounded-[var(--radius)] border border-border bg-white">
      <div className="border-b border-border px-[18px] py-3.5">
        <h2 className="text-[14px] font-bold text-ink">محادثات مرفوعة للمراجعة</h2>
        <p className="mt-0.5 text-[12px] text-muted">بناءً على فحص الذكاء الاصطناعي</p>
      </div>

      {isError ? (
        <div className="p-8 text-center text-[13px] text-muted">
          <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
          <p className="mt-2">تعذّر تحميل المحادثات المرفوعة</p>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[52px] border-b border-border last:border-0" />
          ))}
        </div>
      ) : (
        <FlaggedTableBody data={data} onOpen={onOpen} onPageChange={onPageChange} />
      )}
    </section>
  );
}

function FlaggedTableBody({
  data,
  onOpen,
  onPageChange,
}: {
  data: { items: FlaggedThreadDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } } | undefined;
  onOpen: (t: FlaggedThreadDTO) => void;
  onPageChange: (page: number) => void;
}) {
  const items = data?.items ?? [];
  const meta = data?.meta;

  if (items.length === 0) {
    return (
      <div className="p-12 text-center">
        <Icon name="shield-check" size={28} className="mx-auto text-green" />
        <p className="mt-2 text-[13px] text-muted">لا توجد محادثات مرفوعة للمراجعة</p>
      </div>
    );
  }

  const total = meta?.total ?? items.length;
  const pages = meta?.totalPages ?? 1;
  const page = meta?.page ?? 1;
  const pageSize = meta?.pageSize ?? items.length;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-start font-medium text-muted">المحادثة</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الأطراف</th>
              <th className="px-4 py-3 text-start font-medium text-muted">سبب التنبيه</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الإعلان</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الإجراء التلقائي</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الوقت</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-ink">#{t.chatId?.slice(-6) ?? '—'}</span>
                </td>
                <td className="px-4 py-3 text-ink">{partiesLabel(t)}</td>
                <td className="px-4 py-3">
                  <Chip tone="red">
                    <Icon name="alert-triangle" size={11} className="inline-block" />
                    {REASON_LABEL[t.reason]}
                  </Chip>
                </td>
                <td className="px-4 py-3 font-mono text-muted">{t.ad ? `#${t.ad.id.slice(-6)}` : '—'}</td>
                <td className="px-4 py-3">
                  {t.reviewerDecision ? (
                    <Chip tone={DECISION_TONE[t.reviewerDecision]}>{DECISION_LABEL[t.reviewerDecision]}</Chip>
                  ) : (
                    <span className="text-muted">{AUTO_ACTION_LABEL[t.autoAction]}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{t.createdAt ? formatRelativeTime(t.createdAt) : '—'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onOpen(t)}
                    className="flex items-center gap-1 rounded-[6px] border border-border px-2.5 py-[5px] text-[12px] font-medium text-ink hover:bg-surface"
                  >
                    <Icon name="eye" size={12} />
                    فتح
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 0 && (
        <div className="flex items-center justify-between border-t border-border px-[18px] py-3 text-[12px] text-muted">
          <span>تعرض {from}–{to} من {total} محادثة</span>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
                aria-label="السابق"
              >
                <Icon name="chevron-end" size={12} />
              </button>
              {buildPages(page, pages).map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="grid h-7 min-w-[28px] place-items-center text-ink-2">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`grid h-7 min-w-[28px] place-items-center rounded-[7px] border px-1 font-mono text-[12px] transition-colors ${
                      p === page ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-ink-2 hover:bg-surface-2'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pages}
                className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
                aria-label="التالي"
              >
                <Icon name="chevron-start" size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
