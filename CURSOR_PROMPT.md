# Cursor Working Prompt — Jia Cooks: final polish, features, ship

Paste everything below the line into Cursor. Working directory = this repo
(`/Users/shamikhahmed/CookBook Website`). Stack: Next.js 15 App Router · React 19 ·
TypeScript (strict) · Tailwind v4 · Motion · IndexedDB · Service Worker. Currently
**v1.3.3**.

---

You are the senior engineer + design QA lead finishing **Jia Cooks**, a private
heirloom family cookbook PWA (an interactive storybook that opens like a real
hardcover). Goal for this pass: **fix every rough edge, raise mobile AND desktop
to Apple-Books / Awwwards quality, add high-value features, update docs, then
publish to a brand-new GitHub repo.**

Rules of engagement:
- Read before you change. Do NOT invent architecture. Key files: `src/components/book/*`
  (`Book.tsx`, `BookController.tsx`, `BookmarkRail.tsx`, `Shell.tsx`, `WarmLeafPool.tsx`,
  leaves in `leaves/*`), `src/lib/recipes/*` (`data*.ts`, `types.ts`, `chapters.ts`),
  `src/lib/book/pages.ts`, `src/app/globals.css`, `src/components/app/*`.
- Preserve the non-negotiables (below). Prefer small, surgical diffs. No new deps
  unless essential and justified.
- After every change: `npm run typecheck` must stay green, and smoke the flip +
  chapter-tab hop + mobile tabs sheet in the browser (desktop 1280, tablet 768,
  phone 390). Keep 60fps; no dropped frames; no flip-storm.
- End of session: update all docs, bump version, commit, and push to a NEW repo
  (see "Ship" section). Do NOT commit `node_modules`, `.next`, or secrets.

## Non-negotiables (do not break)
1. One composition — first viewport = brand + book object on a desk, not a dashboard.
2. No scrollbar chrome anywhere (`scrollbar-width: none` + webkit hidden); scrolling still works.
3. No scroll-to-turn — page turn is drag / buttons / keys / bookmark hops only.
4. Never mount all ~200+ recipe DOMs — keep `WarmLeafPool` neighbor window + `AssetPreloader`.
5. Far chapter hops use `animateJump` — keep curl-on-tab.
6. Device split: phone = tabs sheet; tablet = softer edge; desktop = fat right margin for tabs.
7. Private family book — KFC naming is fine; NO "halal certified"/fake badges; no fake-AI marketing copy.
8. Offline-first + installable PWA must keep working.

---

## PART 1 — Bugs & low-confidence areas (fix first, verify each)

1. **Page-total mismatch across devices.** Desktop showed `/318`, phone `/218`
   the same session. Find where leaves/total diverge (`src/lib/book/pages.ts`,
   edition/recipe filtering in `AppStore`, any device-conditional recipe set).
   Make the leaf count deterministic and identical across breakpoints, or make
   the difference intentional and documented. The progress bar denominator must
   be correct.

2. **Desktop book sits small & top-left** with a large empty desk. Keep the fat
   right margin for tabs, but ground the book: vertically center it, scale it up
   to use available height (respect min/max), and make the desk vignette feel
   intentional (a real book on a real table), not empty canvas. Verify ultrawide
   (≥1920) and short-landscape laptop.

3. **Recipe data integrity.** `data.ts` spreads `EXTRA_RECIPES` (`data-extra.ts`),
   `FILL_RECIPES` (`data-fill.ts`), and `FOODFUSION_RECIPES` (`data-foodfusion.ts`).
   Verify: no duplicate `id`s across files; every `related: [...]` id resolves to a
   real recipe; every `chapter` is a valid `ChapterId`; nutrition/spice/allergen
   values are sane; stories read in Jia's warm first-person voice (no promo/scraped
   tone, no Roman-Urdu dumps). Fix or prune anything off.

4. **Photo honesty.** Heroes/steps must match the dish or fall back gracefully to
   generated art — never a wrong photo. Audit `RecipeImage` fallback + the step
   image map (`stepImages.ts`). Confirm `npm run typecheck` and that missing images
   degrade cleanly offline.

5. **Empty/edge states.** `favorites` and `tips` chapters, zero search results,
   no favorites yet, no shopping items, a recipe with no story/steps, very long
   titles, 1-serving vs 40-serving scaling. Every one should look designed.

6. **Reduced-motion audit.** Every Motion animation (flip, tabs, tilt, drawers,
   cover reveal, fore-edge width transition) must collapse to instant/opacity under
   `prefers-reduced-motion`. Verify with the OS setting on.

7. **Accessibility pass to WCAG AA.** Focus-visible rings on every interactive
   element; `aria-current`/`aria-pressed`/`aria-live` correct; dialog focus-trap +
   restore for search/drawers/tabs sheet; color-contrast on tab labels and faint
   ink; all icon buttons labeled; keyboard path for everything (including chapter
   tabs and step checklist). Screen-reader read-through of a recipe should make sense.

