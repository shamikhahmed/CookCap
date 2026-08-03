# Cursor — CookCap master punch list (v3.3.0)

Live v3.3.0 / SW v33, 790 recipes. One list to make it genuinely finished: fix the
crash, then level up animations, materials, type, states, and every detail. Guardrails
hold (no scrollbar chrome, no scroll-to-turn, WarmLeafPool, offline, Reader = pure book,
never "Family Cooks", estimates labeled). Verify by DOM + real device (pane pixels lie).
Work top-down; commit in logical groups; ship v3.3.0 / SW `cookcap-v34`.

## 0. P0 — Kill the returning-user crash (see docs/cursor-sw-crash-v3.2.2.md)
1. HTML/navigation **network-first**; `_next/static/*` **cache-first**.
2. SW `skipWaiting()` + `clients.claim()`; delete old caches on activate.
3. Page reloads once on `controllerchange`; global `ChunkLoadError → reload` guard.
4. Prove: install PWA → deploy → reopen = updates, no crash (iOS Safari + Chrome).

## 1. Materials — the wooden world (make it look real)
5. Desk wood: base `--dr-wood` + fine **grain** (noise) + **plank seams** +
   overhead **lamp pool** + soft vignette; per-skin (oak / walnut / ash), never muddy.
6. Book **sits on** the wood: deepen the contact shadow; slight ambient occlusion where
   book meets table. Grounded, not floating.
7. Paper tabs = **notes stuck to wood**: paper face (`--color-paper-raised`), ink label,
   hairline + one soft shadow, even edges to a gutter, tiny curl. Active lifts + brightens.
8. Phone: wood **felt** (header/footer wood tint or thin wood frame); book full-bleed;
   Tabs sheet styled as paper notes on a wood strip.
9. Gold foil (cover title) catches a subtle light sweep; leather/linen cover per skin.

## 2. Animation & motion pass (one language, physical, quiet)
10. **One easing + duration set** as tokens; audit every transition to use them. Nothing
    too fast/slow; nothing bouncy except intentional settles.
11. **Page flip**: verify the drag-curl still tracks 1:1, velocity-based release, fold
    shadow + curl highlight + paper-thickness edge; no flip-storm; 60fps.
12. **Chapter hop / tab select**: the target tab peels/lifts; a 1–2 page curl toward it
    (already `animateJump`) — smooth, not a hard cut.
13. **Reveal → table** (onboarding end): book rises from the open drawer → turns →
    spring-lands on the wood → FLIP onto the real cover → tabs peel in stuck to the table
    (frames in plan-dresser-world PART 2). No mid-air, no jump.
14. **Micro-interactions** (subtle, tokenized, reduced-motion-safe):
    - favorite heart: fill + tiny pop/settle.
    - rating stars: fill sweep.
    - step check: strike + check pop.
    - add-to-shopping: item flies/fades to the cart icon; count badge bumps.
    - servings stepper, spice pips, quick-facts: gentle count/scale.
    - buttons: press = subtle scale-down + settle; focus-visible ring.
15. **Screen/drawer transitions**: search, favorites, meal planner, calendar, appearance,
    cook mode — consistent open/close (scale+fade or slide), backdrop fade, focus move.
16. **Loading/skeleton**: image blur-up (no pop), list skeletons, first-paint calm.
17. **Reduced-motion**: every animation collapses to instant/opacity; no lost function.

## 3. Typography & rhythm (tokenized)
18. One display serif + one body/UI face; body ≥16px; audit EVERY role (title, section,
    ingredient, step, quick-fact, label, caption, badge, hint, button) to the scale.
19. Headings `text-wrap: balance`, no widows/orphans; smart quotes; tabular figures for
    times/macros/counts; measure 60–72ch on wide; consistent line-height.
20. Drop-cap on the story; consistent section dividers + vertical rhythm across recipes.

## 4. Visibility / contrast sweep (every screen × 4 skins × light+dark)
21. AA everywhere; **≥7:1 for allergen / warning / "not medical advice" / safety**.
22. Check: tab label vs face + face vs wood; `ink-faint` hints; "What's new" popup;
    footer progress + page count; chrome icons on wood; disabled states; badges; chips.
23. Nothing blends into wood or paper; dividers/borders/toggles visible in all skins.

## 5. Recipe page — refined, consistent
24. Single hero (blur-up, aspect-locked) + title/cuisine overlay; quick-facts row
    (time · difficulty · servings · calories, tabular icons).
25. Jia note (drop-cap), taste/texture, spice pips, allergens; ingredients (scaler) +
    method (numbered, tap-check); tips / common mistakes / storage / **related** (real links).
26. One spacing system; identical rhythm on every recipe; no step photos.

## 6. Designed states (never browser-default)
27. Empty (search no-results, no favorites, empty shopping/pantry/calendar), loading,
    error/retry, offline, 404, end-of-list — each designed, on-brand, helpful.

## 7. Performance (prove with numbers → PERF.md)
28. WarmLeafPool ±N + AssetPreloader keep flips cold-start-free at 223; never mount all.
29. No image pop / layout shift; `PerformanceObserver('longtask')` = no >50ms on flip /
    hop / search; steady ~60fps; memory stable over a long session.

## 8. Accessibility (ship-grade)
30. Full keyboard path (book, tabs, steps, drawers, appearance); visible focus rings;
    `aria-current`/`aria-live`/roles correct; dialog focus-trap + restore; targets ≥44px;
    screen-reader read-through of a recipe makes sense; 200% text no clipping.

## 9. Details & consistency
31. One icon family, one stroke weight, optical alignment; no mismatched glyphs.
32. Spacing/radius/shadow from tokens only — kill stray px/hex.
33. Running header / page number on spreads if it fits the book feel; footnote/margin-note
    style consistent.
34. Sound design (drawer, flip, stamp, check) all gated on `soundOn`; never autoplay loud.
35. Copy: warm, edition-neutral, no "Jia" leaks, no fake-AI marketing.

## Ship
`typecheck`+`lint`+`build` green. Commits grouped by section. Bump
VERSION/package/version.ts → 3.3.0, SW → `cookcap-v34`, CHANGELOG/HANDOVER/QA-MATRIX/
PERF/Capricorn together. Push `main`. Regenerate gallery (reader wood + tabs + a recipe,
each skin, desktop + phone; onboarding drawers + reveal). Final report: crash-gone proof,
contrast-ratio table, perf numbers, per-device shots.
