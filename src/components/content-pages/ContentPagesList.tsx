'use client';

import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import {
  useContentPages,
  KIND_LABELS,
  type ContentPageDTO,
  type ContentPageKind,
} from '@/features/content-pages/use-content-pages';

interface ContentPagesListProps {
  onEdit: (p: ContentPageDTO) => void;
  onPublish: (p: ContentPageDTO) => void;
  onUnpublish: (p: ContentPageDTO) => void;
  onDelete: (p: ContentPageDTO) => void;
  statusFilter?: 'DRAFT' | 'PUBLISHED';
  kindFilter?: ContentPageKind;
}

export function ContentPagesList({ onEdit, onPublish, onUnpublish, onDelete, statusFilter, kindFilter }: ContentPagesListProps) {
  const { data, isLoading, isError } = useContentPages({ status: statusFilter, kind: kindFilter });
  const items = data?.items ?? [];

  let publishedCount = 0;
  let draftCount = 0;
  for (const p of items) {
    if (p.status === 'PUBLISHED') publishedCount += 1;
    else draftCount += 1;
  }

  return (
    <Card title="صفحات المحتوى" sub={isLoading ? undefined : `${publishedCount} منشور · ${draftCount} مسودة`}>
      {isError ? (
        <div className="py-10 text-center text-[13px] text-muted">
          <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
          <p className="mt-2">تعذّر تحميل صفحات المحتوى</p>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-[10px] bg-surface" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <Icon name="doc" size={28} className="mx-auto text-muted" />
          <p className="mt-2 text-[13px] text-muted">لا توجد صفحات محتوى بعد</p>
        </div>
      ) : (
        <div>
          {items.map((p) => (
            <ContentPageRow
              key={p.id}
              page={p}
              onEdit={() => onEdit(p)}
              onPublish={() => onPublish(p)}
              onUnpublish={() => onUnpublish(p)}
              onDelete={() => onDelete(p)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function ContentPageRow({
  page: p,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  page: ContentPageDTO;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-border py-3.5 last:border-0">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-surface-2">
        <Icon name="doc" size={18} className="text-muted" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold text-ink">{p.titleAr}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
          <span dir="ltr" className="font-mono">/{p.slug}</span>
          <span>·</span>
          <span>{KIND_LABELS[p.kind]}</span>
          <span>·</span>
          <span>v{p.version}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {p.status === 'PUBLISHED' ? (
          <Chip tone="green" dot>منشور</Chip>
        ) : (
          <Chip tone="gray">مسودة</Chip>
        )}
        <button
          onClick={onEdit}
          className="flex items-center gap-1 rounded-[6px] border border-border px-2.5 py-[5px] text-[12px] font-medium text-ink hover:bg-surface"
        >
          <Icon name="pencil" size={12} /> تعديل
        </button>
        {p.status === 'DRAFT' && (
          <button
            onClick={onPublish}
            className="flex items-center gap-1 rounded-[6px] border border-green/30 bg-green-50 px-2.5 py-[5px] text-[12px] font-medium text-green hover:bg-green-100"
          >
            <Icon name="check" size={12} /> نشر
          </button>
        )}
        {p.status === 'PUBLISHED' && (
          <button
            onClick={onUnpublish}
            className="flex items-center gap-1 rounded-[6px] border border-amber/30 bg-amber-50 px-2.5 py-[5px] text-[12px] font-medium text-amber hover:bg-amber-100"
          >
            سحب
          </button>
        )}
        <button
          onClick={onDelete}
          className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-red-50 hover:text-red"
          aria-label="حذف"
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}
