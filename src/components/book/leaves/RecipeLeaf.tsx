'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CHAPTER_MAP } from '@/lib/recipes/chapters';
import { RecipeImage } from '@/components/ui/RecipeImage';
import { CharacterArt } from '@/components/art/CharacterArt';
import { formatQty, scaleIngredient } from '@/lib/recipes/scale';
import { relatedFor } from '@/lib/recipes/related';
import { goesWithFor, serveWithFor } from '@/lib/recipes/serve-with';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { CookingMode } from '@/components/book/CookingMode';
import { FitBadge } from '@/components/profiles/FitBadge';
import { LogMealDialog } from '@/components/profiles/LogMealDialog';
import { Icon } from '@/components/ui/Icon';
import { formatCost, estCostPkr } from '@/lib/cost/ingredient-cost';
import { applyHealthier } from '@/lib/profiles/nutrition';
import { storyByline } from '@/lib/edition';
import { RECIPES } from '@/lib/recipes/data';
import * as store from '@/lib/db/store';
import { suggestSwaps } from '@/lib/assistant/substitutes';
import type { Recipe } from '@/lib/recipes/types';

const DIFF_LABEL: Record<Recipe['difficulty'], string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Advanced',
};

const URDU_HINT = /\b(mein|ker|dein|lein|aur|per|karein|dal|phir|tak|ubal|pheela|laga|tarhan|ache|kliya)\b/i;

function looksRomanUrdu(text: string): boolean {
  return (text.match(new RegExp(URDU_HINT.source, 'gi')) || []).length >= 2;
}
export function RecipeLeaf({
  recipeId,
  passive = false,
  prefetch = false,
}: {
  recipeId: string;
  passive?: boolean;
  prefetch?: boolean;
}) {
  const { recipeMap } = useApp();
  const recipe = recipeMap[recipeId];
  if (!recipe) return null;
  if (passive) return <WarmRecipeShell recipe={recipe} />;
  return <RecipeContent recipe={recipe} prefetch={prefetch} />;
}

/** Neighbor warm only — hero decode + title, no method DOM. */
function WarmRecipeShell({ recipe }: { recipe: Recipe }) {
  const chapter = CHAPTER_MAP[recipe.chapter] ?? CHAPTER_MAP.pakistani!;
  const { heroUrls } = useApp();
  return (
    <article data-leaf-scroll className="paper-grain min-h-full h-full w-full overflow-hidden" aria-hidden>
      <div className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[16/10]">
        <RecipeImage
          recipeId={recipe.id}
          seed={recipe.heroSeed}
          tab={chapter.tab}
          alt=""
          priority={false}
          sizes="(max-width: 640px) 100vw, 560px"
          userSrc={heroUrls[recipe.id]}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h2 className="font-serif text-xl font-bold text-white">{recipe.title}</h2>
        </div>
      </div>
    </article>
  );
}

