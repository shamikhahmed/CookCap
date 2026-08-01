import type { Recipe } from '@/lib/recipes/types';

/**
 * Kitchen ideas for “what should we cook?” — time-of-day + mood picks.
 * Never surfaces pork / alcohol-forward cards (family kitchen is quietly halal).
 */

const BLOCK = /(pork|bacon|ham|prosciutto|wine|beer|gelatin|lard|chorizo)/i;

function ok(r: Recipe) {
  if (r.chapter === 'tips') return false;
  const hay = `${r.id} ${r.title} ${r.tagline} ${(r.tags || []).join(' ')}`;
  return !BLOCK.test(hay);
}

function hourBucket(h: number): 'breakfast' | 'lunch' | 'dinner' | 'late' {
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'late';
}

const PREFER: Record<string, string[]> = {
  breakfast: ['coffee', 'breads', 'baking'],
  lunch: ['meals', 'pakistani', 'chinese', 'italian', 'snacks'],
  dinner: ['pakistani', 'italian', 'chinese', 'meals'],
  late: ['coffee', 'desserts', 'snacks'],
};

/** Stable daily shuffle from date + seed string. */
function dayShuffle<T>(items: T[], seed: string): T[] {
  const out = items.slice();
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export interface CookIdea {
  eyebrow: string;
  recipe: Recipe;
  why: string;
}

export function ideasForToday(pool: Recipe[], now = new Date()): CookIdea[] {
  const clean = pool.filter(ok);
  const bucket = hourBucket(now.getHours());
  const prefer: string[] =
    PREFER[bucket] ?? ['pakistani', 'italian', 'chinese', 'meals'];
  const day = now.toISOString().slice(0, 10);

  const preferred = dayShuffle(
    clean.filter((r) => prefer.includes(r.chapter)),
    day + ':pref',
  );
  const rest = dayShuffle(
    clean.filter((r) => !prefer.includes(r.chapter)),
    day + ':rest',
  );
  const ordered = [...preferred, ...rest];

  const whyFor = (r: Recipe): string => {
    if (bucket === 'breakfast' && (r.chapter === 'coffee' || r.chapter === 'breads'))
      return 'Gentle start — kettle on, kitchen wakes.';
    if (bucket === 'lunch') return 'Midday plate that won’t put you to sleep.';
    if (bucket === 'dinner' && r.chapter === 'pakistani')
      return 'Evening table — rice, roti, something that smells like home.';
    if (bucket === 'late') return 'Late craving — small, kind, still worth opening the book.';
    if (r.difficulty === 'easy') return 'Low fuss — weeknight friendly.';
    if ((r.tags || []).includes('festive')) return 'When you want the house to feel special.';
    return 'A page worth turning tonight.';
  };

  const eyebrows = ['Cook this', 'Or this', 'Or save for Sunday'];
  return ordered.slice(0, 3).map((recipe, i) => ({
    eyebrow: eyebrows[i] ?? 'Also good',
    recipe,
    why: whyFor(recipe),
  }));
}
