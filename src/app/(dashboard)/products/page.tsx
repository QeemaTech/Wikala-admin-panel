'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { Tabs } from '@/components/ui/Tabs';
import { Segmented } from '@/components/ui/Segmented';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductForm } from '@/components/products/ProductForm';
import { ReviewsPanel } from '@/components/products/ReviewsPanel';
import { useProducts, type ProductPlacement, type ProductRowDTO, type ProductStatus } from '@/features/products/use-products';
import { useDeleteProduct } from '@/features/products/use-product-mutations';

const TABS = [
  { id: 'all', label: 'الكل' },
  { id: 'FLASH', label: 'العروض الفلاش' },
  { id: 'TODAYS_DEAL', label: 'صفقات اليوم' },
  { id: 'reviews', label: 'التقييمات' },
];

const STATUS_FILTERS = [
  { value: '', label: 'الكل' },
  { value: 'ACTIVE', label: 'نشط' },
  { value: 'DRAFT', label: 'مسودة' },
  { value: 'HIDDEN', label: 'مخفي' },
  { value: 'OUT_OF_STOCK', label: 'نفدت الكمية' },
];

export default function ProductsPage() {
  const [tab, setTab] = useState('all');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formFor, setFormFor] = useState<{ id: string | null } | null>(null);
  const [deleteFor, setDeleteFor] = useState<ProductRowDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const placement: ProductPlacement | '' = tab === 'FLASH' || tab === 'TODAYS_DEAL' ? tab : '';
  const { data, isLoading, isError } = useProducts({ status, placement, search, page });
  const remove = useDeleteProduct();

  const resetTo = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const confirmDelete = () => {
    if (!deleteFor) return;
    setDeleteError(null);
    remove.mutate(deleteFor.id, {
      onSuccess: () => setDeleteFor(null),
      onError: (e) => setDeleteError(e instanceof Error ? e.message : 'تعذّر حذف المنتج.'),
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="المنتجات"
        sub="متجر الوكالة — منتجات تُدار من لوحة التحكم وتظهر في العروض الفلاش وصفقات اليوم"
        actions={
          <button
            type="button"
            onClick={() => setFormFor({ id: null })}
            className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90"
          >
            <Icon name="plus" size={14} /> إضافة منتج
          </button>
        }
      />

      <Tabs items={TABS} value={tab} onChange={(id) => resetTo(() => setTab(id))} />

      {tab === 'reviews' ? (
        <ReviewsPanel />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              options={STATUS_FILTERS}
              value={status}
              onChange={(v) => resetTo(() => setStatus(v as ProductStatus | ''))}
            />
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-muted">
                <Icon name="search" size={14} />
              </span>
              <input
                value={search}
                onChange={(e) => resetTo(() => setSearch(e.target.value))}
                placeholder="ابحث باسم المنتج…"
                className="w-64 rounded-[8px] border border-border bg-surface py-2 pe-3 ps-9 text-[13px] text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>
          </div>

          <ProductsTable
            items={data?.items ?? []}
            meta={data?.meta}
            isLoading={isLoading}
            isError={isError}
            onEdit={(p) => setFormFor({ id: p.id })}
            onDelete={(p) => {
              setDeleteError(null);
              setDeleteFor(p);
            }}
            onPageChange={setPage}
          />
        </>
      )}

      {formFor && <ProductForm productId={formFor.id} onClose={() => setFormFor(null)} />}

      {deleteFor && (
        <ConfirmDialog
          title="حذف المنتج"
          message={`سيُخفى «${deleteFor.title}» من التطبيق. الطلبات السابقة تحتفظ بنسخة من بياناته.`}
          confirmLabel="حذف"
          loading={remove.isPending}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteFor(null)}
        />
      )}
    </div>
  );
}