## PART 2 — Polish (make it feel expensive)
- Typography: consistent scale, balanced headings, no widows/orphans on titles,
  a tasteful drop-cap on Jia's story, correct smart quotes.
- Motion language: one easing family; nothing too fast/slow; remove any animation
  that doesn't communicate purpose; add micro-interactions on favorite, rating,
  step-check, add-to-shopping (subtle, not toy-like).
- Book realism continued from 1.3.3: confirm fore-edge, tab depth, and curl read as
  physical on both themes (light + dark).
- Loading states: skeletons/shimmer for images; graceful first-paint; no layout shift.
- Print stylesheet: a clean printable recipe (hero small or hidden, ingredients +
  method, no chrome) via `@media print`.

## PART 3 — Features (mobile + desktop, only high-value)
Pick what raises delight without bloating; implement cleanly, wire into existing
data-driven architecture so adding recipes still "just works":
- **Mobile-first ergonomics:** one-handed bottom controls; larger thumb targets;
  swipe between pages already works — add a subtle haptic (`navigator.vibrate`) on
  successful turn (guard for support); safe-area insets for notch/home-bar; landscape
  layout for phones.
- **iPad/desktop two-page spread** option on wide screens (behind the existing
  device split) — optional if it doesn't threaten the flip physics; otherwise skip.
- **Cook Mode upgrades:** keep-screen-awake (Wake Lock API), step-by-step big-text
  mode, multiple concurrent timers, "next step" by keyboard/voice-less tap.
- **Shopping list**: category grouping, check/clear, merge duplicate ingredients,
  quantity scaling from the recipe's servings stepper.
- **Meal planner / week view** (simple, IndexedDB-backed) — assign recipes to days,
  generate a combined shopping list.
- **Command palette** (⌘K already opens search) — add quick actions (jump to chapter,
  toggle theme, open shopping list, random recipe).
- **Share**: Web Share API for a recipe (title + tagline + URL/text), fallback copy.
- **Favorites → Jia's Favorites chapter** auto-populates from hearts.
- **Install experience**: polish the PWA install banner + apple-touch icons +
  maskable icon + offline page.

Every feature: keyboard-accessible, reduced-motion-safe, works offline, and does
not mount the whole book.

## PART 4 — Performance & correctness
- Target Lighthouse 100/100/100/100 (Performance / A11y / Best-Practices / SEO) on
  a production build. Add proper `metadata`, Open Graph, `robots`, and a `sitemap`
  if missing. Optimize images (sizes/priority), memoize hot components, avoid
  unnecessary re-renders in `Book`/`BookmarkRail`, keep bundle lean.
- `npm run build` clean (no warnings), `npm run typecheck` green, `npm run lint`
  clean. Remove dead code and unused exports you find along the way.

## PART 5 — Docs (update together, last)
Update all of these in the SAME change as the code:
- `VERSION` + `package.json` version (bump minor since features land, e.g. **1.4.0**).
- `CHANGELOG.md` — new top entry listing every fix/feature.
- `HANDOVER.md` — current state, how to run, gotchas.
- `USER_GUIDE.md` — keep Jia's plain-language guide accurate (adding recipes, step
  photos, categories, cover art, kitchen friends, colors/fonts, deploy, backup,
  restore). If it doesn't exist yet, create it.
- `docs/adding-recipes.md` — keep in sync with the data files.
- Capricorn note `~/Capricorn-Brain/01 Projects/Jia-Cooks.md` — append a dated
  Decisions line summarizing this pass.

## PART 6 — Ship (new GitHub repo)
Only after typecheck + build are green and docs are updated.

```bash
cd "/Users/shamikhahmed/CookBook Website"

# ensure a good .gitignore exists (node_modules, .next, out, .DS_Store, *.tsbuildinfo, .env*.local)
git init
git add -A
git commit -m "feat: Jia Cooks v1.4.0 — heirloom cookbook PWA (polish, features, docs)"

# create a NEW repo and push (requires: gh auth login)
gh repo create jia-cooks --private --source=. --remote=origin --push
```

If `gh` isn't authenticated, run `gh auth login` first (device flow). If the user
prefers a manual remote, create the empty repo on github.com then:

```bash
git branch -M main
git remote add origin https://github.com/<user>/jia-cooks.git
git push -u origin main
```

Default to **private** (family cookbook). Do not commit any secrets or `.env*`.
End with the repo URL and a one-paragraph summary of what shipped.

## Definition of done
- Page total consistent across devices; desktop book grounded and sized well.
- Recipe data clean (no dup ids, all `related` resolve, valid chapters).
- A11y AA, reduced-motion-safe, offline-capable, print stylesheet present.
- New features keyboard-accessible and don't mount the whole book.
- `typecheck` + `build` + `lint` green; Lighthouse near 100s.
- All docs + version bumped together; committed and pushed to a new private repo.
