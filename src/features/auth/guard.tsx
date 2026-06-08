'use client';

import { Icon } from '@/components/ui/Icon';
import type { StaffPermission } from './auth-store';
import { usePermission } from './permissions';

interface GuardProps {
  permission: StaffPermission;
  children: React.ReactNode;
}

export function Guard({ permission, children }: GuardProps) {
  const allowed = usePermission(permission);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Icon name="shield-alert" size={40} className="mb-4 text-muted" />
        <p className="text-[15px] font-medium text-ink">غير مسموح بالوصول</p>
        <p className="mt-1 text-[13px] text-muted">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
      </div>
    );
  }

  return <>{children}</>;
}
