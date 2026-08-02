# CookCap — MASTER BUILD PROMPT (self-continuing)

> **Honesty gate 2026-08-02 (v1.5.1):** Phase **0 stabilize** is what shipped —
> Pages `withBase` photos, mobile full-bleed reader, flip touch, docs/gallery.
> Phases **1–12** (profiles / modes / nutrition / calendar) are **NOT built**.
> Do not mark them done. Product name = **CookCap**; book title = `{Name} Cooks`.

Paste this whole file into Cursor as the standing instruction. Working dir =
`/Users/shamikhahmed/CookBook Website`. Stack: Next.js 15 (App Router) · React 19 ·
TypeScript strict · Tailwind v4 · Motion · IndexedDB · Service Worker (PWA).
Current **v1.5.1**, ~186 recipes, offline-first, no accounts. Live:
https://shamikhahmed.github.io/CookCap/

Companion specs (read them, they are authoritative for scope):
`docs/plan-profiles-modes.md` (profiles, modes, nutrition, calendar, cost),
`CURSOR_PROMPT.md` (polish/features/ship), `HANDOVER.md`, `docs/adding-recipes.md`,
`docs/photos.md`, `USER_GUIDE.md`.

---

## 0. Role & operating contract (READ FIRST)

You are the full team: staff frontend + backend engineer, product designer, motion
+ a11y lead, performance + QA engineer, editorial designer, and technical writer.

**This is a self-continuing job. Do NOT stop after one phase.** Work the roadmap
top to bottom. After each phase: run the quality gates, self-review against the
rubric, update docs + gallery, commit, then **immediately start the next phase**.
Only stop when the Global Definition of Done (§9) is fully met, or when truly
blocked by a missing credential/irreversible decision — and even then, keep going
on every other phase that is not blocked, and clearly list what's blocked and why.

**Never fake completion.** If a test fails, say so and fix it. If macros/costs are
estimated, label them estimates. If a photo doesn't match a dish, use generated art.
No placeholder screens shipped as "done". No invented metrics.

Default decisions (so you never stall):
- Bookmarks: **keep the depth-rail** (desktop right rail at paper depths + phone
  sheet). Do not move to top-edge unless the owner explicitly asks.
- Backend: **local-first is the product.** Cloud sync is an OPTIONAL late phase,
  off by default, no accounts required to use the app.
- Currency: **PKR** default, user-switchable.
- New health/goal features carry a one-line "not medical advice" disclaimer.

---

## 1. Non-negotiable guardrails (do not regress)
1. One composition — first viewport = brand + book on a desk, not a dashboard.
2. No scrollbar chrome anywhere (`scrollbar-width:none` + webkit hidden); scroll still works.
3. No scroll-to-turn — turns are drag / buttons / keys / bookmark hops only.
4. Never mount all ~200 recipe DOMs — keep `WarmLeafPool` neighbor window + `AssetPreloader`.
5. Chapter hops keep `animateJump` curl.
6. Device split: phone = tabs sheet; tablet = softer edge; desktop = fat right margin.
7. Reader mode stays byte-for-byte the current experience; every new feature is
   additive and removable (a user who ignores all of it still has the heirloom book).
8. Offline-first + installable PWA keeps working after every phase.
9. Private family book — KFC naming ok; NO fake badges ("halal certified"), no
   fake-AI marketing copy, no tracking/telemetry, no accounts required.
10. Accessibility WCAG AA and `prefers-reduced-motion` honored on every new surface.

---

## 2. Architecture (frontend + backend + data)

### Frontend
- App Router, RSC where sensible; interactive book is client. Keep the existing
  `Shell` → `BookController` → `Book`/`LeafView`/leaves structure.
- State: `AppStore` (edition, recipes, favorites, mode, active profile) is the single
  source; new lenses read from it. Do not prop-drill globals.
- Motion: one easing family; springs for physical UI; instant under reduced-motion.
- Styling: Tailwind v4 tokens in `globals.css`; no ad-hoc magic numbers — extend tokens.

### Data model (additive; see `docs/plan-profiles-modes.md` §2, §6b for full types)
- `src/lib/recipes/types.ts`: add optional `macrosVerified`, `dietTags`,
  `healthierSwaps`, `estCostPerServing`, `costTier`, `totalMinutes`, `pantryStaple`,
  `servesCrowd`. Nothing existing breaks.
- `src/lib/profiles/types.ts`: `Profile`, `Targets`, `Goal`, `Mode`, `DiaryEntry`.
- `src/lib/modes/types.ts`: declarative `ModeDef` (scoring preset) + registry.
- `src/lib/profiles/nutrition.ts`: Mifflin–St Jeor, target calc, scaleMacros, applySwaps.
- `src/lib/modes/recommender.ts`: score(recipe, mode, eaters) → ranked list + fit reasons.
- `src/lib/cost/ingredient-cost.ts`: local PKR price table + `estCost(recipe)`.

### "Backend" / persistence
- **Primary backend = the device.** IndexedDB via `src/lib/db/store.ts` (bump the DB
  version, add `profiles`, `diary`, `pantry` stores + indexes; **migration must
  preserve** favorites/notes/ratings/history/meal-plan/shopping). Service Worker
  keeps assets + shell offline.
