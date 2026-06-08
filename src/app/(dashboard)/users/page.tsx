'use client';

import { useState, useCallback } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Segmented } from '@/components/ui/Segmented';
import { Icon } from '@/components/ui/Icon';
import { UsersKpiStrip } from '@/components/users/UsersKpiStrip';
import { UsersTable } from '@/components/users/UsersTable';
import { UserDetailDrawer } from '@/components/users/UserDetailDrawer';
import { AddUserForm } from '@/components/users/AddUserForm';
import { useBulkBanUsers, useExportUsers } from '@/features/users/use-user-actions';
import type { UserDTO, UserTier } from '@/features/users/use-users';

const TIER_OPTIONS = [
  { value: 'ALL', label: 'كل المستويات' },
  { value: 'REGISTERED', label: 'عادي' },
  { value: 'VERIFIED', label: 'موثَّق' },
  { value: 'PREMIUM', label: 'بريميوم' },
];

export default function UsersPage() {
  const [tier, setTier] = useState<UserTier>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewUser, setViewUser] = useState<UserDTO | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkReason, setBulkReason] = useState('');

  const bulkBan = useBulkBanUsers();
  const exportUsers = useExportUsers();

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    clearTimeout((window as unknown as { _usersSearchTimer?: ReturnType<typeof setTimeout> })._usersSearchTimer);
    (window as unknown as { _usersSearchTimer?: ReturnType<typeof setTimeout> })._usersSearchTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400);
  }, []);

  const handleTierChange = (v: string) => {
    setTier(v as UserTier);
    setPage(1);
  };

  const handleBulkBan = async () => {
    if (!bulkReason.trim()) return;
    await bulkBan.mutateAsync({ userIds: [...selectedIds], reason: bulkReason });
    setSelectedIds(new Set());
    setBulkModal(false);
    setBulkReason('');
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="المستخدمون"
        sub="إدارة الحسابات الفردية · حظر، تحذير، تعديل، إعادة تعيين كلمة المرور"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportUsers.mutate({ tier, search: debouncedSearch || undefined })}
              disabled={exportUsers.isPending}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-[7px] text-[13px] font-medium text-ink shadow-sm transition-colors hover:bg-surface-2 disabled:opacity-60"
            >
              <Icon name="download" size={14} />
              {exportUsers.isPending ? 'جاري التصدير...' : 'تصدير'}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3 py-[7px] text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
            >
              <Icon name="plus" size={14} />
              إضافة مستخدم
            </button>
          </div>
        }
      />

      <div className="space-y-5">
        <UsersKpiStrip />

        <div className="flex items-center gap-3">
          <div className="relative w-[320px]">
            <Icon name="search" size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="بحث بالاسم، البريد، الهاتف، أو رقم الحساب..."
              className="w-full rounded-[8px] border border-border bg-surface py-2 ps-9 pe-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 placeholder:text-muted"
            />
          </div>
          <Segmented options={TIER_OPTIONS} value={tier} onChange={handleTierChange} />
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-[7px] text-[13px] font-medium text-ink shadow-sm hover:bg-surface-2">
            <Icon name="filter" size={14} />
            فلاتر
          </button>
          <button
            onClick={() => selectedIds.size > 0 && setBulkModal(true)}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 rounded-[8px] border border-[#d44030]/30 bg-[#d44030]/5 px-3 py-[7px] text-[13px] font-medium text-red shadow-sm hover:bg-[#d44030]/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="lock" size={14} />
            {selectedIds.size > 0 ? `حظر جماعي (${selectedIds.size})` : 'إجراء جماعي'}
          </button>
        </div>

        <UsersTable
          params={{ tier, search: debouncedSearch || undefined, page }}
          onView={setViewUser}
          onPageChange={setPage}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
        />
      </div>

      {viewUser && (
        <UserDetailDrawer userId={viewUser.id} onClose={() => setViewUser(null)} />
      )}

      {showAdd && (
        <AddUserForm
          onClose={() => setShowAdd(false)}
          onSuccess={() => setShowAdd(false)}
        />
      )}

      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
            <h3 className="mb-1 text-[15px] font-semibold text-ink">حظر جماعي</h3>
            <p className="mb-3 text-[12.5px] text-muted">سيتم حظر {selectedIds.size} مستخدم</p>
            <textarea
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder="سبب الحظر..."
              rows={3}
              className="w-full resize-none rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => { setBulkModal(false); setBulkReason(''); }}
                className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface"
              >
                إلغاء
              </button>
              <button
                onClick={handleBulkBan}
                disabled={!bulkReason.trim() || bulkBan.isPending}
                className="rounded-[8px] bg-red px-4 py-2 text-[13px] font-medium text-white hover:bg-red/90 disabled:opacity-50"
              >
                {bulkBan.isPending ? 'جاري الحظر...' : 'تأكيد الحظر'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
