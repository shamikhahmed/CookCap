/**
 * CookCap editions — product name is CookCap; the physical book title is
 * "{Owner} Cooks" from a first-run name prompt (or `?for=Name`).
 * Unnamed / generic "Family" never becomes "Family Cooks".
 */

export const PRODUCT_NAME = 'CookCap';

export interface Edition {
  /** Normalized slug for storage / share links */
  slug: string;
  /** Empty when using the graceful unnamed fallback */
  ownerName: string;
  /** "{Name} Cooks" when named; empty when unnamed (header shows CookCap only) */
  bookTitle: string;
  /** Cover display lines — personal name / Cooks, or Our Family / Cookbook */
  coverLine1: string;
  coverLine2: string;
  tagline: string;
  coverEyebrow: string;
  splashQuote: string;
  /** True when a real personal name is set (not Family/Our fallback) */
  named: boolean;
}

const OWNER_KEY = 'cookcap-owner';
const LEGACY_EDITION_KEY = 'jia-edition';

const GENERIC = new Set(['family', 'our', 'our family']);

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
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'cook'
  );
}

function isGenericName(name: string): boolean {
  return !name || GENERIC.has(name.toLowerCase());
}

/** Unnamed graceful cover — never "Family Cooks". */
function unnamedEdition(): Edition {
  return {
    slug: 'family',
    ownerName: '',
    bookTitle: '',
    coverLine1: 'Our Family',
    coverLine2: 'Cookbook',
    tagline: 'Made & Kept with Love',
    coverEyebrow: 'A Family Cookbook',
    splashQuote: 'Sit. Have chai first. The cooking can wait.',
    named: false,
  };
}

export function buildEdition(ownerName: string): Edition {
  const name = sanitizeOwnerName(ownerName);
  if (isGenericName(name)) return unnamedEdition();

  const first = name.split(' ')[0] || name;
  return {
    slug: slugifyOwner(name),
    ownerName: name,
    bookTitle: `${first} Cooks`,
    coverLine1: first,
    coverLine2: 'Cooks',
    tagline: 'Made & Kept with Love',
    coverEyebrow: 'A Family Cookbook',
    splashQuote: 'Sit. Have chai first. The cooking can wait.',
    named: true,
  };
}

/** Tiny caps line under CookCap wordmark, e.g. "— AYESHA'S KITCHEN". */
export function kitchenLine(edition: Edition): string | null {
  if (!edition.named || !edition.ownerName) return null;
  const first = edition.ownerName.split(' ')[0] || edition.ownerName;
  return `— ${first.toUpperCase()}'S KITCHEN`;
}

/** Favorites chapter / tab label from edition. Never hard-code a person. */
export function favoritesLabel(edition: Edition): string {
  if (!edition.named || !edition.ownerName) return 'Favorites';
  const first = edition.ownerName.split(' ')[0] || edition.ownerName;
  return `${first}'s Favorites`;
}

/** Recipe story header. */
export function storyByline(edition: Edition): string {
  if (!edition.named || !edition.ownerName) return 'A note from our kitchen';
  const first = edition.ownerName.split(' ')[0] || edition.ownerName;
  return `A note from ${first}`;
}

export const ONBOARD_DONE_KEY = 'cookcap-onboarded';

export function markOnboardingDone() {
  try {
    localStorage.setItem(ONBOARD_DONE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function readStoredOwner(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const direct = localStorage.getItem(OWNER_KEY);
    if (direct) {
      const cleaned = sanitizeOwnerName(direct);
      if (cleaned && !isGenericName(cleaned)) return cleaned;
      // Migrate stale "Family" out of storage so gate can invite a real name.
      if (isGenericName(cleaned) || direct.trim().toLowerCase() === 'family') {
        localStorage.removeItem(OWNER_KEY);
        return null;
      }
    }

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
    if (edition.named) {
      localStorage.setItem(OWNER_KEY, edition.ownerName);
    } else {
      localStorage.removeItem(OWNER_KEY);
    }
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
      if (fromQuery && !isGenericName(fromQuery)) return writeStoredOwner(fromQuery);
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
  return unnamedEdition();
}
