import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

/**
 * Branded global 404. Renders inside the root RTL layout (no dashboard shell).
 * All colors trace to design tokens (CSS custom properties); motion is pure CSS
 * so the page stays a server component.
 */
export default function NotFound() {
  return (
    <main className="wk-404 relative grid min-h-screen place-items-center overflow-hidden bg-bg px-6 text-center">
      {/* drifting brand blobs */}
      <span aria-hidden className="wk-blob wk-blob-a" />
      <span aria-hidden className="wk-blob wk-blob-b" />
      <span aria-hidden className="wk-grid" />

      <div className="relative z-10 flex max-w-xl flex-col items-center">
        {/* brand mark */}
        <div className="wk-rise wk-float flex items-center gap-3" style={{ animationDelay: '0ms' }}>
          <div className="grid h-[46px] w-[46px] place-items-center rounded-[12px] bg-white shadow-logo">
            <Image src="/assets/wikala-logo.png" alt="وكالة" width={30} height={30} priority />
          </div>
          <div className="text-start">
            <div className="text-[17px] font-bold tracking-[0.2px] text-side-bg">وكالة</div>
            <div className="-mt-0.5 text-[11px] text-muted">لوحة التحكم الإدارية</div>
          </div>
        </div>

        {/* 404 — the middle 0 is a "search" that came up empty */}
        <div className="wk-rise mt-10 flex items-center justify-center gap-2 sm:gap-4" style={{ animationDelay: '120ms' }}>
          <span className="wk-digit">4</span>
          <span className="wk-zero">
            <span aria-hidden className="wk-zero-ring" />
            <span aria-hidden className="wk-zero-spark" />
            <Icon name="search" size={54} className="wk-zero-glass text-wk-blue" />
          </span>
          <span className="wk-digit">4</span>
        </div>

        {/* copy */}
        <h1 className="wk-rise mt-8 text-[24px] font-bold text-ink sm:text-[28px]" style={{ animationDelay: '240ms' }}>
          الصفحة غير موجودة
        </h1>
        <p className="wk-rise mt-3 max-w-md text-[14.5px] leading-relaxed text-muted" style={{ animationDelay: '320ms' }}>
          بحثنا في كل مكان ولم نعثر على هذه الصفحة. ربما تم نقلها أو حذفها، أو أن الرابط غير صحيح.
        </p>

        {/* actions */}
        <div className="wk-rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '420ms' }}>
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-[10px] bg-wk-blue px-5 py-2.5 text-[13.5px] font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-wk-blue-700 hover:shadow-lg"
          >
            <Icon name="grid" size={15} className="transition-transform duration-200 group-hover:scale-110" />
            العودة إلى لوحة التحكم
          </Link>
          <Link
            href="/activity"
            className="flex items-center gap-2 rounded-[10px] border border-border bg-surface px-5 py-2.5 text-[13.5px] font-medium text-ink transition-colors duration-200 hover:bg-surface-2"
          >
            <Icon name="activity" size={15} />
            سجل النشاط
          </Link>
        </div>

        {/* error code chip */}
        <div className="wk-rise mt-9 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1" style={{ animationDelay: '520ms' }}>
          <span className="h-1.5 w-1.5 rounded-full bg-wk-blue" />
          <span className="font-mono text-[11.5px] text-muted">رمز الخطأ · 404</span>
        </div>
      </div>

      <style>{`
        .wk-404 { background: radial-gradient(120% 90% at 50% -10%, var(--wk-blue-50) 0%, var(--bg) 55%); }

        /* entrance */
        @keyframes wkRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .wk-rise { opacity: 0; animation: wkRise .7s cubic-bezier(.2,.7,.2,1) forwards; }

        /* gentle bob on the brand mark */
        @keyframes wkFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        .wk-float { animation: wkRise .7s cubic-bezier(.2,.7,.2,1) forwards, wkFloat 4.5s ease-in-out 1s infinite; }

        /* big digits with a moving brand-gradient sheen */
        .wk-digit, .wk-zero {
          font-weight: 800;
          line-height: 1;
          font-size: clamp(96px, 22vw, 168px);
          letter-spacing: -2px;
        }
        .wk-digit {
          background: linear-gradient(135deg, var(--wk-blue-400) 0%, var(--wk-blue) 45%, var(--wk-blue-900) 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
          animation: wkSheen 6s ease-in-out infinite;
        }
        @keyframes wkSheen { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        /* the zero = a search that found nothing */
        .wk-zero {
          position: relative;
          display: inline-grid;
          place-items: center;
          width: clamp(96px, 22vw, 168px);
          height: clamp(96px, 22vw, 168px);
        }
        .wk-zero-ring {
          position: absolute; inset: 8%;
          border-radius: 9999px;
          border: 7px solid var(--wk-blue);
          opacity: .18;
        }
        .wk-zero-ring::after {
          content: ""; position: absolute; inset: -7px;
          border-radius: 9999px;
          border: 7px solid transparent;
          border-top-color: var(--wk-blue);
          animation: wkSpin 2.6s cubic-bezier(.5,.1,.5,.9) infinite;
        }
        @keyframes wkSpin { to { transform: rotate(360deg); } }
        .wk-zero-glass { animation: wkPeek 4.5s ease-in-out infinite; }
        @keyframes wkPeek {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          30%     { transform: translate(5px,-4px) rotate(-8deg); }
          60%     { transform: translate(-4px,3px) rotate(7deg); }
        }
        /* a little spark blinking inside the lens */
        .wk-zero-spark {
          position: absolute; top: 33%; left: 41%;
          width: 9px; height: 9px; border-radius: 9999px;
          background: var(--wk-blue-400);
          box-shadow: 0 0 10px 2px var(--wk-blue-200);
          animation: wkBlink 2.2s ease-in-out infinite;
        }
        @keyframes wkBlink { 0%,100% { opacity: 0; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }

        /* soft drifting background blobs */
        .wk-blob { position: absolute; border-radius: 9999px; filter: blur(60px); opacity: .35; z-index: 0; }
        .wk-blob-a { width: 360px; height: 360px; background: var(--wk-blue-200); inset-block-start: -90px; inset-inline-start: -60px; animation: wkDriftA 14s ease-in-out infinite; }
        .wk-blob-b { width: 300px; height: 300px; background: var(--wk-blue-50); inset-block-end: -80px; inset-inline-end: -50px; animation: wkDriftB 17s ease-in-out infinite; }
        @keyframes wkDriftA { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px,30px); } }
        @keyframes wkDriftB { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-36px,-26px); } }

        /* faint token-grid texture */
        .wk-grid {
          position: absolute; inset: 0; z-index: 0; opacity: .5;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 46px 46px;
          -webkit-mask-image: radial-gradient(80% 60% at 50% 40%, #000 0%, transparent 75%);
          mask-image: radial-gradient(80% 60% at 50% 40%, #000 0%, transparent 75%);
        }

        @media (prefers-reduced-motion: reduce) {
          .wk-rise, .wk-float, .wk-digit, .wk-zero-ring::after, .wk-zero-glass, .wk-zero-spark, .wk-blob-a, .wk-blob-b {
            animation: none !important;
          }
          .wk-rise { opacity: 1; transform: none; }
        }
      `}</style>
    </main>
  );
}
