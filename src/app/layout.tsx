import type { Metadata, Viewport } from 'next';
import { Caveat, Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { AppStore } from '@/components/app/AppStore';
import { ServiceWorker } from '@/components/app/ServiceWorker';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: 'CookCap — A Family Cookbook',
  description:
    'CookCap — an interactive heirloom cookbook PWA. Name your book, flip pages, cook offline, keep family recipes forever.',
  applicationName: 'CookCap',
  manifest: `${BASE}/manifest.webmanifest`,
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'CookCap' },
  formatDetection: { telephone: false },
  metadataBase: new URL('https://shamikhahmed.github.io/CookCap'),
  openGraph: {
    title: 'CookCap — A Family Cookbook',
    description:
      'An interactive heirloom cookbook PWA — flip pages, cook offline, keep family recipes forever.',
    type: 'website',
    siteName: 'CookCap',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CookCap',
    description: 'A private heirloom cookbook that opens like a real hardcover.',
  },
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: `${BASE}/icons/icon.svg`, type: 'image/svg+xml' },
      { url: `${BASE}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: `${BASE}/icons/icon-192.png`, sizes: '192x192' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ece1d1' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1512' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const themeInit = `(function(){try{var t=localStorage.getItem('cookcap-theme')||localStorage.getItem('jia-theme')||localStorage.getItem('grimoire-theme');if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <AppStore>{children}</AppStore>
        <ServiceWorker />
      </body>
    </html>
  );
}
