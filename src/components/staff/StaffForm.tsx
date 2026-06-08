'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { FieldWrapper, Input, Select } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { useCreateStaff, useUpdateStaff } from '@/features/staff/use-staff-mutations';
import { ROLE_PERMISSIONS } from '@/features/auth/permissions';
import { STAFF_ROLES, statusMeta } from '@/features/staff/labels';
import { Chip } from '@/components/ui/Chip';
import type { StaffRole } from '@/features/auth/auth-store';
import type { StaffMember } from '@/features/staff/use-staff';

const ROLE_VALUES = STAFF_ROLES.map((r) => r.value) as [StaffRole, ...StaffRole[]];

const schema = z.object({
  name: z.string().trim().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(60, 'الاسم طويل جداً'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  role: z.enum(ROLE_VALUES, { errorMap: () => ({ message: 'اختر دوراً' }) }),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface StaffFormProps {
  /** Present → edit mode; absent → create mode. */
  member?: StaffMember | null;
  onClose: () => void;
}

export function StaffForm({ member, onClose }: StaffFormProps) {
  const isEdit = !!member;
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useZodForm(schema, {
    defaultValues: {
      name: member?.name ?? '',
      email: member?.email ?? '',
      role: member?.role ?? 'SUPPORT',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (v: FormValues) => {
    setSubmitError(null);
    try {
      if (isEdit && member) {
        // On a role change, re-seed permissions to the new role's defaults in the
        // SAME request so the member is never left with a new role + stale perms
        // (and a partial failure can't split the two).
        const payload =
          v.role !== member.role
            ? { name: v.name, role: v.role, permissions: ROLE_PERMISSIONS[v.role] ?? [] }
            : { name: v.name, role: v.role };
        await update.mutateAsync({ id: member.id, payload });
        onClose();
      } else {
        const created = await create.mutateAsync({
          name: v.name,
          email: v.email,
          role: v.role,
          permissions: ROLE_PERMISSIONS[v.role] ?? [],
          password: v.password || undefined,
        });
        if (created.tempPassword) {
          setTempPassword(created.tempPassword);
        } else {
          onClose();
        }
      }
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ العضو. حاول مرة أخرى.');
      }
    }
  });

  const isPending = isSubmitting || create.isPending || update.isPending;

  // After a successful create, surface the one-time temp password.
  if (tempPassword) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-xl">
          <div className="mb-3 flex items-center gap-2 text-green">
            <Icon name="check" size={18} />
            <h3 className="text-[15px] font-semibold text-ink">تم إنشاء العضو</h3>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-2">
            تم إرسال كلمة مرور مؤقتة إلى بريد العضو. يمكنك مشاركتها يدوياً إذا لزم — تظهر مرة واحدة فقط:
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 rounded-[8px] border border-border bg-surface px-3 py-2.5">
            <code className="select-all font-mono text-[13px] text-ink" dir="ltr">{tempPassword}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(tempPassword)}
              className="rounded-[6px] border border-border px-2 py-1 text-[12px] text-ink hover:bg-surface-2"
            >
              نسخ
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90">
              تم
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[12px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">{isEdit ? 'تعديل العضو' : 'إضافة عضو'}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink">
            <Icon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5">
          {submitError && <p className="rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">{submitError}</p>}

          <FieldWrapper label="الاسم الكامل" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="محمد أحمد" error={!!errors.name} />
          </FieldWrapper>

          <FieldWrapper label="البريد الإلكتروني" required error={errors.email?.message} hint={isEdit ? 'لا يمكن تغيير البريد بعد الإنشاء' : undefined}>
            <Input {...register('email')} type="email" placeholder="user@wikala.app" dir="ltr" className="text-start" error={!!errors.email} disabled={isEdit} />
          </FieldWrapper>

          <FieldWrapper label="الدور" required error={errors.role?.message}>
            <Select {...register('role')} error={!!errors.role}>
              {STAFF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </FieldWrapper>

          {!isEdit && (
            <FieldWrapper label="كلمة المرور" error={errors.password?.message} hint="اختياري — اتركها فارغة لإرسال كلمة مرور مؤقتة بالبريد">
              <Input {...register('password')} type="password" placeholder="8 أحرف على الأقل" dir="ltr" className="text-start" autoComplete="new-password" error={!!errors.password} />
            </FieldWrapper>
          )}

          {isEdit && member && (
            <FieldWrapper label="الحالة">
              <div>
                <Chip tone={statusMeta(member.status).tone}>{statusMeta(member.status).label}</Chip>
              </div>
            </FieldWrapper>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface">إلغاء</button>
            <button type="submit" disabled={isPending} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50">
              {isPending ? 'جارٍ الحفظ…' : isEdit ? 'حفظ' : 'إضافة عضو'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
