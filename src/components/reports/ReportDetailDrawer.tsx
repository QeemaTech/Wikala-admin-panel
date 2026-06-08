'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { SlaCountdown, slaState } from './SlaCountdown';
import { formatRelativeTime } from '@/lib/i18n/format';
import { useReportDetail, type ReportDTO, type ReportStatus } from '@/features/reports/use-reports';
import { useReportActions, type ReportAction } from '@/features/reports/use-report-actions';
import { useAdDetail } from '@/features/ads/use-ad-detail';
import { AdDetail } from '@/components/ads/AdDetail';
import { UserDetailDrawer } from '@/components/users/UserDetailDrawer';
import {
  reportTypeLabel,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  SUBJECT_TYPE_LABEL,
} from '@/features/reports/labels';

const reasonSchema = z.string().trim().min(3, 'يجب ذكر سبب لا يقل عن 3 أحرف');
const CLOSED: ReportStatus[] = ['RESOLVED', 'DISMISSED'];

interface ReportDetailDrawerProps {
  report: ReportDTO;
  onClose: () => void;
}

export function ReportDetailDrawer({ report, onClose }: ReportDetailDrawerProps) {
  const { data: detail, isLoading, isError } = useReportDetail(report.id);
  const actions = useReportActions();
  const [mode, setMode] = useState<null | 'resolve' | 'dismiss'>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewSubject, setViewSubject] = useState(false);

  const r = detail ?? report;
  const inactive = CLOSED.includes(r.status);

  // The reported subject is openable when it's an ad or user (message has no
  // standalone view). Clicking opens the same drawer used on /ads and /users.
  const canOpenSubject = (r.subjectType === 'AD' || r.subjectType === 'USER') && !!r.subjectId;
  const adQuery = useAdDetail(viewSubject && r.subjectType === 'AD' ? r.subjectId : null);

  const run = (action: ReportAction, resolutionReason?: string) => {
    setError(null);
    actions.mutate(
      { reportId: report.id, action, resolutionReason },
      {
        onSuccess: onClose,
        onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر تنفيذ الإجراء.'),
      },
    );
  };

  const confirmReason = () => {
    const parsed = reasonSchema.safeParse(reason);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'سبب غير صالح');
      return;
    }
    run(mode === 'resolve' ? 'resolve' : 'dismiss', parsed.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/30" role="dialog" aria-modal="true">
      <button type="button" aria-label="إغلاق" className="flex-1" onClick={onClose} />

      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-red-50 text-red">
              <Icon name="flag" size={20} />
            </div>
            <div>
              <h2 className="font-mono text-[15px] font-bold text-ink">#{r.id.slice(-6)}</h2>
              <p className="text-[12px] text-muted">{reportTypeLabel(r.type)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-muted hover:bg-surface-2" aria-label="إغلاق">
            <Icon name="x" size={16} />
          </button>
        </div>

        {isError ? (
          <div className="grid flex-1 place-items-center p-8 text-center text-[13px] text-muted">
            <div><Icon name="alert-triangle" size={24} className="mx-auto text-red" /><p className="mt-2">تعذّر تحميل البلاغ</p></div>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {/* Status + severity + SLA */}
            <div className="rounded-[12px] border border-border bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone={STATUS_TONE[r.status]} dot>{STATUS_LABEL[r.status]}</Chip>
                <Chip tone={SEVERITY_TONE[r.severity]} dot>خطورة {SEVERITY_LABEL[r.severity]}</Chip>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-[8px] bg-surface-2 px-3 py-2.5">
                <span className="text-[12.5px] text-muted">الوقت المتبقي (SLA)</span>
                <SlaCountdown remainingSeconds={r.slaRemainingSeconds} severity={r.severity} inactive={inactive} />
              </div>
              {r.slaDueAt && (
                <p className="mt-1.5 text-[11.5px] text-muted">
                  الموعد النهائي: <span className="font-mono" dir="ltr">{new Date(r.slaDueAt).toLocaleString('ar-EG')}</span>
                  {slaState(r.slaRemainingSeconds, r.severity) === 'breached' && !inactive && (
                    <span className="ms-1 font-medium text-red">· تخطّت SLA</span>
                  )}
                </p>
              )}
            </div>

            {/* Subject + reporter */}
            <div className="grid grid-cols-2 gap-3">
              {canOpenSubject ? (
                <button
                  type="button"
                  onClick={() => setViewSubject(true)}
                  className="group rounded-[12px] border border-border bg-white p-4 text-start transition-colors hover:border-brand hover:bg-brand/5"
                >
                  <p className="text-[11.5px] text-muted">المُبلَّغ عنه ({SUBJECT_TYPE_LABEL[r.subjectType]})</p>
                  <p className="mt-1 text-[13px] font-medium text-ink group-hover:text-brand">{r.subjectLabel || '—'}</p>
                  <p className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-muted" dir="ltr">#{r.subjectId!.slice(-6)}</span>
                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-brand">
                      {r.subjectType === 'AD' ? 'عرض الإعلان' : 'عرض المستخدم'}
                      <Icon name="arrow-left" size={11} />
                    </span>
                  </p>
                </button>
              ) : (
                <div className="rounded-[12px] border border-border bg-white p-4">
                  <p className="text-[11.5px] text-muted">المُبلَّغ عنه ({SUBJECT_TYPE_LABEL[r.subjectType]})</p>
                  <p className="mt-1 text-[13px] font-medium text-ink">{r.subjectLabel || '—'}</p>
                  {r.subjectId && <p className="mt-0.5 font-mono text-[11px] text-muted" dir="ltr">#{r.subjectId.slice(-6)}</p>}
                </div>
              )}
              <div className="rounded-[12px] border border-border bg-white p-4">
                <p className="text-[11.5px] text-muted">المُبلِّغ</p>
                <p className="mt-1 text-[13px] font-medium text-ink">{r.reporterName || '—'}</p>
                {r.createdAt && <p className="mt-0.5 text-[11px] text-muted">{formatRelativeTime(r.createdAt)}</p>}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-[12px] border border-border bg-white p-4">
              <h3 className="text-[13px] font-semibold text-ink">تفاصيل البلاغ</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{r.details || 'لا توجد تفاصيل'}</p>
            </div>

            {/* Attachments */}
            {r.attachments.length > 0 && (
              <div className="rounded-[12px] border border-border bg-white p-4">
                <h3 className="mb-2 text-[13px] font-semibold text-ink">المرفقات ({r.attachments.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {r.attachments.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-2.5 py-1.5 text-[12px] text-ink hover:bg-surface-2"
                    >
                      <Icon name="image-frame" size={13} /> مرفق {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution outcome (closed reports) */}
            {inactive && r.resolutionReason && (
              <div className="rounded-[12px] border border-border bg-surface-2 p-4">
                <h3 className="text-[13px] font-semibold text-ink">القرار</h3>
                <p className="mt-1 text-[12.5px] text-ink-2">{r.resolutionReason}</p>
              </div>
            )}

            {isLoading && <p className="text-center text-[12px] text-muted">جارٍ تحميل التفاصيل...</p>}
          </div>
        )}

        {/* Resolution panel */}
        {!inactive && (
          <div className="border-t border-border bg-white px-5 py-4">
            {error && <p className="mb-2 text-[12px] text-red">{error}</p>}
            {mode ? (
              <>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={mode === 'resolve' ? 'سبب الحل...' : 'سبب الرفض...'}
                  rows={2}
                  autoFocus
                  className="mb-3 w-full resize-none rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setMode(null); setReason(''); setError(null); }} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">
                    إلغاء
                  </button>
                  <button
                    onClick={confirmReason}
                    disabled={actions.isPending}
                    className={`rounded-[8px] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50 ${mode === 'resolve' ? 'bg-green hover:bg-green/90' : 'bg-red hover:bg-red/90'}`}
                  >
                    {actions.isPending ? 'جارٍ...' : mode === 'resolve' ? 'تأكيد الحل' : 'تأكيد الرفض'}
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setMode('resolve')} className="rounded-[8px] bg-green px-3 py-2.5 text-[13px] font-medium text-white hover:bg-green/90">حل البلاغ</button>
                <button onClick={() => setMode('dismiss')} className="rounded-[8px] border border-border px-3 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-2">رفض</button>
                <button
                  onClick={() => run('escalate')}
                  disabled={actions.isPending || r.status === 'ESCALATED'}
                  className="rounded-[8px] bg-amber px-3 py-2.5 text-[13px] font-medium text-white hover:bg-amber/90 disabled:opacity-40"
                >
                  تصعيد
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reported-subject view — same drawers used on /ads and /users */}
      {viewSubject && r.subjectType === 'AD' && adQuery.data && (
        <AdDetail ad={adQuery.data} onClose={() => setViewSubject(false)} />
      )}
      {viewSubject && r.subjectType === 'AD' && adQuery.isLoading && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/30">
          <div className="rounded-[12px] bg-white px-6 py-4 text-[13px] text-muted shadow-xl">جارٍ تحميل الإعلان…</div>
        </div>
      )}
      {viewSubject && r.subjectType === 'USER' && r.subjectId && (
        <UserDetailDrawer userId={r.subjectId} onClose={() => setViewSubject(false)} />
      )}
    </div>
  );
}
