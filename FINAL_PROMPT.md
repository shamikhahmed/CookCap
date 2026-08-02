# CookCap — FINAL SHIP PROMPT (binding, self-continuing)

Paste this together with your full 13-phase + Appendix A–L framework. BOTH are
binding. This file is the CookCap-specific truth so you don't rediscover it: what
the app is, the guardrails, the known defects, the screens to build, and the exact
end state — commit + push + submit.

Working dir `/Users/shamikhahmed/CookBook Website`. **CookCap** = offline-first
heirloom cookbook PWA. Next.js 15 App Router (`output: 'export'`) · React 19 · TS
strict · Tailwind v4 (CSS tokens in `globals.css`) · Motion · IndexedDB · Service
Worker `cookcap-v5`. Live: https://shamikhahmed.github.io/CookCap/ (GitHub Pages,
`NEXT_PUBLIC_BASE_PATH=/CookCap`, assets via `withBase()`). Currently **v2.1.0**.
Read first: `AUDIT.md`(create) `HANDOVER.md` `CHANGELOG.md` `docs/beautify-plan.md`
`docs/plan-profiles-modes.md` `MASTER_PROMPT.md` `docs/adding-recipes.md`.

## PRIME DIRECTIVE (from the framework, restated)
Verify LIVE, never trust green. Run the real app at 390 (phone), 768/834 (iPad),
1280 + 1920 (desktop), light + dark + all 4 skins, reduced-motion on. Measure DOM
geometry / pixels / screenshots / console / network. Do Phases 1→13 continuously;
implement → prove live → commit → next; STOP only when all phases + applicable
appendices are done with evidence, then **push to the repo and submit**.

## NON-NEGOTIABLE GUARDRAILS (do not regress)
1. First viewport = brand + book on a desk, not a dashboard.
2. No scrollbar chrome anywhere (`scrollbar-width:none` + webkit hidden); scroll works.
3. No scroll-to-turn — turns are drag / buttons / keys / bookmark hops only.
4. Never mount all recipes — keep `WarmLeafPool` neighbor window + `AssetPreloader`.
5. Device split: phone = tabs sheet; tablet = softer edge; desktop = fat right rail.
6. Reader mode stays the pure book; every lens (profiles/modes/nutrition) is additive
   + removable + honest (macros/costs labeled estimates; health carries "not medical advice").
7. Local-only, no accounts, no telemetry, no network required. Photos honest (generated
   art beats a wrong-dish photo). PKR currency default. Never show "Family Cooks".
8. One token source (`globals.css` `data-skin`); Appearance = `data-skin`+`data-tabs`+`readMode`.

## KNOWN PUNCH LIST (fix + re-verify live first)
- **Cloth tab labels truncate** on the desktop rail ("Pakistani"→clipped, Chinese/
  Italian/Desserts/Snacks cut). Cause: `.sticker-tab` fixed `width:4.75rem` clips the
  serif label. Fix: cloth tabs `width:auto; min-width:4.75rem`, `.sticker-face`
  `width:auto; padding-inline:.55rem`, `.sticker-label{white-space:nowrap; letter-spacing:.01em}`.
- Active/extruded tab's left edge overlaps the fore-edge seam unevenly — nudge origin.
- Light skins keep a dark leather cover — add a linen/cream cover variant bound to the
  light `data-skin`s (Editorial Cream, Light Book, Modern-light) so it isn't heavy.
- Page-total differs per device when custom imports exist — confirm intended + label.

## SCREENS TO DESIGN ON PURPOSE (Appendix B — build/verify each, all skins, real states)
- **Splash / launch** — quiet CookCap mark, dissolves into the book; static under
  reduced-motion; lasts only as long as real load (measure, report the ms).
- **Welcome / value** — one calm screen saying what CookCap is (a living family
  cookbook) before asking anything.
- **Onboarding questionnaire** — the current NameGate expands: (1) whose cookbook →
  `{Name} Cooks`; (2) optional "who eats from it" profile(s); (3) optional pick a
  mode. Few steps, one idea each, honestly skippable, quiet progress, NO autofocus on
  browse/chip steps, field stays above keyboard. Book paints first, welcome over a
  softly blurred desk — never a form on black.
- Designed **empty / loading / error / success / offline / 404 / end-of-list** for
  every data surface (search, favorites, shopping, meal planner, diary/calendar,
  pantry, profiles). Empty states teach value; never fake data as the user's own.
- **About / version / legal** screen — version wired from the single source, licenses,
  privacy statement ("stays on your device"), export/delete data near the bottom.

