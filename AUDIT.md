# Historical — catalog is 215 family recipes; TheMealDB removed in v2.4.0.

# CookCap v2.2.5 — Phase 1 Audit

**Product:** offline heirloom cookbook PWA · **Version:** 2.2.5 · **SW:** `cookcap-v11`  
**Live:** https://shamikhahmed.github.io/CookCap/ (`NEXT_PUBLIC_BASE_PATH=/CookCap`)

---

## Guardrails status

| # | Guardrail | Status | Evidence |
|---|-----------|--------|----------|
| 1 | First viewport = brand + book on desk, not dashboard | **HOLD** | `Shell` + `CoverLeaf`; splash → book / dresser |
| 2 | No scrollbar chrome; scroll still works | **HOLD** | `globals.css` `scrollbar-width:none` + webkit hidden |
| 3 | No scroll-to-turn — drag / buttons / keys / tabs only | **HOLD** | `Book.tsx` turn handlers; no wheel-to-page |
| 4 | Never mount all recipes — neighbor window + preloader | **HOLD** | `WarmLeafPool` offsets `[-3…+4]`; `AssetPreloader` |
| 5 | Device split: phone sheet / tablet edge / desktop rail | **HOLD** | `BookmarkRail` + footer Tabs on `<640px` |
| 6 | Reader = pure book; lenses additive + removable + honest | **HOLD** | `reader` mode skips For You / badges |
| 7 | Local-only — no accounts, no telemetry, no network required | **HOLD** | IndexedDB + SW shell; see Appendix K |
| 8 | One token source (`data-skin` / `data-tabs` / `readMode`) | **HOLD** | `globals.css` + `Appearance.tsx` |
| 9 | Never show "Family Cooks"; PKR default; honest photos | **HOLD** | `edition.ts` sanitize; Jia wipe; generated-art fallback |
| 10 | WCAG AA + `prefers-reduced-motion` on new surfaces | **HOLD** | Simple onboard path; dresser SFX gated; `useDialogA11y` |

---

## Punch list (v2.2.5)

- **Desk z-stack / Appearance clicks** — FIXED: no blanket `.journal-desk > * { z-index:1 }`; header/main/footer/overlay layers; Appearance portals to `body`
- **Jia wipe** — FIXED: Favorites / cloth tab / stories / recipe titles edition-aware
- **Dresser onboarding** — SHIPPED: 3D path + Simple fallback; rename stays `NameGate`

## Punch list (v2.2.1)

- **Desktop tiny/top-left first paint** — FIXED: `.book-frame` size from `--book-h: clamp(560px, 82vh, …)` + `width: calc(var(--book-h)*5/7)`; no flex-parent `%`. Proof: `docs/gallery/desktop/grounding-{1280,1440,1920}-reload.png` (hard reload, no resize). Live measure 1280 → ~527×738 centered in stage.
- Cloth seam kiss — `left: 6px` + higher extrusion on cloth tabs.

## Punch list (prior) (Phase 1 fixes)

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
| Low | PWA update requires SW bump past installed cache | Ship bumps `cookcap-v11`; verify installed client refreshes |
| Low | Bundle ~328 kB first load — acceptable for offline book + Motion | Monitor on each major feature add (`PERF.md`) |

---

## Live verify checklist

Run at **390** (phone), **768/834** (iPad), **1280/1920** (desktop) · light + dark · all 4 skins · reduced-motion on.

- [ ] Cold start: splash dissolves; dresser or Simple onboard; no Jia in UI
- [ ] Appearance skins/tabs clickable (desk z + portal)
- [ ] Cover tap opens; drag flip both directions; keyboard ←/→; footer prev/next
- [ ] All 4 tab styles — long chapter names fully visible on cloth
- [ ] Light skins show linen cover; candlelit shows leather
- [ ] Appearance toggles persist: `cookcap-skin`, `cookcap-tabs`, `cookcap-readmode`
- [ ] Footer page total matches current leaf count; tooltip on customs
- [ ] Search ⌘K; drawers; profiles/mode/calendar/pantry
- [ ] Deep links: `?recipe=<id>` lands recipe; `?for=Name` sets cover edition
- [ ] Offline: disable network after first load — book, favorites, diary still work
- [ ] Network tab: zero external runtime calls (same-origin + cache only)
- [ ] Gallery regenerated: `npm run gallery` matches live chrome (incl. `dresser/`)

---

*Phase 1 complete when checklist is green on live Pages URL after push.*