- Route handlers only where a real server need exists (none required for core).
  If/when Cloud Sync (Phase 9, optional) is built: Next.js Route Handlers under
  `src/app/api/*`, a Marketplace Postgres (via Vercel) or the user's chosen store,
  end-to-end optional, export/import JSON as the zero-infra fallback. Never make the
  app require the network.

### Modes = data, not code
Implement the `ModeDef` registry + recommender once; every mode (Gym, Mother,
Student/Budget, Quick, Beginner, Dawat, Ramadan, Toddler, health lenses, Couple)
is a preset. Adding a mode ≈ 10 lines of data. Reader = empty preset.

---

## 3. ROADMAP (phases → deliverables → acceptance)

Work in order. Each phase ends green + committed + docs + gallery updated.

| # | Phase | Key deliverables | Acceptance gate |
|---|-------|------------------|-----------------|
| 0 | Audit & stabilize | Fix the confidence-audit items (`docs/plan-profiles-modes.md` §0): page-total device consistency, desktop book grounding/size, data integrity (no dup ids, all `related` resolve, valid chapters), photo↔dish honesty pass, `macrosVerified` flagging | `typecheck`+`build`+`lint` green; page total identical desktop/phone; no wrong-dish photos; audit checklist all ticked |
| 1 | Profiles foundation | `profiles`+`diary`+`pantry` stores + safe migration; `profiles/types.ts`; `nutrition.ts` (targets, scale, swaps); `Mode` state in `AppStore`; Reader unchanged | Existing IndexedDB data survives upgrade; unit checks on nutrition math; Reader mode pixel-identical |
| 2 | Profiles UI | Onboarding step (extend `NameGate`, skippable); TopBar profile switcher; manage-profiles drawer; avatars from Kitchen-Friend art | Create/edit/delete/switch profile; keyboard + SR accessible; reduced-motion safe |
| 3 | Mode engine + cost | `ModeDef` registry + `recommender.ts`; `ingredient-cost.ts` (PKR) + `estCostPerServing`; shared Mode chooser UI | Recommender ranks sensibly; cost shows as estimate; switching modes re-scores instantly |
| 4 | My Plate (Gym/Goal) | Fit badges on recipes; "For You" leaf after Contents; goal-aware ranking; "estimated macros" hint | Badge reasons correct for a cut/bulk profile; For-You never mounts whole book |
| 5 | Make it healthier | Swap engine + before/after macro bars; curated `healthierSwaps` on ≥20 flagship recipes | Toggle recomputes + labels estimate; a11y + reduced-motion |
| 6 | Log + Calendar | "Log this" (date/servings/profile/meal); Today ring (kcal+protein vs target); Calendar drawer (month, rings, planned-vs-eaten, streaks) | Log persists offline; day detail edit/remove; weekly protein avg correct |
| 7 | Mother Mode | Cook-for multi-select; serving aggregation; per-eater allergen flags; combined shopping + meal plan | Scales + warns for selected eaters; integrates existing shopping/meal-plan |
| 8 | Student / Budget | Cost-per-serving + cost-per-g-protein; weekly grocery budget tracker; pantry-aware shopping (only buy missing); leftover remix; batch meal-prep | Budget math correct; pantry subtraction works; all estimates labeled |
| 9 | Pantry + more modes | Pantry inventory + "cook from what you have" match + expiry nudges; ship Quick, Beginner, Dawat/Event, Ramadan, Toddler, health-lens presets (data) | Each mode changes ranking/chrome only; no forks; a11y intact |
| 10 | Goal recipes + honesty | Add breakfast/high-protein/light/budget recipes with `macrosVerified:true`; correct estimated macros/costs; re-audit photos | ≥30 verified recipes added; no dup ids; photos honest |
| 11 | Performance & SEO | Lighthouse 100/100/100/100 (prod); OG/robots/sitemap; memoize `Book`/`BookmarkRail`; bundle + memory check; remove dead code | Four ~100s on a prod build; no console errors; bundle not regressed |
| 12 | Docs, gallery, ship | Full doc refresh (§7); regenerate screenshot gallery (§8); bump version; commit; push repo; optional Vercel deploy | Docs current; gallery matches current UI; repo pushed; (optional) preview URL |
| 13 (opt) | Cloud sync | Route Handlers + chosen store; opt-in; JSON export/import fallback; never required | Works offline without it; sync is opt-in and reversible |

---

## 4. Per-phase LOOP protocol (repeat every phase, do not skip)

1. **Plan** the phase in 3–6 bullets (files to touch, data added, UI added).
2. **Read** the real files before editing; match existing patterns.
3. **Implement** front-end + persistence + logic together; keep diffs surgical.
4. **Verify in browser** (dev server): desktop 1280, tablet 768, phone 390 —
   flip + chapter hop + the new surface; light + dark; `prefers-reduced-motion` on.
5. **Quality gates** (must pass): `npm run typecheck` · `npm run build` ·
   `npm run lint`. Fix all errors/warnings before continuing.
