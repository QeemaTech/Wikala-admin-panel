'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { useLogin } from '@/features/auth/use-login';
import { useAuthStore } from '@/features/auth/auth-store';
import { isApiError } from '@/lib/api/errors';

const schema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور قصيرة جداً'),
});

type FormData = z.infer<typeof schema>;

const HIGHLIGHTS: { icon: 'shield-check' | 'grid' | 'activity'; text: string }[] = [
  { icon: 'shield-check', text: 'وصول آمن بمصادقة ثنائية' },
  { icon: 'grid', text: 'لوحة تحكم شاملة في مكان واحد' },
  { icon: 'activity', text: 'متابعة لحظية لكل الإجراءات' },
];

export default function LoginPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const login = useLogin();

  useEffect(() => {
    if (accessToken) router.replace('/');
  }, [accessToken, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login.mutateAsync(data);
      router.push('/login/2fa');
    } catch (err) {
      if (isApiError(err) && err.code === 'INVALID_CREDENTIALS') {
        setError('password', { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      } else {
        setError('root', { message: 'حدث خطأ، يرجى المحاولة مجدداً' });
      }
    }
  });

  return (
    <div className="lgn grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-side-bg lg:flex lg:flex-col lg:justify-between lg:p-12">
        <span aria-hidden className="lgn-blob lgn-blob-a" />
        <span aria-hidden className="lgn-blob lgn-blob-b" />
        <span aria-hidden className="lgn-grid" />

        <div className="lgn-rise relative z-10 flex items-center gap-3">
          <div className="grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-white shadow-logo">
            <Image src="/assets/wikala-logo.png" alt="وكالة" width={34} height={34} priority />
          </div>
          <div>
            <div className="text-[19px] font-bold tracking-[0.2px] text-white">وكالة</div>
            <div className="-mt-0.5 text-[12px] text-side-text-mut">لوحة التحكم الإدارية</div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="lgn-rise text-[30px] font-bold leading-snug text-white" style={{ animationDelay: '80ms' }}>
            أدِر سوق وكالة
            <br />
            من مكان واحد.
          </h2>
          <ul className="mt-7 flex flex-col gap-3.5">
            {HIGHLIGHTS.map((h, i) => (
              <li
                key={h.icon}
                className="lgn-rise flex items-center gap-3 text-[14px] text-side-text"
                style={{ animationDelay: `${160 + i * 90}ms` }}
              >
                <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-white/[0.08] text-white ring-1 ring-white/10">
                  <Icon name={h.icon} size={16} />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="lgn-rise relative z-10 text-[12px] text-side-text-mut" style={{ animationDelay: '460ms' }}>
          © وكالة — جميع الحقوق محفوظة
        </div>
      </aside>

      {/* form panel */}
      <div className="lgn-form-bg flex items-center justify-center px-4 py-10">
        <div className="lgn-rise w-full max-w-[400px]">
          {/* brand mark — mobile only */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-white shadow-logo ring-1 ring-border">
              <Image src="/assets/wikala-logo.png" alt="وكالة" width={34} height={34} priority />
            </div>
            <div className="text-[14px] font-bold text-side-bg">وكالة</div>
          </div>

          <div className="mb-6 text-center lg:text-start">
            <h1 className="text-[22px] font-bold text-ink">تسجيل الدخول</h1>
            <p className="mt-1 text-[13px] text-muted">مرحباً بعودتك — أدخل بياناتك للمتابعة</p>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-[var(--radius)] border border-border bg-surface p-6 shadow-sm"
            noValidate
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-muted">
                    <Icon name="id-card" size={15} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    dir="ltr"
                    className="w-full rounded-[8px] border border-border bg-surface-2 ps-9 pe-3 py-2.5 text-start text-[13.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-wk-blue focus:ring-2 focus:ring-wk-blue/10"
                    placeholder="name@wikala.sa"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="mt-1 text-[12px] text-red">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink">
                  كلمة المرور
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-muted">
                    <Icon name="lock" size={15} />
                  </span>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    dir="ltr"
                    className="w-full rounded-[8px] border border-border bg-surface-2 ps-9 pe-3 py-2.5 text-start text-[13.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-wk-blue focus:ring-2 focus:ring-wk-blue/10"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="mt-1 text-[12px] text-red">{errors.password.message}</p>}
              </div>

              {errors.root && (
                <p className="rounded-[8px] bg-red-50 px-3 py-2 text-[12.5px] text-red">{errors.root.message}</p>
              )}

              <button
                type="submit"
                disabled={login.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-wk-blue py-2.5 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-wk-blue-700 disabled:opacity-60"
              >
                {login.isPending ? (
                  <>
                    <span className="lgn-spin h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
                    جاري الدخول…
                  </>
                ) : (
                  <>
                    دخول
                    <Icon name="arrow-left" size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .lgn-form-bg { background: radial-gradient(120% 90% at 50% -10%, var(--wk-blue-50) 0%, var(--bg) 55%); }

        @keyframes lgnRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .lgn-rise { opacity: 0; animation: lgnRise .6s cubic-bezier(.2,.7,.2,1) forwards; }

        @keyframes lgnSpin { to { transform: rotate(360deg); } }
        .lgn-spin { animation: lgnSpin .7s linear infinite; }

        .lgn-blob { position: absolute; border-radius: 9999px; filter: blur(70px); opacity: .5; z-index: 0; }
        .lgn-blob-a { width: 340px; height: 340px; background: var(--wk-blue-700); inset-block-start: -80px; inset-inline-end: -60px; animation: lgnDriftA 16s ease-in-out infinite; }
        .lgn-blob-b { width: 300px; height: 300px; background: var(--wk-blue-900); inset-block-end: -70px; inset-inline-start: -50px; animation: lgnDriftB 19s ease-in-out infinite; }
        @keyframes lgnDriftA { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-30px,28px); } }
        @keyframes lgnDriftB { 0%,100% { transform: translate(0,0); } 50% { transform: translate(28px,-24px); } }

        .lgn-grid {
          position: absolute; inset: 0; z-index: 0; opacity: .12;
          background-image:
            linear-gradient(var(--surface) 1px, transparent 1px),
            linear-gradient(90deg, var(--surface) 1px, transparent 1px);
          background-size: 44px 44px;
          -webkit-mask-image: radial-gradient(90% 70% at 30% 30%, #000, transparent 75%);
          mask-image: radial-gradient(90% 70% at 30% 30%, #000, transparent 75%);
        }

        @media (prefers-reduced-motion: reduce) {
          .lgn-rise { opacity: 1; transform: none; animation: none; }
          .lgn-spin, .lgn-blob-a, .lgn-blob-b { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
