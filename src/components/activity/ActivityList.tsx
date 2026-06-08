'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import {
  formatRelativeTime,
  actionToTone,
  toneColor,
  formatActivityEntry,
  translateActorType,
  translateSubjectType,
  parseActivityDetail,
} from '@/lib/i18n/format';
import type { ActivityLogEntry } from '@/features/activity/use-activity-log';

interface ActivityListProps {
  entries: ActivityLogEntry[];
}

function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const tone = actionToTone(entry.action);
  const color = toneColor(tone);

  const parts = formatActivityEntry(
    entry.action,
    entry.actor.name,
    entry.actor.type,
    entry.subjectType,
    entry.subjectId,
    entry.detail,
    entry.subjectName,
  );

  const parsedDetail = parseActivityDetail(entry.detail);
  const hasExpansion = !!(parsedDetail && parsedDetail.length > 0);

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">
          {entry.actor.name ? (
            <Avatar name={entry.actor.name} size={36} />
          ) : (
            <div
              className="mt-1.5 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-[1.45] text-ink">
            <span className="font-semibold">{parts.actor}</span>
            {' · '}
            <span style={{ color }}>{parts.verb}</span>
            {parts.ref && <span className="text-muted"> — {parts.ref}</span>}
            {parts.extra && <span className="text-muted"> — {parts.extra}</span>}
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted">{translateActorType(entry.actor.type)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <time className="text-[11.5px] text-muted" dateTime={entry.createdAt} title={entry.createdAt}>
            {entry.createdAt ? formatRelativeTime(entry.createdAt) : '—'}
          </time>
          {hasExpansion && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[12px] text-wk-blue hover:underline"
            >
              {expanded ? 'إخفاء' : 'عرض التفاصيل'}
            </button>
          )}
        </div>
      </div>

      {expanded && hasExpansion && (
        <div className="mt-2 ms-[52px] rounded-[8px] bg-surface-2 px-3 py-2.5 text-[12px]">
          {parsedDetail?.map(({ label, value }, i) => (
            <div key={label} className={`flex gap-2 ${i > 0 ? 'mt-1' : ''}`}>
              <span className="text-muted">{label}:</span>
              <span className="text-ink">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityList({ entries }: ActivityListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-muted">
        <p className="text-[14px]">لا توجد نشاطات</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {entries.map((entry) => (
        <ActivityRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
