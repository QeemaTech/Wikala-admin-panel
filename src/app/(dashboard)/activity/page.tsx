'use client';

import { useState, useCallback, useMemo } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ActivityList } from '@/components/activity/ActivityList';
import { useActivityLog } from '@/features/activity/use-activity-log';
import { exportCsv } from '@/lib/export/csv';
import { formatRelativeTime } from '@/lib/i18n/format';

const TONE_OPTIONS = [
  { value: '', label: 'كل الأحداث' },
  { value: 'green', label: 'موافقة / تفعيل' },
  { value: 'red', label: 'رفض / حظر' },
  { value: 'amber', label: 'تعديل' },
  { value: 'violet', label: 'توثيق' },
  { value: 'blue', label: 'أخرى' },
];

export default function ActivityPage() {
  const [tone, setTone] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActivityLog({ tone: tone || undefined });

  const entries = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const handleExport = useCallback(async () => {
    const rows = entries.map((e) => ({
      التاريخ: e.createdAt ? formatRelativeTime(e.createdAt) : '',
      الفاعل: e.actor.name ?? '',
      نوع_الفاعل: e.actor.type,
      الإجراء: e.action,
      نوع_العنصر: e.subjectType ?? '',
      معرف_العنصر: e.subjectId ?? '',
      التفاصيل: e.detail ?? '',
    }));
    exportCsv(rows, 'سجل-النشاط');
  }, [entries]);


  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="سجل النشاط"
        sub="جميع الإجراءات التي تقوم بها الإدارة والنظام — مدّة الاحتفاظ 90 يوم"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-2"
            >
              <Icon name="filter" size={14} />
              تصفية
            </button>
            <button
              onClick={handleExport}
              disabled={entries.length === 0}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              <Icon name="download" size={14} />
              تصدير
            </button>
          </div>
        }
      />

      {showFilters && (
        <div className="mb-4 flex items-center gap-3 rounded-[10px] border border-border bg-surface p-4">
          <label className="text-[13px] text-muted">النوع:</label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTone(opt.value)}
                className={`rounded-[6px] px-3 py-1.5 text-[12px] transition-colors ${
                  tone === opt.value
                    ? 'bg-wk-blue text-white'
                    : 'border border-border bg-surface-2 text-ink hover:bg-surface'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Card>
        {isError && (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px] text-red">حدث خطأ أثناء تحميل سجل النشاط.</p>
          </div>
        )}

        {isLoading ? (
          <div className="divide-y divide-border animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-surface-2" />
                  <div className="h-3 w-1/2 rounded bg-surface-2" />
                </div>
                <div className="h-3 w-16 shrink-0 rounded bg-surface-2" />
              </div>
            ))}
          </div>
        ) : (
          <ActivityList entries={entries} />
        )}

        {hasNextPage && (
          <div className="flex justify-center border-t border-border py-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-[8px] border border-border bg-surface px-4 py-2 text-[13px] text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              {isFetchingNextPage ? 'جارٍ التحميل…' : 'تحميل المزيد'}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
