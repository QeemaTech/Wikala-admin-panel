'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { Tabs } from '@/components/ui/Tabs';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { ReorderPanel } from '@/components/categories/ReorderPanel';
import { useCategories, type CategoryScope } from '@/features/categories/use-categories';
import { formatNumber } from '@/lib/i18n/format';

/** Two independent taxonomies live in one collection, split by `scope`. */
const SCOPE_TABS = [
  { id: 'ADS', label: 'فئات الإعلانات' },
  { id: 'PRODUCTS', label: 'فئات المنتجات' },
];

export default function CategoriesPage() {
  const [scope, setScope] = useState<CategoryScope>('ADS');
  const { data, isLoading, isError } = useCategories(scope);
  const [showAdd, setShowAdd] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const categories = data?.items ?? [];
  const rootCategories = categories.filter((c) => !c.parentId);

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
        <p className="rounded-[10px] bg-red-50 p-4 text-[13px] text-red">
          حدث خطأ أثناء تحميل الفئات. يرجى تحديث الصفحة.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="الفئات والأقسام"
        sub={`الفئات الرئيسية في الواجهة الأمامية${rootCategories.length > 0 ? ` — ${formatNumber(rootCategories.length)} فئات` : ''} · أيقونات ثلاثية الأبعاد · حقول ديناميكية لكل فئة`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReorderMode((v) => !v)}
              className={`flex items-center gap-1.5 rounded-[8px] border px-3 py-[7px] text-[13px] font-medium shadow-sm transition-colors ${
                reorderMode
                  ? 'border-brand/30 bg-brand/10 text-brand'
                  : 'border-border bg-surface text-ink hover:bg-surface-2'
              }`}
            >
              <Icon name="refresh" size={14} />
              {reorderMode ? 'إلغاء الترتيب' : 'إعادة ترتيب'}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3 py-[7px] text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
            >
              <Icon name="plus" size={14} />
              إضافة فئة
            </button>
          </div>
        }
      />

      <Tabs
        items={SCOPE_TABS}
        value={scope}
        onChange={(id) => {
          setScope(id as CategoryScope);
          setReorderMode(false);
        }}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[200px] rounded-[var(--radius)] bg-surface" />
          ))}
        </div>
      ) : reorderMode ? (
        <ReorderPanel
          categories={rootCategories}
          onDone={() => setReorderMode(false)}
        />
      ) : (
        <CategoryGrid categories={rootCategories} scope={scope} />
      )}

      {showAdd && (
        <CategoryForm scope={scope} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
