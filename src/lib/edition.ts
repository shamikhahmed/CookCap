/**
 * Friend editions via `?for=ali` (or localStorage). Private heirloom flavours.
 */

export interface Edition {
  slug: string;
  ownerName: string;
  bookTitle: string;
  tagline: string;
  coverEyebrow: string;
  splashQuote: string;
}

const EDITIONS: Record<string, Edition> = {
  jia: {
    slug: 'jia',
    ownerName: 'Jia',
    bookTitle: 'Jia Cooks',
    tagline: 'Made & Kept with Love',
    coverEyebrow: 'A Family Cookbook',
    splashQuote: 'Sit. Have chai first. The cooking can wait.',
  },
  ali: {
    slug: 'ali',
    ownerName: 'Ali',
    bookTitle: 'Ali Cooks',
    tagline: 'For the kitchen adventures',
    coverEyebrow: 'A Shared Cookbook',
    splashQuote: 'If Jia taught it, we keep it. If we burn it, we laugh.',
  },
  shamikh: {
    slug: 'shamikh',
    ownerName: 'Shamikh',
    bookTitle: 'Shamikh Cooks',
    tagline: 'Notes from the counter',
    coverEyebrow: 'A Family Cookbook',
    splashQuote: 'Build the book. Feed the people.',
  },
};

const STORAGE_KEY = 'jia-edition';

export function resolveEdition(search?: string): Edition {
  let slug = 'jia';
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(search ?? window.location.search);
      const q = params.get('for')?.toLowerCase().trim();
      if (q && EDITIONS[q]) {
        slug = q;
        localStorage.setItem(STORAGE_KEY, q);
      } else {
        slug = localStorage.getItem(STORAGE_KEY) || 'jia';
      }
    }
  } catch {
    /* SSR / private mode */
  }
  return EDITIONS[slug] ?? EDITIONS.jia!;
}

export function listEditions(): Edition[] {
  return Object.values(EDITIONS);
}
