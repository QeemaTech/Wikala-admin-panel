import { Cairo, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google';

/** Primary UI typeface — Arabic-first. */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

/** Monospace — used for IDs, prices, counts and other tabular numerals. */
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-mono',
});

/** Fallback Arabic typeface. */
export const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-cairo',
});
