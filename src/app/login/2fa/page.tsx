'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { use2faEnroll, use2faVerify } from '@/features/auth/use-2fa';
import { useAuthStore } from '@/features/auth/auth-store';
import { isApiError } from '@/lib/api/errors';

const schema = z.object({
  totp: z.string().length(6, 'الرمز مكوّن من 6 أرقام').regex(/^\d+$/, 'أرقام فقط'),
});

type FormData = z.infer<typeof schema>;

export default function TwoFaPage() {
  const router = useRouter();
  const challengeToken = useAuthStore((s) => s.challengeToken);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);

  const enroll = use2faEnroll();
  const verify = use2faVerify();

  useEffect(() => {
    if (!challengeToken) { router.replace('/login'); return; }
    if (accessToken) { router.replace('/'); return; }
  }, [challengeToken, accessToken, router]);

  useEffect(() => {
    enroll.mutate(undefined, {
      onSuccess: (data) => setProvisioningUri(data.provisioningUri),
      // If already enrolled (CONFLICT), silently skip showing QR
    });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alreadyEnrolled =
    enroll.isError &&
    (enroll.error as { code?: string })?.code === 'CONFLICT';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ totp }) => {
    try {
      await verify.mutateAsync({ totp });
      router.replace('/');
    } catch (err) {
      if (isApiError(err) && err.code === '2FA_INVALID') {
        setError('totp', { message: 'الرمز غير صحيح أو انتهت صلاحيته' });
      } else {
        setError('root', { message: 'حدث خطأ، يرجى المحاولة مجدداً' });
      }
    }
  });

  const qrUrl = provisioningUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(provisioningUri)}`
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-[10px] bg-wk-blue shadow-logo">
            <Image src="/assets/wikala-logo.png" alt="وكالة" width={32} height={32} priority />
          </div>
          <div className="text-center">
            <h1 className="text-[20px] font-bold text-ink">التحقق بخطوتين</h1>
            <p className="mt-1 text-[13px] text-muted">امسح الرمز ثم أدخل رمز المصادقة</p>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-surface p-6 shadow-sm">
          {enroll.isPending && (
            <div className="mb-4 flex h-[180px] items-center justify-center rounded-[8px] bg-surface-2">
              <p className="text-[13px] text-muted">جاري التحميل...</p>
            </div>
          )}

          {qrUrl && (
            <div className="mb-4 flex flex-col items-center gap-3">
              <div className="rounded-[10px] border border-border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="رمز QR للمصادقة" width={180} height={180} />
              </div>
              <p className="text-center text-[12px] text-muted">
                امسح هذا الرمز باستخدام تطبيق المصادقة (Google Authenticator أو Authy)
              </p>
            </div>
          )}

          {alreadyEnrolled && (
            <div className="mb-4 rounded-[8px] bg-surface-2 px-4 py-3">
              <p className="text-center text-[13px] text-muted">
                أدخل رمز المصادقة من تطبيقك (Google Authenticator أو Authy)
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="totp" className="mb-1.5 block text-[13px] font-medium text-ink">
                رمز المصادقة
              </label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                maxLength={6}
                placeholder="000000"
                className="w-full rounded-[8px] border border-border bg-surface-2 px-3 py-2.5 text-center font-mono text-[20px] tracking-[0.5em] text-ink outline-none transition-colors placeholder:text-muted focus:border-wk-blue focus:ring-2 focus:ring-wk-blue/10"
                {...register('totp')}
              />
              {errors.totp && (
                <p className="mt-1 text-[12px] text-red">{errors.totp.message}</p>
              )}
            </div>

            {errors.root && (
              <p className="rounded-[8px] bg-red-50 px-3 py-2 text-[12.5px] text-red">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={verify.isPending}
              className="w-full rounded-[8px] bg-wk-blue py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {verify.isPending ? 'جاري التحقق...' : 'تحقق'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