6. **Self-review** against the rubric (§6). If any answer is "no", improve and re-run.
7. **Docs**: update the docs the phase touched (§7).
8. **Gallery**: if the phase changed any screen, run `npm run gallery` and commit the
   refreshed `docs/gallery/{desktop,mobile}` + update `docs/gallery/README.md`.
9. **Version + changelog**: bump `VERSION`+`package.json` (minor per feature phase),
   prepend a `CHANGELOG.md` entry.
10. **Commit** with a clear conventional message (`feat:`/`fix:`/`perf:`/`docs:`).
11. **Continue** to the next phase automatically. Do not wait to be asked.

---

## 5. Quality gates (every phase)
- `npm run typecheck` green (strict). `npm run build` clean (no warnings).
  `npm run lint` clean. No runtime console errors in the browser smoke.
- 60fps flip; no dropped frames; no flip-storm; no layout shift on image load.
- Offline: after a load, disconnect → app + last pages + logging still work.
- A11y: focus-visible everywhere; dialogs trap + restore focus; `aria-*` correct;
  contrast AA; full keyboard path (including tabs, step checklist, calendar).
- Reduced-motion: every animation collapses to instant/opacity.

## 6. Self-review rubric (answer honestly each phase)
- Would Apple Books / the Apple Design Award jury ship this screen?
- Would it win Awwwards SOTD? Does a first-time user smile?
- Is Reader mode still untouched and is the new feature fully removable?
- Is every number honest (estimates labeled), every photo truthful?
- Is it accessible, offline-capable, reduced-motion-safe, and does it avoid
  mounting the whole book?
If any "no" → fix before moving on.

## 7. Documentation deliverables (keep in sync, every relevant phase)
- `VERSION` + `package.json` version.
- `CHANGELOG.md` — top entry per phase, every change listed.
- `HANDOVER.md` — current state, run steps, gotchas, data model, migration notes.
- `USER_GUIDE.md` — Jia's plain-language guide, expanded: add recipe, step photos,
  categories, cover art, kitchen friends, colors/fonts, **create profiles, pick a
  mode, log meals, read the calendar, set a grocery budget, use the pantry**, deploy,
  back up, restore.
- `docs/adding-recipes.md` — keep the data fields (incl. new optional ones) accurate.
- `docs/plan-profiles-modes.md` — mark phases done; keep types current.
- `PRESENTATION.md` — refresh the product tour.
- `README.md` — features, stack, scripts, screenshots.
- Capricorn note `~/Capricorn-Brain/01 Projects/Jia-Cooks.md` — a dated Decisions
  line per phase (what shipped + any model/architecture choice).

## 8. Screen gallery + screenshots pipeline
- Use `npm run gallery` (`scripts/capture-gallery.mjs`) to capture every key screen
  across **desktop + mobile** (and add tablet if not present): cover, title, kitchen
  friends, contents, a chapter divider, a recipe (light + dark), search, cooking
  mode, meal planner, and each NEW surface (profile switcher, For-You, make-it-
  healthier, log dialog, calendar, mode chooser, budget/pantry).
- Commit refreshed images to `docs/gallery/{desktop,mobile}` and update
  `docs/gallery/README.md` with a labeled index. Keep file names stable so diffs
  show visual change. Do this whenever a screen changes — the gallery must always
  reflect the shipped UI.

## 9. GLOBAL Definition of Done (stop condition)
Stop only when ALL are true:
- Phases 0–12 complete (13 optional). Every acceptance gate met.
- `typecheck` + `build` + `lint` green; Lighthouse ~100 across the four categories.
- Reader mode unchanged; every new feature additive, accessible, offline, reduced-
  motion-safe, and honest (labeled estimates, truthful photos).
- IndexedDB migration preserves all prior user data.
- All docs in §7 current; screenshot gallery matches the shipped UI.
- Repo committed and pushed (§10); optional Vercel preview noted.
- A final report: what shipped per phase, remaining trade-offs, and a 1–10 self-score
  for Design / UX / Motion / A11y / Performance / Maintainability, with justification.

## 10. Ship (new GitHub repo)
Only after gates green + docs + gallery updated.
```bash
cd "/Users/shamikhahmed/CookBook Website"
# .gitignore must exclude node_modules, .next, out, .DS_Store, *.tsbuildinfo, .env*.local
git init 2>/dev/null; git add -A
git commit -m "feat: Jia Cooks — profiles, modes, nutrition & calendar (vX.Y.0)"
gh repo create jia-cooks --private --source=. --remote=origin --push   # needs: gh auth login
```
Manual remote fallback:
```bash
git branch -M main
git remote add origin https://github.com/<user>/jia-cooks.git
git push -u origin main
```
Default **private**. Never commit secrets/`.env*`. Optional: `vercel` deploy (private)
— note the URL; the app must still work fully offline without any backend.

---

**Begin now at Phase 0 and keep going through the roadmap without stopping.** After
each phase, post a short status line (phase, what shipped, gates result) and proceed
to the next. Report blockers but never halt the whole run for one.
