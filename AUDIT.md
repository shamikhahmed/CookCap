# CookCap v2.2.0 — Phase 1 Audit

**Product:** offline heirloom cookbook PWA · **Version:** 2.2.0 · **SW:** `cookcap-v6`  
**Live:** https://shamikhahmed.github.io/CookCap/ (`NEXT_PUBLIC_BASE_PATH=/CookCap`)

---

## Guardrails status

| # | Guardrail | Status | Evidence |
|---|-----------|--------|----------|
| 1 | First viewport = brand + book on desk, not dashboard | **HOLD** | `Shell` + `CoverLeaf`; splash → book |
| 2 | No scrollbar chrome; scroll still works | **HOLD** | `globals.css` `scrollbar-width:none` + webkit hidden |
| 3 | No scroll-to-turn — drag / buttons / keys / tabs only | **HOLD** | `Book.tsx` turn handlers; no wheel-to-page |
| 4 | Never mount all recipes — neighbor window + preloader | **HOLD** | `WarmLeafPool` offsets `[-3…+4]`; `AssetPreloader` |
| 5 | Device split: phone sheet / tablet edge / desktop rail | **HOLD** | `BookmarkRail` + footer Tabs on `<640px` |
| 6 | Reader = pure book; lenses additive + removable + honest | **HOLD** | `reader` mode skips For You / badges |
| 7 | Local-only — no accounts, no telemetry, no network required | **HOLD** | IndexedDB + SW shell; see Appendix K |
| 8 | One token source (`data-skin` / `data-tabs` / `readMode`) | **HOLD** | `globals.css` + `Appearance.tsx` |
| 9 | Never show "Family Cooks"; PKR default; honest photos | **HOLD** | `edition.ts` sanitize; generated-art fallback |
| 10 | WCAG AA + `prefers-reduced-motion` on new surfaces | **HOLD** | `useDialogA11y`, `motionReduce`, splash instant under reduce |

---

## Punch list (Phase 1 fixes)

| Item | Status | Notes |
|------|--------|-------|
| **Cloth tab labels truncate** ("Pakistani", "Desserts" clipped) | **FIXED** | `.sticker-tab` `width:auto; min-width:4.75rem`; `.sticker-face` `width:auto; padding-inline:.55rem`; `.sticker-label` `white-space:nowrap` (`globals.css` `data-tabs='cloth'`) |
| **Light skins dark leather cover** | **FIXED** | Linen/cream `.leather` variant for `editorial`, `lightbook`, `modern` (light); candlelit / modern-dark keep leather |
| **Page total differs** (customs / For-You leaf) | **INTENDED** | Footer waits on `ready`; tooltip labels imported customs; For You leaf shifts indices when mode ≠ reader — documented in footer `title` |
| **Active tab fore-edge overlap** | **FIXED** | Cloth tabs `transform-origin: 0% 50%` nudges extruded tab off seam |

---

## Known risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| Medium | Mode switch adds/removes For You leaf → page indices shift | Expected; `HANDOVER.md` gotcha; footer total updates live |
| Medium | Custom imports are per-device → page totals differ across devices | Footer tooltip: "Includes N imported custom recipes (this device only)" |
| Low | SEO Lighthouse ~63 — `noindex` intentional for private family book | Do not remove `robots` without product decision |
| Low | Roman-Urdu in recipe copy; no locale system | English UI; long titles tested in gallery |
| Low | PWA update requires SW bump past installed cache | Ship bumps `cookcap-v6`; verify installed client refreshes |
| Low | Bundle ~316 kB first load — acceptable for offline book + Motion | Monitor on each major feature add (`PERF.md`) |

---

## Live verify checklist

Run at **390** (phone), **768/834** (iPad), **1280/1920** (desktop) · light + dark · all 4 skins · reduced-motion on.

- [ ] Cold start: splash dissolves when store ready; `sessionStorage['cookcap-splash-ms']` recorded
- [ ] Cover tap opens; drag flip both directions; keyboard ←/→; footer prev/next
- [ ] All 4 tab styles (cloth / index / top / pills) — long chapter names fully visible on cloth
- [ ] Light skins show linen cover; candlelit shows leather
- [ ] Appearance toggles persist: `cookcap-skin`, `cookcap-tabs`, `cookcap-readmode`
- [ ] Footer page total matches current leaf count; tooltip on customs
- [ ] NameGate steps (name → optional profile → optional mode); rename skips extras
- [ ] Search ⌘K; drawers (favorites, shopping, planner, import); profiles/mode/calendar/pantry
- [ ] Deep links: `?recipe=<id>` lands recipe; `?for=Name` sets cover edition
- [ ] Offline: disable network after first load — book, favorites, diary still work
- [ ] Network tab: zero external runtime calls (same-origin + cache only)
- [ ] Gallery regenerated: `npm run gallery` matches live chrome

---

*Phase 1 complete when checklist is green on live Pages URL after push.*
