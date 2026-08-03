# Cursor — v3.2.0: put the WOOD in the reader + visibility/contrast sweep

Audit (live v3.1.0, DOM-measured): the wooden world only exists in the onboarding
dresser. The **reading screen** is still the old cream desk — `.book-table` is an
empty transparent div, stage/body background is near-white cream (srgb ~0.96), paper
tabs float pastel on cream. That's why it "looks the same." Fix = actually render the
wood in the reader, make tabs read as notes stuck to it, and pass a full contrast
sweep. Ship **v3.2.0 / cookcap-v32**. Guardrails hold. Verify by DOM (pane pixels lie).

Wood tone already tokenised per skin (`--dr-wood`, used by the dresser). Reuse it.

---

## THE LIST

### A. Wooden table surface in the reader (the missing 80%)
1. Give the reading **desk** a real wood surface (behind the book), driven by
   `--dr-wood`/skin tokens. Put it on `.journal-stage` (or the desk wrapper), NOT on
   the paper pages. Example:
   ```css
   .journal-stage {
     background-color: var(--dr-wood);
     background-image:
       radial-gradient(120% 90% at 50% 18%, color-mix(in srgb, #fff 14%, transparent), transparent 60%), /* lamp */
       repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 1px, transparent 1px 190px),                    /* plank seams */
       url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/></svg>"), /* grain */
       linear-gradient(180deg, color-mix(in srgb, var(--dr-wood) 88%, #fff), color-mix(in srgb, var(--dr-wood) 82%, #000));
     background-blend-mode: overlay, normal, multiply, normal;
   }
   ```
   Add a soft top vignette + the existing `book-contact-shadow` stays (deepen it).
2. `.book-table`: make it the actual table plane the book rests on — subtle raised
   wood panel or at least inherit the surface; not an empty div. Book keeps its
   `--book-h` grounding + contact shadow so it *sits* on the wood.
3. Per-skin wood: Editorial = light oak, Light Book = warm oak, Candlelit = walnut,
   Modern = pale ash (all from `--dr-wood` already). Confirm each looks like wood, not mud.

### B. Paper tabs = notes STUCK to the wood
4. Restyle `.paper-tab-rail` tabs so they read as paper on wood: cream/paper face
   (`--color-paper-raised`), printed chapter name in ink, a hairline + one soft drop
   shadow so each looks adhered, a tiny curl/lift + peel on hover/press. Even left
   edges aligned to a gutter — no float, no jagged overlap. Active = lifts + brightens.
5. On **wood** the pastel-on-cream problem disappears, but verify each tab's label is
   AA against its paper face, and the tab is AA against the wood behind it.
6. Touch targets ≥44px (tablet). Keyboard + `aria-current` intact.

### C. Phone — make the world felt (currently zero wood on phone)
7. Phone reader shows no wood character at all. Add a wood frame: tint the header +
   footer chrome with the wood surface (or a thin wood border around the full-bleed
   book), and style the **Tabs pull-sheet** as paper notes on a wood strip. Book stays
   full-bleed + readable; but the moment reads as "book on a wooden table," not cream.

### D. Reveal → this table (continuity)
8. Now that the reader has real wood, verify the dresser reveal actually lands the
   book on THIS wooden surface and the paper tabs fade in **stuck to the wood** (the
   handoff from `docs/plan-dresser-world.md` PART 2). Same wood tone dresser→reader.

### E. Visibility / contrast sweep (every screen × 4 skins × light/dark)
9. Pages/recipe/contents/chapter dividers stay **paper** (`--color-paper*`) for crisp
   reading — wood only frames them. No body text on wood.
10. Assert **AA everywhere**, **≥7:1 for critical** (allergen chips, warnings, "not
    medical advice", safety). Fix any token pair that fails — especially:
    - tab label vs paper face, tab vs wood, ink-faint vs paper (hints/captions),
    - the "What's new" popup, footer progress text, chrome icons on wood,
    - quick-facts row, spice pips, badges, disabled states.
11. Nothing blends into wood or paper; dividers/borders/toggles visible in all skins.
12. Dark skins (Candlelit / Modern-dark): wood is dark walnut — ensure paper pages +
    tabs still pop and text holds contrast.

### F. Typography pass (while here)
13. Confirm body ≥16px, headings balanced (no widows), smart quotes, tabular macros/
    times, consistent scale across every role. Drop-cap on the story. (Tokens exist.)

### G. Regressions to hold
14. No scrollbar chrome; no scroll-to-turn; WarmLeafPool + AssetPreloader (never mount
    all 223); offline works; reduced-motion (no parallax/3D) safe; a11y AA.

### H. Acceptance (prove by DOM, not eye)
- `getComputedStyle('.journal-stage').backgroundImage` **contains a gradient/url** (wood
  present, not `none`) in all 4 skins.
- Desk base color is a warm wood tone (not srgb ~0.96 cream).
- Paper-tab face = paper token; label + tab contrast pass AA (compute ratios).
- Every recipe/page text sits on paper, AA; critical text ≥7:1.
- Phone: wood frame present; Tabs sheet styled as notes.

### I. Ship
`typecheck`+`lint`+`build` green. Commits: `feat: wooden reader table`,
`feat: paper tabs on wood`, `fix: contrast sweep`, `feat: phone wood frame`. Bump
VERSION/package/version.ts → 3.2.0, SW → `cookcap-v32`, CHANGELOG/HANDOVER/QA-MATRIX/
PERF/Capricorn. Push `main`. **Regenerate gallery so the reading screen now shows WOOD**
(each skin, desktop + phone) — the gallery must visibly differ from before. Final
report: DOM proof wood renders in reader, contrast-ratio table, per-device shots.
