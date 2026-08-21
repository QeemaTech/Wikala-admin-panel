'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { ContentPagesList } from '@/components/content-pages/ContentPagesList';
import { ContentPageForm } from '@/components/content-pages/ContentPageForm';
import {
  usePublishContentPage,
  useUnpublishContentPage,
  useDeleteContentPage,
} from '@/features/content-pages/use-content-page-mutations';
import {
  KIND_LABELS,
  type ContentPageDTO,
  type ContentPageKind,
  type ContentPageStatus,
} from '@/features/content-pages/use-content-pages';

type FormState = { mode: 'create' } | { mode: 'edit'; page: ContentPageDTO } | null;

const KINDS: ContentPageKind[] = ['LEGAL', 'HELP', 'ABOUT', 'FAQ', 'OTHER'];

/**
 * Privacy policy, terms, help centre and the rest of the static content the
 * app renders. Before this existed the app had no source for any of it, so the
 * legal text was destined to be hardcoded in the Flutter bundle — which means
 * a lawyer's wording change would have required an App Store release.
 */
export default function ContentPagesPage() {
  const [form, setForm] = useState<FormState>(null);
  const [statusFilter, setStatusFilter] = useState<ContentPageStatus | undefined>(undefined);
  const [kindFilter, setKindFilter] = useState<ContentPageKind | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<ContentPageDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const publish = usePublishContentPage();
  const unpublish = useUnpublishContentPage();

  const fail = (fallback: string) => (e: unknown) =>
    setActionError(e instanceof Error ? e.message : fallback);

  const onPublish = (page: ContentPageDTO) => {
    setActionError(null);
    publish.mutate(page.id, { onError: fail('تعذّر نشر الصفحة.') });
  };

  const onUnpublish = (page: ContentPageDTO) => {
    setActionError(null);
    unpublish.mutate(page.id, { onError: fail('تعذّر إخفاء الصفحة.') });
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="الصفحات والمحتوى"
        sub="سياسة الخصوصية، الشروط والأحكام، مركز المساعدة — تظهر مباشرة في التطبيق"
        actions={
          <button
            type="button"
            onClick={() => setForm({ mode: 'create' })}
            className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90"
          >
            <Icon name="plus" size={14} /> صفحة جديدة
          </button>
        }
      />

      {actionError && (
        <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-red/20 bg-red-50 px-4 py-2.5 text-[12.5px] text-red">
          <Icon name="alert-triangle" size={15} /> {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterPill active={!statusFilter} onClick={() => setStatusFilter(undefined)}>
          كل الحالات
        </FilterPill>
        <FilterPill active={statusFilter === 'PUBLISHED'} onClick={() => setStatusFilter('PUBLISHED')}>
          منشورة
        </FilterPill>
        <FilterPill active={statusFilter === 'DRAFT'} onClick={() => setStatusFilter('DRAFT')}>
          مسودة
        </FilterPill>

        <span className="mx-1 h-4 w-px bg-border" aria-hidden />

        <FilterPill active={!kindFilter} onClick={() => setKindFilter(undefined)}>
          كل الأنواع
        </FilterPill>
        {KINDS.map((k) => (
          <FilterPill key={k} active={kindFilter === k} onClick={() => setKindFilter(k)}>
            {KIND_LABELS[k]}
          </FilterPill>
        ))}
      </div>

      <ContentPagesList
        statusFilter={statusFilter}
        kindFilter={kindFilter}
        onEdit={(page) => setForm({ mode: 'edit', page })}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onDelete={(page) => setConfirmDelete(page)}
      />

      {form?.mode === 'create' && <ContentPageForm onClose={() => setForm(null)} />}
      {form?.mode === 'edit' && <ContentPageForm page={form.page} onClose={() => setForm(null)} />}
      {confirmDelete && (
        <DeletePageDialog page={confirmDelete} onClose={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-full bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white'
          : 'rounded-full border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-2'
      }
    >
      {children}
    </button>
  );
}

function DeletePageDialog({ page, onClose }: { page: ContentPageDTO; onClose: () => void }) {
  const del = useDeleteContentPage();
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    setError(null);
    del.mutate(page.id, {
      onSuccess: onClose,
      onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر حذف الصفحة.'),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-red-50 text-red">
            <Icon name="trash" size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-ink">حذف الصفحة</h3>
            <p className="text-[12px] text-muted" dir="ltr">
              {page.slug}
            </p>
          </div>
        </div>
        <p className="mb-4 text-[13px] text-ink-2">
          لو كانت الصفحة منشورة، التطبيق مش هيلاقيها بعد الحذف. لو محتاج تخفيها مؤقتاً استخدم
          «إخفاء» بدل الحذف.
        </p>
        {error && <p className="mb-2 text-[12px] text-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
          >
            إلغاء
          </button>
          <button
            onClick={confirm}
            disabled={del.isPending}
            className="rounded-[8px] bg-red px-4 py-2 text-[13px] font-medium text-white hover:bg-red/90 disabled:opacity-50"
          >
            {del.isPending ? 'جارٍ...' : 'حذف'}
          </button>
        </div>
      </div>
    </div>
  );
}