## INFORMATION ARCHITECTURE (Appendix Phase 3 — write IA-RATIONALE.md)
- Every tab/menu one job; a feature has exactly one home (no duplicate "set up profile").
- **Settings / Appearance / menus** ordered maturely: identity/most-used TOP →
  rare middle → destructive/legal/reset BOTTOM. Group: Account/Identity · General ·
  **Appearance** (skins/tabs/reading — already good, keep) · Accessibility · Privacy &
  Data (export/delete, confirm) · About & Legal (version) last. One concept per group.
- Core tools reachable ≤2 taps: Search, Appearance, Favorites, Shopping, Meal planner,
  Profiles/mode switch, Calendar. Audit the `···` overflow — promote anything buried.
- Progressive disclosure: common path first; advanced behind "More"/detail.

## EXHAUSTIVE QA (Appendix D — QA-MATRIX.md, click EVERYTHING)
Every screen × every skin × light/dark × reduced-motion, on phone/iPad/desktop:
- Book: cover tap-to-open, drag flip both ways, keyboard arrows, bottom next/prev,
  every chapter tab (all 4 tab styles), Flip vs Fast, bookmarks/depth.
- Chrome: search (⌘K + results/empty), Appearance panel (every skin/tab/reading
  toggle persists — check `localStorage` keys `cookcap-skin|tabs|readmode`), Favorites
  drawer, Shopping (aisle groups, merge, check/clear), Meal planner (assign, add week),
  Import modal, `···` menu items, install banner, theme toggle per skin.
- Lenses: NameGate steps, profile create/edit/delete/switch, mode presets, For-You
  leaf, fit badge, make-it-healthier before/after, log meal, calendar rings/streaks,
  pantry, budget. Every number correct (Appendix G — compute independently, verify).
- One row per element: screen · element · expected · actual · pass/fail. Fix + re-verify live.

## PLATFORMS (Appendix Phase 6)
Prove on: iPhone SE + Pro Max, Android, **iPad Mini + iPad Pro (portrait + landscape)**,
laptop, desktop, ultrawide. Safe-area insets (notch/Dynamic Island/home bar). iPad: the
book should feel first-class (bigger stage, tablet edge) — consider a two-page feel only
if it doesn't threaten the flip. No overflow/clipping at any size or 200% text.

## APPENDIX APPLICABILITY (state each in the report)
- A Design foundations — APPLY (tokens already in `globals.css`; kill any stray hex/px).
- B Launch/value/system screens — APPLY (build splash/welcome/onboarding/empty/about).
- C Deliverables — APPLY. D Element QA — APPLY. F Perf budgets — APPLY (measure cold
  start, flip fps, bundle; PERF.md). G Data correctness — APPLY (macros/costs/streaks/
  budget must be exact + labeled estimate where derived). H Assets — APPLY (one icon
  family; app/maskable/favicon/apple-touch at all sizes; recipe images honest, lazy,
  `withBase`, no hotlink, no dup/unused files). L Update flow — APPLY (bump SW past
  `cookcap-v5`; prove a new build reaches an installed PWA; IndexedDB migration forward-safe).
- E Auth — **SKIP**: no auth surface (local/public). Say so.
- I Notifications/deep links — mostly SKIP (no push); DO verify `?recipe=`/`?for=` deep
  links land correctly with basePath.
- J i18n/RTL — PARTIAL: recipe copy includes Roman-Urdu; there's no locale system.
  Keep English UI; ensure long titles/Urdu strings don't clip; note RTL is not built.
- K Analytics — APPLY as a PROOF: confirm ZERO external network calls at runtime
  (privacy promise). No stray console logs in prod.

## END STATE — COMMIT, PUSH, SUBMIT (do this, don't ask)
When all phases + applicable appendices pass with live evidence:
1. Bump the single version source + `package.json` + SW cache; prepend `CHANGELOG.md`.
2. Update ALL docs: `README`, `HANDOVER`, `USER_GUIDE` (add profiles/modes/calendar/
   budget/pantry/appearance), `AUDIT.md`, `IA-RATIONALE.md`, `QA-MATRIX.md`, `PERF.md`.
3. Regenerate the DOCUMENTED gallery (`npm run gallery`) — every key screen + its states
   + captions, per skin, desktop + mobile + iPad; update `docs/gallery/README.md`.
4. Commit in logical groups (`feat:`/`fix:`/`perf:`/`docs:`), then **push** to the repo
   (`git push`; GitHub Pages Action redeploys). Confirm the live URL updated.
5. Print the per-phase report with evidence (measurements, screenshots, numbers), the
   appendix skip list with reasons, and the QA matrix all-pass — then **submit the app**.

Begin at Phase 1 and do not stop until pushed, proven, and submitted.
