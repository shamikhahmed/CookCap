# Cursor — v3.4.0 polish (measured live on v3.4.0)

Independent live audit (DOM + contrast math). App is in good shape: crash fixed, wood
renders (oak light / walnut dark), paper tabs on wood, contrast excellent both skins
(title 12–16:1, body 9–11:1), 790 recipes, balanced chapters. These are the concrete
gaps — measured, not guessed. Verify fixes by DOM + real device. Ship v3.4.0 / SW next.

## Typography (measured)
1. **Body text is 14px — raise to ≥16px** across recipe/reading body (ingredients,
   method, notes). Audit the scale so no body role is under 16.
2. **Smallest text = 9.6px** somewhere (caption/label/badge/hint). Floor small text at
   **≥12–13px**; nothing below 12 in the UI.
3. Keep the good stuff (contrast, serif titles); confirm tabular figures on macros/times,
   balanced headings, no widows.

## Touch targets (measured)
4. **58 interactive elements are <40px.** Audit every button/link/icon-button/tab/chip;
   pad the hit area to **≥44px** (visual can stay smaller). Priority: footer nav, header
   icons, paper tabs, step checkboxes, stepper, star rating, chip filters.

## Layout / chrome
5. **"What's new" popup blocks the recipe on load.** Make it **one-time** (gated on
   last-seen version in localStorage), dismissible, non-blocking, and smaller — never
   cover the hero/title on first open.
6. **Recipe hero crowding**: the large title overlaps the photo and crowds the favorite
   heart. Tighten hero: title on a legible scrim, heart clear of the text, consistent
   safe padding; one clean hierarchy.
7. **Paper tabs crowd/clip** on the right (e.g. "World" half-cut). Fix the rail gutter /
   spacing / max width so every chapter label shows fully; even edges; ≥44px; active lifts.

## Animation Act III remainder (per animation-bible.md)
8. **Page flip depth** — confirm/tune the bend shading, fold shadow, curl highlight,
   paper-thickness edge; 1:1 drag; velocity release; 60fps; no flip-storm.
9. **Tab peel/stick/select** — stick-in on reveal, corner peel on press, select = peel +
   1–2 page curl toward chapter.
10. **Micro-interactions** — heart pop+glow, star fill sweep, step strike+check pop,
    add-to-shopping fly-to-cart + badge bump, button press-settle. All tokenized +
    reduced-motion-safe.

## Guardrails (hold)
No scrollbar chrome · no scroll-to-turn · WarmLeafPool/AssetPreloader · offline · a11y AA
· reduced-motion parity · estimates labeled · never "Family Cooks".

## Ship
`typecheck`+`lint`+`build` green. Commits grouped (`fix: type scale ≥16`, `fix: tap
targets 44`, `fix: whats-new one-time + hero`, `feat: flip/tab/micro polish`). Bump
version + SW, CHANGELOG/HANDOVER/QA-MATRIX/PERF/Capricorn. Push. Regenerate gallery.
Report: measured body-px, min-font-px, count of sub-44 targets (→0), real-device shots.
