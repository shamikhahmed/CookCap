'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CHAPTER_MAP } from '@/lib/recipes/chapters';
import { RecipeImage } from '@/components/ui/RecipeImage';
import { CharacterArt } from '@/components/art/CharacterArt';
import { formatQty, scaleIngredient } from '@/lib/recipes/scale';
import { relatedFor } from '@/lib/recipes/related';
import { stepImageFor } from '@/lib/recipes/stepImages';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { CookingMode } from '@/components/book/CookingMode';
import { FitBadge } from '@/components/profiles/FitBadge';
import { LogMealDialog } from '@/components/profiles/LogMealDialog';
import { Icon } from '@/components/ui/Icon';
import { formatCost, estCostPkr } from '@/lib/cost/ingredient-cost';
import { applyHealthier } from '@/lib/profiles/nutrition';
import { storyByline } from '@/lib/edition';
import * as store from '@/lib/db/store';
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
export function RecipeLeaf({ recipeId, passive = false }: { recipeId: string; passive?: boolean }) {
  const { recipeMap } = useApp();
  const recipe = recipeMap[recipeId];
  if (!recipe) return null;
  return <RecipeContent recipe={recipe} passive={passive} />;
}

function RecipeContent({ recipe, passive = false }: { recipe: Recipe; passive?: boolean }) {
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
    currency,
  } = useApp();
  const { goToRecipe } = useBook();
  const fav = isFavorite(recipe.id);
  const isTip = recipe.chapter === 'tips';

  const [servings, setServings] = useState(recipe.servings);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [done, setDone] = useState<Set<number>>(new Set());
  const [cooking, setCooking] = useState(false);
  const [shopFlash, setShopFlash] = useState(false);
  const [shareFlash, setShareFlash] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const factor = servings / recipe.servings;
  const related = relatedFor(recipe, 4, allRecipes);
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

  const motherAllergenHits =
    mode === 'mother' && cookingForIds.length > 0
      ? cookingForIds.flatMap((id) => {
          const p = profiles.find((x) => x.id === id);
          if (!p?.avoid?.length || !recipe.allergens?.length) return [];
          const hits = recipe.allergens.filter((a) =>
            p.avoid.some((av) => av.toLowerCase() === a.toLowerCase()),
          );
          return hits.length
            ? [{ name: p.name, allergens: hits }]
            : [];
        })
      : [];

  const recipeCost =
    mode === 'budget' ? formatCost(estCostPkr(recipe), currency) : null;

  useEffect(() => {
    if (passive) return;
    markViewed(recipe.id);
    store.getRating(recipe.id).then(setRating).catch(() => void 0);
    store.getNote(recipe.id).then(setNote).catch(() => void 0);
    setServings(recipe.servings);
    setDone(new Set());
  }, [recipe.id, recipe.servings, markViewed, passive]);

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
    store.setRating(recipe.id, n).catch(() => void 0);
  };
  const editNote = (t: string) => {
    setNote(t);
    if (noteTimer.current) window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => {
      store.saveNote(recipe.id, t).catch(() => void 0);
    }, 400);
  };

  return (
    <article
      data-leaf-scroll
      data-print-root
      className="paper-grain h-full w-full overflow-y-auto overscroll-contain"
    >
      {/* ── Hero ─────────────────────────────────────────────*/}
      <div className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[16/10]">
        <RecipeImage
          recipeId={recipe.id}
          seed={recipe.heroSeed}
          tab={chapter.tab}
          alt={`${recipe.title} — ${recipe.tagline}`}
          priority={!passive}
          sizes="(max-width: 640px) 100vw, 560px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <span
            className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-white/80 sm:text-[0.7rem] sm:tracking-[0.35em]"
          >
            From our family kitchen
          </span>
          <p
            className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.3em] sm:text-[0.7rem] sm:tracking-[0.35em]"
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
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-transform active:scale-90 sm:right-4 sm:top-4 sm:size-11"
          style={{ color: fav ? '#ff7a6b' : 'white' }}
        >
          <Icon name={fav ? 'heart-filled' : 'heart'} size={22} />
        </button>
      </div>

      <div className="px-4 py-5 sm:px-[7%] sm:py-6">
        <p className="font-serif text-lg italic text-[color:var(--color-ink-soft)] text-balance">
          {recipe.tagline}
        </p>
        <div className="mt-3">
          <FitBadge recipe={recipe} />
        </div>

        {/* ── Kitchen note ───────────────────────────────────*/}
        {recipe.story && (
          <div className="mt-5 flex gap-3 rounded-xl bg-[color:var(--color-paper-sunk)] p-4">
            <CharacterArt id="chef-whisk" color="#c7913f" size={44} className="mt-0.5 shrink-0" />
            <div>
              <p className="mb-1 font-serif text-sm font-semibold text-[color:var(--color-ink)]">
                {storyByline(edition)}
              </p>
              <p className="jia-story font-serif text-[0.95rem] italic leading-relaxed text-[color:var(--color-ink-soft)] text-balance">
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
                    className="rounded-full bg-[color:var(--color-paper-sunk)] px-2 py-0.5 text-xs capitalize text-[color:var(--color-ink-soft)]"
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
            className="mt-3 rounded-md border-l-4 p-3 text-sm text-[color:var(--color-ink-soft)]"
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

        {/* ── Meta strip ─────────────────────────────────────*/}
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
          <p className="mt-1 text-[0.65rem] text-[color:var(--color-ink-faint)]">
            {recipe.macrosVerified
              ? 'Macros hand-checked for this edition.'
              : 'Macros are kitchen estimates — not lab values.'}
          </p>
        )}

        {/* Macros up front — family card glance */}
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
                  <div className="text-[0.65rem] uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    {k}
                  </div>
                </div>
              ))}
            </div>
            {!recipe.macrosVerified && (
              <p className="mt-1.5 text-[0.7rem] text-[color:var(--color-ink-faint)]">
                Estimated macros
              </p>
            )}
          </>
        )}

        {mode !== 'reader' && !isTip && healthierPreview && (
          <div className="mt-4 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-sunk)]/50 px-3 py-3">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-sm font-medium text-[color:var(--color-ink)]">
                Make it healthier
              </span>
              <input
                type="checkbox"
                checked={healthierOn}
                onChange={(e) => setHealthierOn(e.target.checked)}
                className="size-4 accent-[color:var(--color-accent)]"
              />
            </label>
            {healthierOn && (
              <p className="mt-2 text-xs tabular-nums text-[color:var(--color-ink-soft)]">
                {recipe.nutrition.calories} → {healthierPreview.calories} kcal ·{' '}
                {recipe.nutrition.protein}g → {healthierPreview.protein}g protein
                <span className="mt-1 block text-[0.65rem] text-[color:var(--color-ink-faint)]">
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
              className="rounded-full bg-[color:var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-95"
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
              className="text-[color:var(--color-gold)] transition-transform active:scale-90"
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
                  .catch(() => void 0);
              }}
              className="ml-auto rounded-full border border-[color:var(--color-line)] px-3 py-1 text-xs font-medium text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-accent)]"
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95"
            >
              <Icon name="flame" size={14} />
              Cook mode
            </button>
          </div>
          <CookingMode recipe={recipe} open={cooking} onClose={() => setCooking(false)} />
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => {
              const isDone = done.has(i);
              const stepImg = stepImageFor(recipe.id, i, recipe.steps.length, step.image);
              return (
                <li key={i} className="flex gap-4">
                  <button
                    onClick={() => toggleStep(i)}
                    aria-pressed={isDone}
                    aria-label={`Mark step ${i + 1} ${isDone ? 'not done' : 'done'}`}
                    className="grid size-7 shrink-0 place-items-center rounded-full font-serif text-sm font-bold text-white transition-transform active:scale-90"
                    style={{ background: isDone ? 'var(--color-success)' : chapter.tab }}
                  >
                    {isDone ? '✓' : i + 1}
                  </button>
                  <div className={isDone ? 'opacity-50' : ''}>
                    <p
                      className={`text-[color:var(--color-ink)] ${isDone ? 'line-through decoration-[color:var(--color-ink-faint)]' : ''}`}
                    >
                      {step.instruction}
                    </p>
                    {stepImg && (
                      <span className="relative mt-2 block aspect-[16/10] w-full overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={stepImg}
                          alt={`Step ${i + 1} — ${recipe.title}`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </span>
                    )}
                    {step.durationSec != null && <Timer seconds={step.durationSec} />}
                    {step.tip &&
                      (looksRomanUrdu(step.tip) ? (
                        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
                          <span className="mb-0.5 block text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
                            Roman Urdu
                          </span>
                          {step.tip}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm italic text-[color:var(--color-ink-faint)]">
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
                  <div className="text-[0.65rem] uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    {k}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <p className="mt-6 text-center font-serif text-sm italic text-[color:var(--color-ink-faint)]">
          Made for our table — swap in your own photos anytime.
        </p>
        {/* ── Reference grid ────────────────────────────────*/}
        {(recipe.substitutions || recipe.equipment || recipe.storage || recipe.reheating) && (
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
            className="rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm text-[color:var(--color-ink-soft)]"
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
            className="rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm text-[color:var(--color-ink-soft)]"
          >
            {shareFlash ? 'Link copied ✓' : 'Share link'}
          </button>
        </div>

        {/* ── Related ────────────────────────────────────────*/}
        {related.length > 0 && (
          <Section title="Cook next" accent={chapter.tab}>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => goToRecipe(r.id)}
                  className="rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-1.5 text-sm text-[color:var(--color-ink)] transition-colors hover:border-[color:var(--color-accent)]"
                >
                  {r.title}
                </button>
              ))}
            </div>
          </Section>
        )}

        <div className="h-6" />
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
        <div className="text-[0.65rem] uppercase tracking-wide text-[color:var(--color-ink-faint)]">
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
      className="grid size-9 place-items-center text-lg text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-accent)]"
    >
      {children}
    </button>
  );
}

function Sensory({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-2">
      <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-[color:var(--color-ink-faint)]">
        {label}
      </div>
      <div className="font-serif text-sm italic text-[color:var(--color-ink)]">{children}</div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-ink-faint)]">
        {label}
      </div>
      <div className="text-sm text-[color:var(--color-ink-soft)]">{children}</div>
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
      className="mt-5 rounded-md border-l-4 p-4 text-sm text-[color:var(--color-ink-soft)]"
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
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-line)] px-2.5 py-1 text-xs font-medium tabular-nums text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-accent)]"
    >
      <Icon name="clock" size={14} />
      {done ? 'Done · reset' : `${mm}:${ss.toString().padStart(2, '0')}`}
      {!done && <span>{running ? '· pause' : '· start'}</span>}
    </button>
  );
}
