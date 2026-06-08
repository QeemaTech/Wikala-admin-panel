import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#226199',
          700: '#1a4a76',
        },
        'wk-blue': {
          DEFAULT: 'var(--wk-blue)',
          50: 'var(--wk-blue-50)',
          200: 'var(--wk-blue-200)',
          400: 'var(--wk-blue-400)',
          700: 'var(--wk-blue-700)',
          800: 'var(--wk-blue-800)',
          900: 'var(--wk-blue-900)',
        },
        side: {
          bg: 'var(--side-bg)',
          'bg-2': 'var(--side-bg-2)',
          text: 'var(--side-text)',
          'text-mut': 'var(--side-text-mut)',
          active: 'var(--side-active)',
          border: 'var(--side-border)',
        },
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        ink: {
          DEFAULT: 'var(--text)',
          2: 'var(--text-2)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          2: 'var(--muted-2)',
        },
        green: { DEFAULT: 'var(--green)', 50: 'var(--green-50)' },
        amber: { DEFAULT: 'var(--amber)', 50: 'var(--amber-50)' },
        red: { DEFAULT: 'var(--red)', 50: 'var(--red-50)' },
        violet: { DEFAULT: 'var(--violet)', 50: 'var(--violet-50)' },
        teal: { DEFAULT: 'var(--teal)', 50: 'var(--teal-50)' },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
        'nav-active': '0 6px 18px rgba(34, 97, 153, 0.45)',
        logo: '0 4px 14px rgba(34, 97, 153, 0.35)',
      },
      backgroundImage: {
        avatar: 'linear-gradient(135deg, #3a7ab8, #226199)',
      },
      animation: {
        'scale-in':   'scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'overlay-in': 'overlay-in 0.15s ease both',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'var(--font-cairo)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
