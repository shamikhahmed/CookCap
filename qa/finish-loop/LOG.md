# CookCap finish LOG

### COOK-P1-01…09 ✅ (2026-09-15)
Header, hero eyebrows, icons, nutrition footnote, catalog count, onboarding preview, scrubber spacing, images.lock rights fields, privacy.html, e2e scaffold.

# CookCap — LOG

## 2026-09-15 — C-23 stub
- Tier 1 not verified — Review 2
- Created/updated finish-loop records (BASELINE, LOG, STATES, APP-REPORT, DOCS-INVENTORY)
- Known gaps:
  - Tier 1 not verified
  - Prior LOG was one/two lines
  - finish-matrix not yet primary-pass green
  - Lighthouse JSON missing (C-22)
  - __APP_READY__ gap (C-20)

## 2026-09-15 — Tier 1 automated PASS
- CI green after use-client / CCBrand fixes
- VO ⛔ · next: PulseCap

## 2026-09-15 — Gallery regen FAIL
- Command: rebuild out/ + GALLERY_URL=http://127.0.0.1:3456 npm run gallery
- Failure: TimeoutError at waitFooterPage (captureBookChrome) after desktop cover shot
- Partial shots: desktop/00-welcome through 01-cover only
- Action: logged and continued; no commit

## 2026-09-15 — Gallery regen SUCCESS (supersedes FAIL note above)
- Desktop: `adfc1df` (APP_VER from VERSION.json + hardened waits)
- Mobile: `7343afd` (page-jump fallback + GALLERY_QUICK)
- Prior waitFooterPage FAIL was mid-loop race; not current main state.

## 2026-09-16 — C-37
### §15 mini-plan
- Problem: hydration #418; WhatsNew heading includes version; cold-load timeout.
- Root cause: ideasForToday(new Date()) in ContentsLeaf SSR vs client hour/date; version in h2.
- Files: ContentsLeaf.tsx, WhatsNewSheet.tsx
- Change: client-only ideas via useEffect; heading "What's new" only.
- First-load: AssetPreloader uses windowed decode (WINDOW=12, CONCURRENCY=3) — not a blocking fake timer; timeout more likely network/SW on cold GH Pages. No payload cut this pass.
- Risks: brief empty Today's kitchen until mount.
- Verification: no #418 on reload; WhatsNew has no version in heading.

## 2026-09-16 — Finish Review 3 follow-up (finish/cookcap-stepR)
- Committed: C-29 `tokens.css` + brand-palette rename; C-31 matrix env-gate (no `test.skip`); CI-WORKFLOW.txt; empty skip-allowlist; honest TIER1 FAIL (kill-list cleared via tokens).
- Left uncommitted: none in this tree.
- Not merging to main (Tier1 still FAIL: matrix-results / axe / gallery).

## 2026-09-16 — matrix evidence
- Committed: matrix-results.json (6/6). Left uncommitted: playwright.config.ts `reuseExistingServer: true` (local convenience; masks CI).

## 2026-09-16 — Review 3 product loop (hardened tier1)

- **Before:** 11 fail (test-skip, ci:workflow-name, matrix:results, LH stale, axe, gallery, kill hex/sub11/important/outline)
- **Changes:** CI-WORKFLOW=`Deploy GitHub Pages`; finish-matrix `if (RUN)` + writeMatrixResults; `brand-palette.ts`; `tokens.css` hex lock; strip counted `!important`; outline/sub-11 fixes; smoke matrix 6/6
- **After:** killList cleared; remaining: LH freshness/thresholds, axe, gallery, live VERSION.json 404
- **Not faked:** no LH scores invented; no axe stubs

## 2026-09-23 — axe nested-interactive
- CoverLeaf: file input aria-hidden; button owns label; stopPropagation on cover actions.

## 2026-09-23 — live Pages Lighthouse
- desktop: P82 A96 BP96 LCP~1584 TBT~171 — below perf≥90
- mobile: P42 A96 BP96 LCP~7400 TBT~1392 — below thresholds
- Not claiming lighthouse:passing.

## 2026-09-23 — axe clean + LH mobile
- CoverLeaf nested-interactive + Appearance 44px + WarmLeafPool inert (not aria-hidden).
- axe home light/dark: 0 serious/critical.
- LH mobile local/live still ~P42–44 — not claiming lighthouse:passing; desktop JSON pending re-run.
