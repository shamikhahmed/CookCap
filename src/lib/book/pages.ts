import { CHAPTERS } from '@/lib/recipes/chapters';
import { RECIPES, recipesByChapter as staticByChapter } from '@/lib/recipes/data';
import { enrichRecipe } from '@/lib/recipes/enrich';
import type { ChapterId, Recipe } from '@/lib/recipes/types';

/**
 * Book leaf sequence. `buildLeaves` accepts an optional extra recipe list
 * (WhatsApp imports) so the physical book grows without a rebuild.
 */

export type Leaf =
  | { kind: 'cover' }
  | { kind: 'title' }
  | { kind: 'friends' }
  | { kind: 'contents' }
  | { kind: 'foryou' }
  | { kind: 'chapter'; chapter: ChapterId }
  | { kind: 'recipe'; recipeId: string; chapter: ChapterId };

export function buildLeaves(extra: Recipe[] = [], includeForYou = false): {
  leaves: Leaf[];
  chapterStart: Record<string, number>;
  allRecipes: Recipe[];
  recipeMap: Record<string, Recipe>;
} {
  const bundledIds = new Set(RECIPES.map((r) => r.id));
  const customs = extra.filter((r) => !bundledIds.has(r.id));
  const allRecipes = [...RECIPES, ...customs].map(enrichRecipe);
  const recipeMap = Object.fromEntries(allRecipes.map((r) => [r.id, r])) as Record<string, Recipe>;

  const byChapter = (id: string) => allRecipes.filter((r) => r.chapter === id);

  const leaves: Leaf[] = [
    { kind: 'cover' },
    { kind: 'title' },
    { kind: 'friends' },
    { kind: 'contents' },
  ];
  if (includeForYou) leaves.push({ kind: 'foryou' });
  const chapterStart: Record<string, number> = {};

  for (const chapter of CHAPTERS) {
    chapterStart[chapter.id] = leaves.length;
    leaves.push({ kind: 'chapter', chapter: chapter.id });
    for (const r of byChapter(chapter.id)) {
      leaves.push({ kind: 'recipe', recipeId: r.id, chapter: chapter.id });
    }
  }

  return { leaves, chapterStart, allRecipes, recipeMap };
}

const bundled = buildLeaves();
export const LEAVES: Leaf[] = bundled.leaves;
export const CHAPTER_START: Record<string, number> = bundled.chapterStart;

export function leafOfRecipe(recipeId: string, leaves: Leaf[] = LEAVES): number {
  return leaves.findIndex((l) => l.kind === 'recipe' && l.recipeId === recipeId);
}

/** @deprecated prefer catalog — kept for static call sites during transition */
export const recipesByChapter = staticByChapter;
