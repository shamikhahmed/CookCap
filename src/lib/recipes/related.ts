import { RECIPES } from '@/lib/recipes/data';
import type { Recipe } from '@/lib/recipes/types';

/** Stable shuffle from recipe id — same book always, not random each render. */
function seededOrder<T>(items: T[], seed: string): T[] {
  const out = items.slice();
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/**
 * Never leave "Cook next" empty. Prefer author `related` ids, then shuffled
 * same-chapter / same-cuisine neighbors, then the rest of the book.
 */
export function relatedFor(recipe: Recipe, limit = 4, pool: Recipe[] = RECIPES): Recipe[] {
  const map = new Map(pool.map((r) => [r.id, r]));
  const out: Recipe[] = [];
  const seen = new Set<string>([recipe.id]);

  const push = (id: string | undefined) => {
    if (!id || seen.has(id)) return;
    const r = map.get(id);
    if (!r) return;
    seen.add(id);
    out.push(r);
  };

  for (const id of recipe.related ?? []) {
    push(id);
    if (out.length >= limit) return out;
  }

  const chapterMates = seededOrder(
    pool.filter((r) => r.chapter === recipe.chapter && r.id !== recipe.id),
    recipe.id + ':ch',
  );
  for (const r of chapterMates) {
    push(r.id);
    if (out.length >= limit) return out;
  }

  const cuisineMates = seededOrder(
    pool.filter((r) => r.cuisine === recipe.cuisine && r.id !== recipe.id),
    recipe.id + ':cu',
  );
  for (const r of cuisineMates) {
    push(r.id);
    if (out.length >= limit) return out;
  }

  for (const r of seededOrder(pool, recipe.id + ':all')) {
    push(r.id);
    if (out.length >= limit) return out;
  }

  return out;
}
