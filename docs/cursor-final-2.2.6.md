# Cursor — final closeout (v2.2.6): dresser reveal, safe-area chrome, tidy + ship

Repo `/Users/shamikhahmed/CookBook Website`. Live v2.2.5 / SW `cookcap-v11`.
Ship **v2.2.6 / cookcap-v12**. Keep all guardrails (no scrollbar chrome, no
scroll-to-turn, WarmLeafPool, Reader pure, never "Family Cooks", estimates labeled).
**Verify by DOM geometry, not screenshots** (the preview pane paints desynced).

## Already changed on disk (Claude) — keep/integrate, don't revert
- `src/components/app/DresserOnboarding.tsx` — question now renders **inside** the
  opening drawer (`.dresser-drawer__interior`), wood front + handle below; floating
  `VelvetCard` removed. Verified: open drawer → interior 262px, question + input
  inside, above the front lip.
- `src/app/globals.css` — new accordion drawer CSS (`.dresser-drawer`,
  `__interior`, `__front`). Reconcile with your copy; take Claude's drawer block.

## 1. Apply the reveal (docs/plan-reveal-and-safeareas.md · PART A)
- Replace the `dresser-book-*` rules with the drop-in `db-rise/turn/settle` keyframes
  (book fixed, `translate(-50%,-50%)` base, `transform-style: preserve-3d`).
- Book rises **from the open reveal-drawer interior** → turn → spring-settle → FLIP/
  crossfade onto the real `.book-frame` (match rect + 260ms). Rising cover uses the
  active skin's art (linen light / leather dark). Reduced-motion = instant.
- Keep component timings (rise→turn 700, settle+stamp 1400, done 2360). One anim at a time.

## 2. Header/footer safe areas (PART B) — do all of it
- `layout.tsx` viewport: add `viewportFit: 'cover'` (else `env()` insets are 0).
- Add `--safe-t/b/l/r` + `--header-h/--footer-h` tokens; apply
  `padding-top: max(.5rem,--safe-t)` / `padding-bottom: max(.5rem,--safe-b)` + side
  insets to header/footer; min-heights include the inset.
- Switch full-height to **`100dvh`**; set
  `--book-h: clamp(320px, calc(100dvh - --header-h - --footer-h - --safe-t - --safe-b - 2rem), 860px)`
  (current `100dvh - 7.5rem` ignores safe areas → clips on notched phones).
- Prove per device: Dynamic-Island iPhones (portrait + landscape), SE/mini, iPad
  Mini/Air/Pro (home indicator; not phone-stretched), desktop/ultrawide, landscape,
  foldable. No control intersects top/bottom insets; book fully between header+footer;
  targets ≥44px; no h-scroll; all skins hold contrast.

## 3. Tidy (dead code from the dresser rewrite)
- Remove now-unused CSS: `.dresser-drawer__face`, `.dresser-drawer__cavity`,
  `.dresser-velvet`, `.dresser-card` (+ its media), `.dresser-plate` if unused,
  `--dr-z-open` var. Grep to confirm zero references before deleting.
- Remove any unused imports/vars flagged by lint. Keep `.dresser-plate` only if the
  welcome still uses it (it does — leave it).
- One quick pass: no `console.*`, no dead onboarding branches, no duplicate handlers.

## 4. Little things (organize)
- Gallery dresser stills are the OLD flat version — regenerate: welcome, each **open**
  drawer (name/profile/mode), reveal mid-rise, cover handoff — desktop + mobile, and
  at least the Editorial + Candlelit skins. Update `docs/gallery/README.md`.
- Confirm `favoritesLabel` edition-aware everywhere (no "Jia"); `♥` tab label fits.
- Confirm SW deployed cache constant actually bumps to `cookcap-v12` (past the v-mismatch trap).

## 5. Docs (update together — single source of truth)
- `VERSION` + `package.json` + `src/lib/version.ts` → **2.2.6**.
- `CHANGELOG.md` top entry: dresser question-inside-drawer + reveal keyframes +
  safe-area chrome (dvh + insets) + tidy; SW `cookcap-v12`.
- `HANDOVER.md`: note safe-area tokens + `--book-h` new math + dresser interior model.
- `README.md` / `PRESENTATION.md`: refresh if screens changed.
- `QA-MATRIX.md`: add the per-device safe-area + reveal rows (pass/fail, DOM evidence).
- `docs/adding-recipes.md`: still says "Jia Cooks" in the title/example — retitle to
  CookCap and edition-neutral (`{Name}`), since Jia was wiped from the product.
- Capricorn note `~/Capricorn-Brain/01 Projects/Jia-Cooks.md`: dated Decisions line for 2.2.6.

## 6. Gates + ship
`npm run typecheck` + `npm run lint` + `npm run build` green. Commit in logical
groups (`feat: dresser reveal`, `fix: safe-area chrome`, `chore: tidy`, `docs:`),
push `main` (GH Pages redeploys). Confirm live: onboarding first-run opens a drawer
with the question inside, reveal lands as the cover, chrome clears the island/home
bar on a notched device. Print a short per-item done/evidence report.
