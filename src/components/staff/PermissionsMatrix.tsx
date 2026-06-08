'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Switch } from '@/components/forms/Field';
import { ApiError } from '@/lib/api/errors';
import { useUpdateStaffPermissions } from '@/features/staff/use-staff-permissions';
import { ROLE_PERMISSIONS } from '@/features/auth/permissions';
import { STAFF_PERMISSIONS, roleLabel } from '@/features/staff/labels';
import type { StaffPermission } from '@/features/auth/auth-store';
import type { StaffMember } from '@/features/staff/use-staff';

interface PermissionsMatrixProps {
  member: StaffMember;
  onClose: () => void;
}

const sortedKey = (set: Set<StaffPermission>) => [...set].sort().join(',');

export function PermissionsMatrix({ member, onClose }: PermissionsMatrixProps) {
  const save = useUpdateStaffPermissions();
  const [error, setError] = useState<string | null>(null);

  // Seed from the member's explicit permissions; if none have been set yet, fall
  // back to the role's default preset so the grid reflects effective access.
  const initial = useMemo<Set<StaffPermission>>(
    () => new Set(member.permissions.length > 0 ? member.permissions : ROLE_PERMISSIONS[member.role] ?? []),
    [member.permissions, member.role],
  );
  const [selected, setSelected] = useState<Set<StaffPermission>>(new Set(initial));

  const dirty = sortedKey(selected) !== sortedKey(initial);

  const toggle = (perm: StaffPermission) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const applyRolePreset = () => {
    setSelected(new Set(ROLE_PERMISSIONS[member.role] ?? []));
  };

  const onSave = async () => {
    setError(null);
    try {
      await save.mutateAsync({ id: member.id, permissions: [...selected] });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'تعذّر حفظ الصلاحيات. حاول مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[12px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">صلاحيات {member.name}</h2>
            <p className="mt-0.5 text-[12px] text-muted">الدور الحالي: {roleLabel(member.role)}</p>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink">
            <Icon name="x" size={15} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
          <span className="text-[12px] text-muted">{selected.size} من {STAFF_PERMISSIONS.length} صلاحية مُفعّلة</span>
          <button
            type="button"
            onClick={applyRolePreset}
            className="flex items-center gap-1.5 rounded-[7px] border border-border px-2.5 py-1.5 text-[12px] font-medium text-ink hover:bg-surface"
          >
            <Icon name="refresh" size={12} />
            تطبيق صلاحيات الدور
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-px overflow-y-auto bg-border sm:grid-cols-2">
          {STAFF_PERMISSIONS.map((p) => (
            <div key={p.value} className="flex items-center justify-between gap-3 bg-white px-5 py-3">
              <span className="text-[13px] text-ink">{p.label}</span>
              <Switch checked={selected.has(p.value)} onChange={() => toggle(p.value)} />
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 py-4">
          {error && <p className="mb-3 rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface">إلغاء</button>
            <button
              type="button"
              onClick={onSave}
              disabled={!dirty || save.isPending}
              className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {save.isPending ? 'جارٍ الحفظ…' : 'حفظ الصلاحيات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
