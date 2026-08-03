# CookCap — Master Roadmap to a Perfect App (Claude / verification track)

The single index + ordered plan, with **acceptance gates verified independently** (DOM
geometry, real-device, measured numbers — not self-assessment). Complements Cursor's
`docs/ROADMAP.md`. Do Acts in order; each ends green (`typecheck`+`lint`+`build`),
committed, docs + gallery updated, proven live. Permanent guardrails: no scrollbar
chrome · no scroll-to-turn · WarmLeafPool + AssetPreloader (never mount all recipes) ·
Reader = pure book · offline-first · a11y AA · reduced-motion parity · never "Family
Cooks" · estimates labeled · no telemetry · no fake-AI copy.

## Reality check (independent, this session)
- **P0 crash** — stale-SW chunk mismatch; fixed in **v3.3.0** (HTML network-first,
  `_next/static` cache-first, ChunkLoadError reload, designed error screens).
- Wood **is** in the reader (DOM-proven since 3.2.0).
- Catalog is **790** (family + local world table). Older “223-only” notes are stale.

## Spec index (all authoritative)
`cursor-sw-crash-v3.2.2.md` · `cursor-master-punchlist-v3.3.md` · `animation-bible.md` ·
`plan-dresser-world.md` · `cursor-wood-reader-v3.2.md` · `cursor-dresser-v3-and-fixes.md` ·
`plan-final-redesign.md` · `plan-reveal-and-safeareas.md` · `cursor-rebalance-honesty.md` ·
`plan-profiles-modes.md`.

---

## ACT I — Stability (nothing matters if it crashes)
- SW crash fix (HTML network-first, chunks cache-first, skipWaiting+claim, reload on
  controllerchange, ChunkLoadError guard). Designed in-app error screen (not raw Next
  overlay). IndexedDB migrations forward-safe; "new version → refresh" toast.
- **Gate:** install → deploy → reopen = updates, no crash (iOS Safari + Chrome); offline
  works; data survives upgrade.

## ACT II — The World looks real
- Wooden reader (grain/planks/lamp/vignette per skin); book grounded (contact shadow).
  Paper tabs = notes on wood (peel, even edges, ≥44px). Phone: wood felt. Contrast sweep.
- **Gate:** DOM shows wood (not cream) all skins; tab + text contrast ratios pass AA
  (≥7:1 allergen/warning).

## ACT III — Motion perfection (`animation-bible.md` in full)
- Easing/duration tokens; dresser idle · drawer open/close · drawer insides · book
  coming out · book opening · page flip · tab stick/select · micro-interactions · screen
  transitions · ambient · loading — each to spec numbers. Anti-2D DOM gate.
- **Gate:** real-device capture drawer→reveal→open→flip at 60fps; no >50ms longtask;
  reduced-motion parity.

## ACT IV — Editorial quality
- Typography (one scale, ≥16px, balance/widows/tabular, drop-cap). Recipe page refined-
  editorial (one hero, quick-facts, note, ingredients+method, related; no step photos).
  Designed empty/loading/error/offline/404/end states. Mature IA/settings order.
- **Gate:** every text role tokenized; every data surface has a designed empty/loading/error.

## ACT V — Content, correct & honest
- Balanced chapters (none >~20%); photo honesty (ships-with-dish or art; spot-audit ≥40).
  Number correctness (kcal/protein/cost/streak exact; tests fail on wrong calc). Linkage
  gate (dup ids / related / chapters / counts / hero-or-art / search).
- **Gate:** linkage gate green; honesty log clean; calculation tests pass.

## ACT VI — Smart features finished (opt-in, additive)
- Profiles/modes/nutrition/calendar/budget/pantry; search (fuzzy + filters); shopping
  (aisle/merge/pantry-aware); meal planner; cook mode (wake-lock, multi-timer, big-text);
  share; favorites→chapter. Reader untouched when ignored.
- **Gate:** each reachable ≤2 taps, offline, correct numbers, never mounts the book.

## ACT VII — Platform hardening
- Safe areas all devices (island/notch/home bar, 100dvh). PWA icons/maskable/splash;
  installable + offline proven. Perf budgets → PERF.md; Lighthouse ~100 (SEO noindex
  intentional; OG for shares). A11y ship-grade + automated axe. Security: sanitize
  imports; **prove zero external runtime calls**.
- **Gate:** budgets met with numbers; a11y auto+manual pass; privacy proven.

## ACT VIII — Delight & retention
- "What shall we cook?" suggestion; gentle streaks/stamps; kitchen-friends personality in
  states/onboarding; micro-delight audit (every animation earns its place).
- **Gate:** a first-timer smiles; a returning user has a daily reason to open it.

## ACT IX — Docs, gallery, ship
- README/CHANGELOG/HANDOVER/**USER_GUIDE** (add recipe, one hero, category, cover,
  friends, colors/fonts, profiles, calendar, budget, deploy, **backup/export + restore**)
  /IA-RATIONALE/QA-MATRIX/PERF current. Documented gallery per skin (reader shows wood),
  desktop+phone+iPad, indexed. One version source bumped together; SW proven.
- **Gate:** a stranger can run, extend, deploy, back up, restore from docs alone.

---

## Stop condition
No crash on any path · wood world real in reader (DOM-proven) · motion matches bible at
60fps with RM parity · type/recipe/states editorial · content honest + numbers exact ·
features additive + ≤2 taps + offline · platform/a11y/privacy hardened with numbers ·
docs + gallery complete. Then a 1–10 self-score per Design · UX · Motion · A11y ·
Performance · Content honesty · Maintainability, justified.

## Process (the honest part)
**Planning is done — diminishing returns on more docs.** Everything needed is written
across the spec index. The path now is **execute Act-by-Act, then verify live** (DOM +
real device + these gates), fix the returned punch list, repeat to the stop condition.
Cursor's self-scorecard is optimistic; trust the gates, not the scores.
