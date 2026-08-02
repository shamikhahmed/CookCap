/** Public base path for GitHub Pages project sites (e.g. `/CookCap`). Empty in local dev. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function withBase(path: string): string {
  if (!path.startsWith('/')) return `${BASE_PATH}/${path}`;
  return `${BASE_PATH}${path}` || path;
}
