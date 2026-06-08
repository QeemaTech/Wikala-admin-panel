'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldWrapper, Input } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { useCreateUser, useUploadAvatar } from '@/features/users/use-user-actions';

const schema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(60, 'الاسم طويل جداً'),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'أدخل رقم هاتف بصيغة E.164 (مثال: +966501234567)'),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface AddUserFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserForm({ onClose, onSuccess }: AddUserFormProps) {
  const createUser    = useCreateUser();
  const uploadAvatar  = useUploadAvatar();
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await createUser.mutateAsync({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        password: values.password || undefined,
      });
      if (avatarFile && result.user?.id) {
        await uploadAvatar.mutateAsync({ userId: result.user.id, file: avatarFile });
      }
      onSuccess();
    } catch {
      // surfaced via createUser.isError / uploadAvatar.isError
    }
  };

  const isPending = createUser.isPending || uploadAvatar.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-[14px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">إضافة مستخدم جديد</h2>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          {/* avatar picker */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer"
              title="اختر صورة"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="معاينة الصورة"
                  className="h-[72px] w-[72px] rounded-full object-cover"
                />
              ) : (
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface">
                  <Icon name="image-frame" size={28} className="text-muted" />
                </span>
              )}
              <span className="absolute bottom-0 end-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-brand text-white">
                <Icon name="plus" size={11} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <FieldWrapper label="الاسم الكامل" error={errors.name?.message} required>
            <Input {...register('name')} placeholder="محمد أحمد" error={!!errors.name} />
          </FieldWrapper>

          <FieldWrapper label="رقم الهاتف" error={errors.phone?.message} required>
            <Input
              {...register('phone')}
              placeholder="+966501234567"
              dir="ltr"
              className="text-start"
              error={!!errors.phone}
            />
          </FieldWrapper>

          <FieldWrapper label="البريد الإلكتروني" error={errors.email?.message}>
            <Input
              {...register('email')}
              type="email"
              placeholder="user@example.com"
              dir="ltr"
              className="text-start"
              error={!!errors.email}
            />
          </FieldWrapper>

          <FieldWrapper label="كلمة المرور" error={errors.password?.message} hint="اختياري — يمكّن تسجيل الدخول بكلمة مرور (يسجّل المستخدمون عادةً عبر رمز الهاتف)">
            <Input
              {...register('password')}
              type="password"
              placeholder="8 أحرف على الأقل"
              dir="ltr"
              className="text-start"
              autoComplete="new-password"
              error={!!errors.password}
            />
          </FieldWrapper>

          {(createUser.isError || uploadAvatar.isError) && (
            <p className="rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">
              {((createUser.error || uploadAvatar.error) as Error)?.message ?? 'حدث خطأ، يرجى المحاولة مجدداً'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {uploadAvatar.isPending ? 'جارٍ رفع الصورة…' : createUser.isPending ? 'جارٍ الإنشاء…' : 'إضافة مستخدم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