function RecipeContent({ recipe, prefetch = false }: { recipe: Recipe; prefetch?: boolean }) {
  const chapter = CHAPTER_MAP[recipe.chapter] ?? CHAPTER_MAP.pakistani!;
  const {
    isFavorite,
    toggleFavorite,
    markViewed,
    allRecipes,
    refreshShoppingCount,
    edition,
    mode,
    healthierOn,
    setHealthierOn,
    cookingForIds,
    profiles,
    activeProfile,
    currency,
    reportStorageError,
    customs,
    addCustom,
    updateCustom,
    removeCustom,
    heroUrls,
    setRecipeHero,
    clearRecipeHero,
  } = useApp();
  const { goToRecipe } = useBook();
  const fav = isFavorite(recipe.id);
  const isTip = recipe.chapter === 'tips';
  const heroFileRef = useRef<HTMLInputElement>(null);
  const customOverride = customs.find((c) => c.id === recipe.id);
  const isBundled = RECIPES.some((r) => r.id === recipe.id);
  const isFork = Boolean(customOverride && isBundled);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(recipe.title);
  const [editTagline, setEditTagline] = useState(recipe.tagline);
  const [editStory, setEditStory] = useState(recipe.story ?? '');

  const [servings, setServings] = useState(recipe.servings);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [done, setDone] = useState<Set<number>>(new Set());
  const [cooking, setCooking] = useState(false);
  const [shopFlash, setShopFlash] = useState(false);
  const [shareFlash, setShareFlash] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  /** Prefetch neighbors paint full body off-screen; active leaf defers body one frame. */
  const [bodyReady, setBodyReady] = useState(prefetch);
  const factor = servings / recipe.servings;
  const related = relatedFor(recipe, 4, allRecipes);
  const serveWith = serveWithFor(recipe, allRecipes, 3);
  const goesWith = goesWithFor(recipe, allRecipes, 6);
  const swapHints = suggestSwaps(
    recipe.ingredients.flatMap((g) => g.items.map((i) => i.item)),
    4,
  );
  const noteTimer = useRef<number | null>(null);

  const healthierMacros =
    healthierOn && mode !== 'reader'
      ? applyHealthier(recipe.nutrition)
      : null;
  const displayNutrition = healthierMacros
    ? {
        ...recipe.nutrition,
        calories: healthierMacros.calories,
        protein: healthierMacros.protein,
        carbs: healthierMacros.carbs,
        fat: healthierMacros.fat,
      }
    : recipe.nutrition;
  const healthierPreview =
    mode !== 'reader' ? applyHealthier(recipe.nutrition) : null;

  /** Mother mode: cooking-for list, else active profile (so allergens still warn). */
  const motherTargetIds =
    mode === 'mother'
      ? cookingForIds.length > 0
        ? cookingForIds
        : activeProfile
          ? [activeProfile.id]
          : []
      : [];
  const motherAllergenHits = motherTargetIds.flatMap((id) => {
    const p = profiles.find((x) => x.id === id);
    if (!p?.avoid?.length || !recipe.allergens?.length) return [];
    const hits = recipe.allergens.filter((a) =>
      p.avoid.some((av) => av.toLowerCase() === a.toLowerCase()),
    );
    return hits.length ? [{ name: p.name, allergens: hits }] : [];
  });

  const recipeCost =
    mode === 'budget' ? formatCost(estCostPkr(recipe), currency) : null;

  useEffect(() => {
    if (prefetch) {
      setBodyReady(true);
      return;
    }
    setBodyReady(false);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setBodyReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [recipe.id, prefetch]);

  useEffect(() => {
    if (prefetch) return;
    markViewed(recipe.id);
    store.getRating(recipe.id).then(setRating).catch(() => void 0);
    store.getNote(recipe.id).then(setNote).catch(() => void 0);
    setServings(recipe.servings);
    setDone(new Set());
  }, [recipe.id, recipe.servings, markViewed, prefetch]);

  useEffect(() => {
    return () => {
      if (noteTimer.current) window.clearTimeout(noteTimer.current);
    };
  }, []);

  const toggleStep = (i: number) =>
    setDone((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(i)) nextSet.delete(i);
      else nextSet.add(i);
      return nextSet;
    });

  const rate = (n: number) => {
    setRating(n);
    store.setRating(recipe.id, n).catch(() => {
      reportStorageError('Could not save rating on this device.');
    });
  };
  const editNote = (t: string) => {
    setNote(t);
    if (noteTimer.current) window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => {
      store.saveNote(recipe.id, t).catch(() => {
        reportStorageError('Could not save note on this device.');
      });
    }, 400);
  };

  return (
    <article
      data-leaf-scroll
      data-print-root
      className="paper-grain min-h-full h-full w-full overflow-y-auto overscroll-contain"
    >
      {/* ── Hero ─────────────────────────────────────────────*/}
      <div className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[16/10]">
        <RecipeImage
          recipeId={recipe.id}
          seed={recipe.heroSeed}
          tab={chapter.tab}
          alt={`${recipe.title} — ${recipe.tagline}`}
          priority
          sizes="(max-width: 640px) 100vw, 560px"
          userSrc={heroUrls[recipe.id]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 pr-14 sm:p-5 sm:pr-16">
          <span
            className="text-xs font-medium uppercase tracking-[0.3em] text-white/80 sm:tracking-[0.35em]"
          >
            From our family kitchen
          </span>
          <p
            className="mt-1 text-xs font-medium uppercase tracking-[0.3em] sm:tracking-[0.35em]"
            style={{ color: chapter.tab }}
          >
            {recipe.cuisine}
          </p>
          <h2 className="font-serif text-[clamp(1.45rem,5.5vw,2.4rem)] font-bold leading-tight text-white text-balance">
            {recipe.title}
          </h2>
        </div>
        <button
          onClick={() => toggleFavorite(recipe.id)}
          aria-pressed={fav}
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          className={`micro-press absolute right-3 top-3 grid size-11 origin-center place-items-center rounded-full bg-black/30 text-white backdrop-blur-md sm:right-4 sm:top-4${fav ? ' micro-heart-on shadow-[0_0_12px_rgba(255,122,107,0.55)] ring-2 ring-[#ff7a6b]/50' : ''}`}
          style={{
            color: fav ? '#ff7a6b' : 'white',
          }}
        >
          <Icon name={fav ? 'heart-filled' : 'heart'} size={22} />
        </button>
      </div>

      <div className="mx-auto max-w-[65ch] px-4 py-5 sm:px-[7%] sm:py-6">
        <p className="font-serif text-lg italic leading-relaxed text-[color:var(--color-ink-soft)] text-balance">
          {recipe.tagline}
        </p>
        {!bodyReady ? (
          <p className="mt-6 text-base text-[color:var(--color-ink-faint)]">Opening recipe…</p>
        ) : (
        <>
        <div className="mt-3">
          <FitBadge recipe={recipe} />
        </div>

        {/* ── Quick facts (refined editorial hierarchy) ─────*/}
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Meta icon="clock" label="Prep" value={`${recipe.prepMin}m`} />
          <Meta icon="flame" label="Cook" value={`${recipe.cookMin}m`} />
          <Meta icon="gauge" label="Level" value={DIFF_LABEL[recipe.difficulty]} />
          {!isTip && (
            <Meta
              icon="flame-cal"
              label="Cal"
              value={`${displayNutrition.calories}`}
            />
          )}
        </dl>
        {recipeCost && (
          <p className="mt-2 text-xs text-[color:var(--color-ink-faint)]">
            Ingredients {recipeCost}{' '}
            <span className="opacity-80">(grocery estimate — not a receipt)</span>
          </p>
        )}
        {!isTip && (
          <p className="mt-1 text-xs text-[color:var(--color-ink-faint)]">
            {recipe.macrosVerified
              ? 'Macros hand-checked for this edition.'
              : 'Macros are kitchen estimates — not lab values.'}
          </p>
        )}
        {!isTip && (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  ['Protein', `${displayNutrition.protein}g`],
                  ['Carbs', `${displayNutrition.carbs}g`],
                  ['Fat', `${displayNutrition.fat}g`],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper-sunk)]/60 px-2 py-2 text-center"
                >
                  <div className="font-serif text-base font-semibold tabular-nums text-[color:var(--color-ink)]">
                    {v}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    {k}
                  </div>
                </div>
              ))}
            </div>
            {!recipe.macrosVerified && (
              <p className="mt-1.5 text-xs text-[color:var(--color-ink-faint)]">
                Estimated macros
              </p>
            )}
          </>
        )}

        {/* ── Kitchen note ───────────────────────────────────*/}
        {recipe.story && (
          <div className="mt-5 flex gap-3 rounded-xl bg-[color:var(--color-paper-sunk)] p-4">
            <CharacterArt id="chef-whisk" color="#c7913f" size={44} className="mt-0.5 shrink-0" />
            <div>
              <p className="mb-1 font-serif text-sm font-semibold text-[color:var(--color-ink)]">
                {storyByline(edition)}
              </p>
              <p className="jia-story font-serif text-base italic leading-relaxed text-[color:var(--color-ink-soft)] text-balance">
                {recipe.story}
              </p>
            </div>
          </div>
        )}

        {/* ── Taste & texture ────────────────────────────────*/}
        {(recipe.tasteLike || recipe.texture) && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {recipe.tasteLike && <Sensory label="How it tastes">{recipe.tasteLike}</Sensory>}
            {recipe.texture && <Sensory label="Texture">{recipe.texture}</Sensory>}
          </div>
        )}

        {/* ── Spice + allergens ──────────────────────────────*/}
        {(recipe.spiceLevel != null || recipe.allergens) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            {recipe.spiceLevel != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                  Spice
                </span>
                <span className="flex gap-0.5" aria-label={`Spice level ${recipe.spiceLevel} of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Icon
                      key={n}
                      name="chili"
                      size={15}
                      style={{
                        color:
                          n <= recipe.spiceLevel!
                            ? 'var(--color-danger)'
                            : 'var(--color-line)',
                      }}
                    />
                  ))}
                </span>
              </div>
            )}
            {recipe.allergens && recipe.allergens.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                  Contains
                </span>
                {recipe.allergens.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border px-2.5 py-1 text-xs font-semibold capitalize text-[color:var(--color-danger)]"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--color-danger) 45%, transparent)',
                      background: 'color-mix(in srgb, var(--color-danger) 10%, var(--color-paper))',
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {motherAllergenHits.length > 0 && (
          <div
            className="mt-3 rounded-md border-l-4 p-3 text-base text-[color:var(--color-ink-soft)]"
            style={{
              background:
                'color-mix(in srgb, var(--color-danger) 10%, var(--color-paper))',
              borderColor: 'var(--color-danger)',
            }}
            role="alert"
          >
            <div className="mb-1 font-semibold text-[color:var(--color-ink)]">
              Allergen watch
            </div>
            <ul className="space-y-0.5">
              {motherAllergenHits.map((hit) => (
                <li key={hit.name}>
                  {hit.name} avoids {hit.allergens.join(', ')} — this recipe
                  contains them.
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode !== 'reader' && !isTip && healthierPreview && (
          <div className="mt-4 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-sunk)]/50 px-3 py-3">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-sm font-medium text-[color:var(--color-ink)]">
                Make it healthier
              </span>
              <span className="flex min-h-11 min-w-11 items-center justify-center">
                <input
                  type="checkbox"
                  checked={healthierOn}
                  onChange={(e) => setHealthierOn(e.target.checked)}
                  className="size-4 accent-[color:var(--color-accent)]"
                />
              </span>
            </label>
            {healthierOn && (
              <p className="mt-2 text-xs tabular-nums text-[color:var(--color-ink-soft)]">
                {recipe.nutrition.calories} → {healthierPreview.calories} kcal ·{' '}
                {recipe.nutrition.protein}g → {healthierPreview.protein}g protein
                <span className="mt-1 block text-xs font-medium text-[color:var(--color-ink)]">
                  Swap estimate only — not medical advice.
                </span>
              </p>
            )}
          </div>
        )}

        {mode !== 'reader' && !isTip && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              className="min-h-11 rounded-full bg-[color:var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-95"
            >
              Log this
            </button>
            <LogMealDialog
              open={logOpen}
              onClose={() => setLogOpen(false)}
              recipeId={recipe.id}
            />
          </div>
        )}

        {/* ── Rating ─────────────────────────────────────────*/}
        <div className="mt-5 flex items-center gap-1" role="group" aria-label="Rate this recipe">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => rate(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className="micro-press grid min-h-11 min-w-11 place-items-center text-[color:var(--color-gold)]"
            >
              <Icon name={n <= rating ? 'star-filled' : 'star'} size={22} />
            </button>
          ))}
          <span className="ml-2 text-xs text-[color:var(--color-ink-faint)]">
            {rating ? `Your rating: ${rating}/5` : 'How did it taste? Rate it'}
          </span>
        </div>

        {/* ── Ingredients + servings scaler ─────────────────*/}
        <Section title="Ingredients" accent={chapter.tab}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Icon name="users" size={18} />
            <div className="flex items-center rounded-full border border-[color:var(--color-line)]">
              <Stepper label="Fewer servings" onClick={() => setServings((s) => Math.max(1, s - 1))}>
                −
              </Stepper>
              <span className="min-w-10 text-center text-sm font-medium tabular-nums">
                {servings}
              </span>
              <Stepper label="More servings" onClick={() => setServings((s) => Math.min(40, s + 1))}>
                +
              </Stepper>
            </div>
            <span className="text-xs text-[color:var(--color-ink-faint)]">servings</span>
            <div className="flex flex-wrap gap-1">
              {[8, 12, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setServings(n)}
                  className={`min-h-11 min-w-11 rounded-full border px-2 text-xs tabular-nums ${
                    servings === n
                      ? 'border-[color:var(--color-accent)] text-[color:var(--color-accent)]'
                      : 'border-[color:var(--color-line)] text-[color:var(--color-ink-faint)]'
                  }`}
                  title="Party scale"
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-11 rounded-full border border-[color:var(--color-line)] px-3 py-1 text-xs font-medium text-[color:var(--color-ink-soft)] print:hidden"
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => {
                const items = recipe.ingredients.flatMap((g) =>
                  g.items.map((ing) => {
                    const scaled = scaleIngredient(ing, factor);
                    return {
                      item: ing.item,
                      qty: `${formatQty(scaled)} ${ing.unit}`.trim(),
                    };
                  }),
                );
                store
                  .addIngredientsToShopping(recipe.id, items)
                  .then(() => {
                    refreshShoppingCount();
                    setShopFlash(true);
                    window.setTimeout(() => setShopFlash(false), 1600);
                  })
                  .catch(() => {
                    reportStorageError('Could not save to shopping list on this device.');
                  });
              }}
              className="ml-auto min-h-11 rounded-full border border-[color:var(--color-line)] px-3 py-1 text-xs font-medium text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-accent)] print:hidden"
            >
              {shopFlash ? 'Added ✓' : 'Add to list'}
            </button>
          </div>

          {recipe.ingredients.map((group, gi) => (
            <div key={gi} className="mb-3">
              {group.heading && (
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-ink-faint)]">
                  {group.heading}
                </h4>
              )}
              <ul className="space-y-1.5">
                {group.items.map((ing, ii) => {
                  const scaled = scaleIngredient(ing, factor);
                  return (
                    <li key={ii} className="flex gap-3 text-[color:var(--color-ink)]">
                      <span className="min-w-[4.5rem] shrink-0 text-right font-medium tabular-nums text-[color:var(--color-accent)]">
                        {formatQty(scaled)} {ing.unit}
                      </span>
                      <span>
                        {ing.item}
                        {ing.note && (
                          <span className="text-[color:var(--color-ink-faint)]"> — {ing.note}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Section>

        {/* ── Method (with progress checklist) ───────────────*/}
        <Section title="Method" accent={chapter.tab}>
          <div className="mb-3 -mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[color:var(--color-ink-faint)]">
              Tap a step as you go — {done.size}/{recipe.steps.length} done.
            </p>
            <button
              onClick={() => setCooking(true)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[color:var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95"
            >
              <Icon name="flame" size={14} />
              Start cooking
            </button>
          </div>
          <CookingMode recipe={recipe} open={cooking} onClose={() => setCooking(false)} />
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => {
              const isDone = done.has(i);
              return (
                <li key={i} className="flex gap-4">
                  <button
                    onClick={() => toggleStep(i)}
                    aria-pressed={isDone}
                    aria-label={`Mark step ${i + 1} ${isDone ? 'not done' : 'done'}`}
                    className="grid size-11 shrink-0 place-items-center rounded-full font-serif text-sm font-bold text-white transition-transform duration-200 active:scale-90"
                    style={{
                      background: isDone ? 'var(--color-success)' : chapter.tab,
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {isDone ? '✓' : i + 1}
                  </button>
                  <div className={isDone ? 'opacity-50' : ''}>
                    <p
                      className={`text-base leading-relaxed text-[color:var(--color-ink)] ${isDone ? 'line-through decoration-[color:var(--color-ink-faint)]' : ''}`}
                    >
                      {step.instruction}
                    </p>
                    {step.durationSec != null && <Timer seconds={step.durationSec} />}
                    {step.tip &&
                      (looksRomanUrdu(step.tip) ? (
                        <p className="mt-1.5 text-base leading-relaxed text-[color:var(--color-ink-soft)]">
                          <span className="mb-0.5 block text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
                            Roman Urdu
                          </span>
                          {step.tip}
                        </p>
                      ) : (
                        <p className="mt-1 text-base italic text-[color:var(--color-ink-faint)]">
                          {step.tip}
                        </p>
                      ))}
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>

        {/* ── Callouts ───────────────────────────────────────*/}
        {recipe.warnings?.map((w, i) => (
          <Callout key={`w${i}`} tone="danger" title="Take care">
            {w}
          </Callout>
        ))}
        {recipe.tips && (
          <Callout tone="success" title="Chef's tips">
            <ul className="list-disc space-y-1 pl-4">
              {recipe.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </Callout>
        )}
        {recipe.commonMistakes && (
          <Callout tone="danger" title="Common mistakes">
            <ul className="list-disc space-y-1 pl-4">
              {recipe.commonMistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Callout>
        )}
        {recipe.chefNotes && (
          <Callout tone="neutral" title="Notes from the kitchen">
            <ul className="space-y-1">
              {recipe.chefNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </Callout>
        )}

        {/* ── Nutrition ──────────────────────────────────────*/}
        {!isTip && (
          <Section title="Nutrition" accent={chapter.tab}>
            <p className="mb-2 text-xs text-[color:var(--color-ink-faint)]">
              Per serving, kitchen estimate — family cooking, not a lab label.
              {!recipe.macrosVerified && ' · Estimated macros.'}
              {healthierOn && mode !== 'reader' && ' · Healthier swaps applied.'}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(
                [
                  ['Cal', displayNutrition.calories],
                  ['Protein', `${displayNutrition.protein}g`],
                  ['Carbs', `${displayNutrition.carbs}g`],
                  ['Fat', `${displayNutrition.fat}g`],
                  ['Fiber', `${displayNutrition.fiber}g`],
                  ['Sugar', `${displayNutrition.sugar}g`],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-md bg-[color:var(--color-paper-sunk)] px-2 py-2 text-center"
                >
                  <div className="font-serif text-lg font-semibold text-[color:var(--color-ink)]">
                    {v}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    {k}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <p className="mt-6 text-center font-serif text-sm italic text-[color:var(--color-ink-faint)]">
          Your kitchen, your copy — photos and edits stay on this device.
        </p>

        {/* ── Personalize (P1) ────────────────────────────────*/}
        <Section title="Your kitchen copy" accent={chapter.tab}>
          <input
            ref={heroFileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void setRecipeHero(recipe.id, f);
              e.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-1.5 text-sm text-[color:var(--color-ink)]"
              onClick={() => heroFileRef.current?.click()}
            >
              {heroUrls[recipe.id] ? 'Change photo' : 'Add photo'}
            </button>
            {heroUrls[recipe.id] && (
              <button
                type="button"
                className="min-h-11 rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-sm text-[color:var(--color-ink-soft)]"
                onClick={() => void clearRecipeHero(recipe.id)}
              >
                Remove photo
              </button>
            )}
            {isBundled && !isFork && (
              <button
                type="button"
                className="min-h-11 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-1.5 text-sm text-[color:var(--color-ink)]"
                onClick={() => {
                  setEditTitle(recipe.title);
                  setEditTagline(recipe.tagline);
                  setEditStory(recipe.story ?? '');
                  setEditOpen(true);
                }}
              >
                Edit text
              </button>
            )}
            {isFork && (
              <>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-1.5 text-sm text-[color:var(--color-ink)]"
                  onClick={() => {
                    setEditTitle(recipe.title);
                    setEditTagline(recipe.tagline);
                    setEditStory(recipe.story ?? '');
                    setEditOpen(true);
                  }}
                >
                  Edit fork
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-[color:var(--color-accent)]/40 px-3 py-1.5 text-sm text-[color:var(--color-accent)]"
                  onClick={() => void removeCustom(recipe.id, { keepLinks: true })}
                >
                  Restore book recipe
                </button>
              </>
            )}
            {!isBundled && customOverride && (
              <button
                type="button"
                className="min-h-11 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-1.5 text-sm text-[color:var(--color-ink)]"
                onClick={() => {
                  setEditTitle(recipe.title);
                  setEditTagline(recipe.tagline);
                  setEditStory(recipe.story ?? '');
                  setEditOpen(true);
                }}
              >
                Edit import
              </button>
            )}
          </div>
          {isFork && (
            <p className="mt-2 text-xs text-[color:var(--color-ink-faint)]">
              Forked — your wording overrides the book copy on this device.
            </p>
          )}
          {editOpen && (
            <form
              className="mt-3 space-y-2 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] p-3"
              onSubmit={(e) => {
                e.preventDefault();
                const next: Recipe = {
                  ...recipe,
                  title: editTitle.trim() || recipe.title,
                  tagline: editTagline.trim() || recipe.tagline,
                  story: editStory.trim() || recipe.story,
                };
                void (customOverride ? updateCustom(next) : addCustom(next));
                setEditOpen(false);
              }}
            >
              <label className="block text-xs text-[color:var(--color-ink-faint)]">
                Title
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 text-[color:var(--color-ink)]"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </label>
              <label className="block text-xs text-[color:var(--color-ink-faint)]">
                Tagline
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 text-[color:var(--color-ink)]"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                />
              </label>
              <label className="block text-xs text-[color:var(--color-ink-faint)]">
                Story
                <textarea
                  className="mt-1 min-h-24 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-[color:var(--color-ink)]"
                  value={editStory}
                  onChange={(e) => setEditStory(e.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="min-h-11 rounded-full bg-[color:var(--color-accent)] px-4 text-sm text-white"
                >
                  Save on this device
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-[color:var(--color-line)] px-4 text-sm"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Section>

        {/* ── Reference grid ────────────────────────────────*/}
        {(recipe.substitutions ||
          recipe.equipment ||
          recipe.storage ||
          recipe.reheating ||
          swapHints.length > 0) && (
          <Section title="Good to know" accent={chapter.tab}>
            <div className="grid gap-4 sm:grid-cols-2">
              {recipe.equipment && (
                <Detail label="Equipment">{recipe.equipment.join(' · ')}</Detail>
              )}
              {recipe.substitutions && (
                <Detail label="Substitutions">
                  <ul className="space-y-0.5">
                    {recipe.substitutions.map((s, i) => (
                      <li key={i}>
                        {s.from} → <span className="text-[color:var(--color-ink)]">{s.to}</span>
                      </li>
                    ))}
                  </ul>
                </Detail>
              )}
              {!recipe.substitutions && swapHints.length > 0 && (
                <Detail label="Swap ideas">
                  <ul className="space-y-0.5">
                    {swapHints.map((s, i) => (
                      <li key={i}>
                        {s.from} → <span className="text-[color:var(--color-ink)]">{s.to}</span>
                      </li>
                    ))}
                  </ul>
                </Detail>
              )}
              {recipe.storage && <Detail label="Storage">{recipe.storage}</Detail>}
              {recipe.reheating && <Detail label="Reheating">{recipe.reheating}</Detail>}
            </div>
          </Section>
        )}

        {/* ── Personal note ─────────────────────────────────*/}
        <Section title="Your notes" accent={chapter.tab}>
          <textarea
            value={note}
            onChange={(e) => editNote(e.target.value)}
            placeholder="Scribble in the margin — tweaks, timings, who you cooked it for…"
            rows={6}
            className="note-hand w-full resize-y rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] p-4 text-lg leading-relaxed text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-faint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-accent)]"
          />
        </Section>

        {/* ── Share / print ─────────────────────────────────*/}
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-11 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm text-[color:var(--color-ink-soft)]"
          >
            Print
          </button>
          <button
            type="button"
            onClick={async () => {
              const params = new URLSearchParams();
              params.set('recipe', recipe.id);
              if (edition.named && edition.ownerName) params.set('for', edition.ownerName);
              const url = `${window.location.origin}${window.location.pathname}?${params}`;
              try {
                if (navigator.share) {
                  await navigator.share({ title: recipe.title, text: recipe.tagline, url });
                } else {
                  await navigator.clipboard.writeText(url);
                  setShareFlash(true);
                  window.setTimeout(() => setShareFlash(false), 1600);
                }
              } catch {
                await navigator.clipboard.writeText(url);
                setShareFlash(true);
                window.setTimeout(() => setShareFlash(false), 1600);
              }
            }}
            className="min-h-11 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm text-[color:var(--color-ink-soft)]"
          >
            {shareFlash ? 'Link copied ✓' : 'Share link'}
          </button>
        </div>

        {/* ── Serve with / Goes well with ─────────────────────*/}
        {serveWith.length > 0 && (
          <Section title="Serve with" accent={chapter.tab}>
            <p className="mb-2 text-xs text-[color:var(--color-ink-faint)]">
              Optional sides — open one, or add ingredients to shopping.
            </p>
            <ul className="space-y-2">
              {serveWith.map(({ recipe: side, note }) => (
                <li
                  key={side.id}
                  className="flex flex-col gap-2 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-2 sm:flex-row sm:items-center"
                >
                  <button
                    type="button"
                    onClick={() => goToRecipe(side.id)}
                    className="min-h-11 flex-1 text-left transition-colors"
                  >
                    <span className="block font-serif text-[color:var(--color-ink)]">{side.title}</span>
                    <span className="block text-xs text-[color:var(--color-ink-soft)]">{note}</span>
                  </button>
                  <button
                    type="button"
                    className="min-h-11 shrink-0 rounded-full border border-[color:var(--color-line)] px-3 text-xs font-medium text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-accent)]"
                    onClick={() => {
                      const items = side.ingredients.flatMap((g) =>
                        g.items.map((ing) => ({
                          item: ing.item,
                          qty: `${formatQty(ing.quantity)} ${ing.unit}`.trim(),
                        })),
                      );
                      store
                        .addIngredientsToShopping(side.id, items)
                        .then(() => {
                          refreshShoppingCount();
                          setShopFlash(true);
                          window.setTimeout(() => setShopFlash(false), 1600);
                        })
                        .catch(() => {
                          reportStorageError('Could not save to shopping list on this device.');
                        });
                    }}
                  >
                    {shopFlash ? 'Added ✓' : 'Add to list'}
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {goesWith.length > 0 && (
          <Section title="Goes well with" accent={chapter.tab}>
            <div className="flex flex-wrap gap-2">
              {goesWith.map(({ recipe: main }) => (
                <button
                  key={main.id}
                  type="button"
                  onClick={() => goToRecipe(main.id)}
                  className="min-h-11 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-1.5 text-sm text-[color:var(--color-ink)] transition-colors hover:border-[color:var(--color-accent)]"
                >
                  {main.title}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* ── Related ────────────────────────────────────────*/}
        {related.length > 0 && (
          <Section title="Cook next" accent={chapter.tab}>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => goToRecipe(r.id)}
                  className="min-h-11 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-1.5 text-sm text-[color:var(--color-ink)] transition-colors hover:border-[color:var(--color-accent)]"
                >
                  {r.title}
                </button>
              ))}
            </div>
          </Section>
        )}

        <div className="h-6" />
        </>
        )}
      </div>
    </article>
  );
}

/* ── Small building blocks ───────────────────────────────────────────────*/

function Meta({ icon, label, value }: { icon: 'clock' | 'flame' | 'gauge' | 'flame-cal'; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-[color:var(--color-paper-sunk)] px-3 py-2">
      <Icon name={icon} size={18} />
      <div className="leading-tight">
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
          {label}
        </div>
        <div className="text-sm font-semibold text-[color:var(--color-ink)]">{value}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="mt-7"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="h-4 w-1 rounded-full" style={{ background: accent }} />
        <h3 className="font-serif text-xl font-semibold text-[color:var(--color-ink)]">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

function Stepper({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid size-11 place-items-center text-lg text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-accent)]"
    >
      {children}
    </button>
  );
}

function Sensory({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-faint)]">
        {label}
      </div>
      <div className="font-serif text-base italic text-[color:var(--color-ink)]">{children}</div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-ink-faint)]">
        {label}
      </div>
      <div className="text-base text-[color:var(--color-ink-soft)]">{children}</div>
    </div>
  );
}

const TONE: Record<'danger' | 'success' | 'neutral', { bg: string; bar: string }> = {
  danger: { bg: 'color-mix(in srgb, var(--color-danger) 10%, var(--color-paper))', bar: 'var(--color-danger)' },
  success: { bg: 'color-mix(in srgb, var(--color-success) 10%, var(--color-paper))', bar: 'var(--color-success)' },
  neutral: { bg: 'var(--color-paper-sunk)', bar: 'var(--color-gold)' },
};

function Callout({
  tone,
  title,
  children,
}: {
  tone: 'danger' | 'success' | 'neutral';
  title: string;
  children: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div
      className="mt-5 rounded-md border-l-4 p-4 text-base text-[color:var(--color-ink-soft)]"
      style={{ background: t.bg, borderColor: t.bar }}
    >
      <div className="mb-1 font-semibold text-[color:var(--color-ink)]">{title}</div>
      {children}
    </div>
  );
}

/** Inline countdown timer chip. Client-only; no external deps. */
function Timer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      return;
    }
    const t = window.setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearInterval(t);
  }, [running, remaining]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const done = remaining <= 0;

  return (
    <button
      onClick={() => {
        if (done) {
          setRemaining(seconds);
          setRunning(false);
        } else setRunning((r) => !r);
      }}
      className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[color:var(--color-line)] px-2.5 py-1 text-xs font-medium tabular-nums text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-accent)]"
    >
      <Icon name="clock" size={14} />
      {done ? 'Done · reset' : `${mm}:${ss.toString().padStart(2, '0')}`}
      {!done && <span>{running ? '· pause' : '· start'}</span>}
    </button>
  );
}
