'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { StaffTable } from '@/components/staff/StaffTable';
import { StaffForm } from '@/components/staff/StaffForm';
import { PermissionsMatrix } from '@/components/staff/PermissionsMatrix';
import { useAuthStore } from '@/features/auth/auth-store';
import type { StaffMember } from '@/features/staff/use-staff';

export default function StaffPage() {
  const role = useAuthStore((s) => s.staff?.role);
  const isSuper = role === 'SUPER_ADMIN';

  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [permsMember, setPermsMember] = useState<StaffMember | null>(null);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="فريق الإدارة"
        sub="إدارة الأدوار والصلاحيات وسجل الإجراءات"
        actions={
          isSuper ? (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-brand/90"
            >
              <Icon name="plus" size={14} /> إضافة عضو
            </button>
          ) : null
        }
      />

      <StaffTable onEdit={setEditMember} onPermissions={setPermsMember} />

      {createOpen && <StaffForm onClose={() => setCreateOpen(false)} />}
      {editMember && <StaffForm member={editMember} onClose={() => setEditMember(null)} />}
      {permsMember && <PermissionsMatrix member={permsMember} onClose={() => setPermsMember(null)} />}
    </div>
  );
}
