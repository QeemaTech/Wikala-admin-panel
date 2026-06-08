'use client';

import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { Segmented } from '@/components/ui/Segmented';
import { cn } from '@/lib/utils';
import { buildPages } from '@/lib/ui/build-pages';
import { SlaCountdown, slaState } from './SlaCountdown';
import {
  useReports,
  type ReportDTO,
  type ReportSeverity,
  type ReportsListParams,
} from '@/features/reports/use-reports';
import {
  reportTypeLabel,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  SUBJECT_TYPE_LABEL,
} from '@/features/reports/labels';

const SEVERITY_OPTIONS = [
  { value: 'ALL', label: 'كل الخطورة' },
  { value: 'HIGH', label: 'عالية' },
  { value: 'MED', label: 'متوسطة' },
  { value: 'LOW', label: 'منخفضة' },
];

const STRIPE_COLOR: Record<ReportSeverity, string> = { HIGH: '#d44030', MED: '#d98a17', LOW: '#199c8c' };
const INACTIVE_STATUSES = new Set(['RESOLVED', 'DISMISSED']);

interface ReportsTableProps {
  params: ReportsListParams;
  search: string;
  onSearchChange: (v: string) => void;
  severity: ReportSeverity | 'ALL';
  onSeverityChange: (v: ReportSeverity | 'ALL') => void;
  onPageChange: (page: number) => void;
  onOpen: (report: ReportDTO) => void;
}

export function ReportsTable({
  params,
  search,
  onSearchChange,
  severity,
  onSeverityChange,
  onPageChange,
  onOpen,
}: ReportsTableProps) {
  const { data, isLoading, isError } = useReports(params);

  return (
    <section className="rounded-[var(--radius)] border border-border bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-[18px] py-3">
        <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-[8px] border border-border bg-surface px-3 py-2">
          <Icon name="search" size={14} className="text-muted" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث برقم البلاغ، المُبلّغ، أو الكيان..."
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
          />
        </div>
        <Segmented
          options={SEVERITY_OPTIONS}
          value={severity}
          onChange={(v) => onSeverityChange(v as ReportSeverity | 'ALL')}
        />
      </div>

      {isError ? (
        <div className="p-10 text-center text-[13px] text-muted">
          <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
          <p className="mt-2">تعذّر تحميل البلاغات</p>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-[52px] border-b border-border last:border-0" />
          ))}
        </div>
      ) : (
        <ReportsTableBody data={data} onOpen={onOpen} onPageChange={onPageChange} />
      )}
    </section>
  );
}

function ReportsTableBody({
  data,
  onOpen,
  onPageChange,
}: {
  data: { items: ReportDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } } | undefined;
  onOpen: (r: ReportDTO) => void;
  onPageChange: (page: number) => void;
}) {
  const items = data?.items ?? [];
  const meta = data?.meta;

  if (items.length === 0) {
    return (
      <div className="p-12 text-center">
        <Icon name="check" size={28} className="mx-auto text-green" />
        <p className="mt-2 text-[13px] text-muted">لا توجد بلاغات في هذه القائمة</p>
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
              <th className="w-2 p-0" />
              <th className="px-4 py-3 text-start font-medium text-muted">رقم البلاغ</th>
              <th className="px-4 py-3 text-start font-medium text-muted">النوع</th>
              <th className="px-4 py-3 text-start font-medium text-muted">المُبلَّغ عنه</th>
              <th className="px-4 py-3 text-start font-medium text-muted">المُبلِّغ</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الخطورة</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الوقت المتبقي (SLA)</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const inactive = INACTIVE_STATUSES.has(r.status);
              const state = inactive ? 'ok' : slaState(r.slaRemainingSeconds, r.severity);
              return (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-border last:border-0 hover:bg-surface/60',
                    state === 'breached' && 'bg-red-50/60',
                    state === 'near' && 'bg-amber-50/50',
                  )}
                >
                  <td className="p-0">
                    <div className="mx-1.5 h-9 w-[3px] rounded-full" style={{ backgroundColor: STRIPE_COLOR[r.severity] }} />
                  </td>
                  <td className="px-4 py-3"><span className="font-mono font-bold text-ink">#{r.id.slice(-6)}</span></td>
                  <td className="px-4 py-3 text-ink">{reportTypeLabel(r.type)}</td>
                  <td className="px-4 py-3 text-ink">
                    {r.subjectLabel || (r.subjectId ? `${SUBJECT_TYPE_LABEL[r.subjectType]} #${r.subjectId.slice(-6)}` : '—')}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.reporterName || '—'}</td>
                  <td className="px-4 py-3">
                    <Chip tone={SEVERITY_TONE[r.severity]} dot>{SEVERITY_LABEL[r.severity]}</Chip>
                  </td>
                  <td className="px-4 py-3">
                    <SlaCountdown remainingSeconds={r.slaRemainingSeconds} severity={r.severity} inactive={inactive} />
                  </td>
                  <td className="px-4 py-3"><Chip tone={STATUS_TONE[r.status]} dot>{STATUS_LABEL[r.status]}</Chip></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onOpen(r)}
                      className="flex items-center gap-1 rounded-[6px] border border-border px-2.5 py-[5px] text-[12px] font-medium text-ink hover:bg-surface"
                    >
                      <Icon name="eye" size={12} />
                      فتح
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 0 && (
        <div className="flex items-center justify-between border-t border-border px-[18px] py-3 text-[12px] text-muted">
          <span>تعرض {from}–{to} من {total} بلاغاً</span>
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
                    className={cn(
                      'grid h-7 min-w-[28px] place-items-center rounded-[7px] border px-1 font-mono text-[12px] transition-colors',
                      p === page ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-ink-2 hover:bg-surface-2',
                    )}
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
