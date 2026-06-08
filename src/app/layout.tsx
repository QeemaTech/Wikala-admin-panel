import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cairo, plexArabic, plexMono } from '@/lib/fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'وكالة — لوحة التحكم الإدارية',
  description: 'لوحة التحكم الإدارية لمنصة وكالة للإعلانات المبوّبة',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${plexMono.variable} ${cairo.variable}`}
    >
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
