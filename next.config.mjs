/**
 * Next.js configuration — static export for GitHub Pages (same model as other Caps).
 *
 * Local: `npm run dev` (no basePath).
 * Pages: `NEXT_PUBLIC_BASE_PATH=/CookCap npm run build` → `out/`.
 */
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // Pin the tracing root — the machine has a stray parent lockfile that Next
  // would otherwise infer as the workspace root.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  images: {
    unoptimized: true,
    qualities: [75, 82],
  },
};

export default nextConfig;
