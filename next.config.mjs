/**
 * Next.js configuration.
 *
 * - `reactStrictMode` surfaces side-effect bugs early.
 * - Security + PWA headers are set here so the service worker and manifest
 *   are served with the correct caching/scope semantics.
 * - Images use the default loader; all cookbook art is bundled locally as SVG
 *   so the app stays fully offline-capable with zero external requests.
 */
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the tracing root — the machine has a stray parent lockfile that Next
  // would otherwise infer as the workspace root.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  images: {
    qualities: [75, 82],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ];
  },
};

export default nextConfig;
