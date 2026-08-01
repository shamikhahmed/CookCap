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

export const metadata: Metadata = {
  title: 'Jia Cooks — A Family Cookbook',
  description:
    'Jia’s living family cookbook — an interactive storybook of recipes, memories, and kitchen friends that opens like a real hardcover you can keep forever.',
  applicationName: 'Jia Cooks',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Jia Cooks' },
  formatDetection: { telephone: false },
  metadataBase: new URL('https://jia-cooks.local'),
  openGraph: {
    title: 'Jia Cooks — A Family Cookbook',
    description:
      'An interactive heirloom cookbook PWA — flip pages, cook offline, keep family recipes forever.',
    type: 'website',
    siteName: 'Jia Cooks',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jia Cooks',
    description: 'A private heirloom cookbook that opens like a real hardcover.',
  },
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
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

const themeInit = `(function(){try{var t=localStorage.getItem('jia-theme')||localStorage.getItem('grimoire-theme');if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

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
