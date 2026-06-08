'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { StoreCard } from '@/components/stores/StoreCard';
import { InviteStoreForm } from '@/components/stores/InviteStoreForm';
import { StoreSettingsPanel } from '@/components/stores/StoreSettingsPanel';
import { StoreDetail } from '@/components/stores/StoreDetail';
import { useStores, type StoreDTO } from '@/features/stores/use-stores';

export default function StoresPage() {
  const { data, isLoading, isError } = useStores();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsStore, setSettingsStore] = useState<StoreDTO | null>(null);
  const [detailStoreId, setDetailStoreId] = useState<string | null>(null);

  const stores = data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="المتاجر المعتمدة"
        sub="المتاجر التي اجتازت توثيق Step 03 — تظهر بشارة Premium وصفحة متجر مخصصة"
        actions={
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 rounded-[8px] bg-wk-blue px-3.5 py-2 text-[13px] font-medium text-white shadow-sm hover:opacity-90"
          >
            <Icon name="plus" size={14} /> دعوة متجر جديد
          </button>
        }
      />

      {isError ? (
        <p className="rounded-[10px] bg-red-50 p-4 text-[13px] text-red">تعذّر تحميل المتاجر. يرجى تحديث الصفحة.</p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[240px] animate-pulse rounded-[var(--radius)] bg-surface" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-[var(--radius)] border border-dashed border-border py-20 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted">
            <Icon name="store" size={22} />
          </span>
          <p className="text-[14px] font-medium text-ink">لا توجد متاجر معتمدة بعد</p>
          <p className="max-w-sm text-[12.5px] text-muted">
            تظهر المتاجر هنا بعد اجتياز توثيق المتجر. ادعُ متجراً جديداً للبدء.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onView={(s) => setDetailStoreId(s.id)}
              onSettings={(s) => setSettingsStore(s)}
            />
          ))}
        </div>
      )}

      {inviteOpen && <InviteStoreForm onClose={() => setInviteOpen(false)} />}
      {settingsStore && <StoreSettingsPanel store={settingsStore} onClose={() => setSettingsStore(null)} />}
      {detailStoreId && <StoreDetail storeId={detailStoreId} onClose={() => setDetailStoreId(null)} />}
    </div>
  );
}
