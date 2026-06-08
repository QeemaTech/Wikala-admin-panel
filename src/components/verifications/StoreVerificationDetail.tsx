'use client';

import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { formatRelativeTime } from '@/lib/i18n/format';
import type { VerificationDoc, VerificationDTO } from '@/features/verifications/use-verifications';

const DOC_LABELS: Record<VerificationDoc['type'], string> = {
  ID_PHOTO: 'الهوية',
  SELFIE: 'صورة شخصية',
  COMMERCIAL_REG: 'السجل التجاري',
  TAX_CERT: 'البطاقة الضريبية',
  LOGO: 'شعار المتجر',
  BANNER: 'بانر المتجر',
};

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Step 03 — store documents grid + registered branches. Store kind only. */
export function StoreVerificationDetail({ v }: { v: VerificationDTO }) {
  return (
    <div className="mt-6">
      <p className="mb-2.5 text-[12px] font-medium text-muted">الخطوة 03 — وثائق المتجر</p>

      {v.storeDocs.length === 0 ? (
        <p className="rounded-[8px] bg-surface-2 p-3 text-[12.5px] text-muted">لم يتم رفع وثائق المتجر بعد</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {v.storeDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-[10px] border border-border p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-wk-blue-50 text-wk-blue">
                <Icon name="id-card" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink">{DOC_LABELS[doc.type] ?? doc.type}</div>
                <div className="mt-0.5 font-mono text-[11px] text-muted">
                  {formatBytes(doc.sizeBytes)}
                  {doc.uploadedAt && <> · {formatRelativeTime(doc.uploadedAt)}</>}
                </div>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 rounded-[7px] border border-border px-2.5 py-1 text-[12px] font-medium text-ink-2 hover:bg-surface-2"
              >
                <Icon name="eye" size={12} /> عرض
              </a>
            </div>
          ))}
        </div>
      )}

      {v.branches.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[12px] font-medium text-muted">الفروع المسجلة ({v.branches.length})</p>
          <div className="flex flex-wrap gap-2.5">
            {v.branches.map((b) => (
              <Chip key={b.id} tone="gray">
                <Icon name="location" size={11} /> {b.name} — {b.addressText}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
