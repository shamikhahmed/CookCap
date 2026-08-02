/**
 * CookCap editions — product name is CookCap; the physical book title is
 * "{Owner} Cooks" from a first-run name prompt (or `?for=Name`).
 */

export const PRODUCT_NAME = 'CookCap';

export interface Edition {
  /** Normalized slug for storage / share links */
  slug: string;
  ownerName: string;
  bookTitle: string;
  tagline: string;
  coverEyebrow: string;
  splashQuote: string;
}

const OWNER_KEY = 'cookcap-owner';
const LEGACY_EDITION_KEY = 'jia-edition';

/** Legacy fixed friend editions → seed owner name once. */
const LEGACY_SLUG_NAMES: Record<string, string> = {
  jia: 'Jia',
  ali: 'Ali',
  shamikh: 'Shamikh',
};

export function sanitizeOwnerName(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{M}\p{N} '\-.]/gu, '')
    .slice(0, 40);
  if (!cleaned) return '';
  return cleaned
    .split(' ')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function slugifyOwner(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'cook';
}

export function buildEdition(ownerName: string): Edition {
  const name = sanitizeOwnerName(ownerName) || 'Family';
  const first = name.split(' ')[0] || name;
  return {
    slug: slugifyOwner(name),
    ownerName: name,
    bookTitle: `${first} Cooks`,
    tagline: 'Made & Kept with Love',
    coverEyebrow: 'A Family Cookbook',
    splashQuote: 'Sit. Have chai first. The cooking can wait.',
  };
}

export function readStoredOwner(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const direct = localStorage.getItem(OWNER_KEY);
    if (direct && sanitizeOwnerName(direct)) return sanitizeOwnerName(direct);

    const legacy = localStorage.getItem(LEGACY_EDITION_KEY);
    if (legacy && LEGACY_SLUG_NAMES[legacy]) {
      const n = LEGACY_SLUG_NAMES[legacy]!;
      localStorage.setItem(OWNER_KEY, n);
      return n;
    }
  } catch {
    /* private mode */
  }
  return null;
}

export function writeStoredOwner(name: string): Edition {
  const edition = buildEdition(name);
  try {
    localStorage.setItem(OWNER_KEY, edition.ownerName);
    localStorage.removeItem(LEGACY_EDITION_KEY);
  } catch {
    /* ignore */
  }
  return edition;
}

/**
 * Resolve edition: `?for=` query wins (and persists), else stored owner.
 * Returns null when no name yet — UI must gate with name prompt.
 */
export function resolveEdition(search?: string): Edition | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(search ?? window.location.search);
    const q = params.get('for')?.trim();
    if (q) {
      const fromQuery = sanitizeOwnerName(q);
      if (fromQuery) return writeStoredOwner(fromQuery);
      const legacy = LEGACY_SLUG_NAMES[q.toLowerCase()];
      if (legacy) return writeStoredOwner(legacy);
    }
  } catch {
    /* ignore */
  }
  const stored = readStoredOwner();
  return stored ? buildEdition(stored) : null;
}

/** Placeholder until the user names the book (SSR + first paint). */
export function defaultEdition(): Edition {
  return buildEdition('Family');
}
