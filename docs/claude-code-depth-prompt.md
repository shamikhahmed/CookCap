# Claude Code prompt — CookCap 3D book depth & bookmark realism

Copy everything below the line into Claude Code (working directory = this repo).

---

## Mission

You are polishing **CookCap**, a Cap-family heirloom cookbook PWA at `/Users/shamikhahmed/CookBook Website` (Next.js 15 App Router, React 19, Tailwind v4, Motion). Product chrome = CookCap; book title = `{Name} Cooks` from NameGate.

**Goal:** Make the physical book feel like a real thick cookbook — deeper fore-edge, believable laminated chapter tabs at different page depths, stronger page-curl presence — **without** breaking flip physics, mobile sheet tabs, warm leaf pool, asset preload, or IndexedDB state.

Read first (do not invent architecture):

- `~/Capricorn-Brain/01 Projects/Jia-Cooks.md`
- `HANDOVER.md`, `CHANGELOG.md`, `VERSION` (currently **1.4.1**)
- `PRESENTATION.md`, `docs/gallery/README.md` (regen via `npm run gallery`)
- `src/components/book/Book.tsx`
- `src/components/book/BookController.tsx`
- `src/components/book/BookmarkRail.tsx`
- `src/components/book/WarmLeafPool.tsx`
- `src/components/book/Shell.tsx`
- `src/app/globals.css` (search: `book-case`, `sticker`, `fore-edge`, `bookmark`, `journal`)

## Non-negotiables

1. **One composition** — first viewport = brand + book object, not a dashboard.
2. **No scrollbar chrome** — scroll may exist on leaves; bar must stay `scrollbar-width: none` / webkit hidden.
3. **No scroll-to-turn** — page turn is drag / buttons / keys only.
4. **Do not mount all ~200 recipe DOMs** — keep `WarmLeafPool` neighbor window; keep `AssetPreloader`.
5. **Far chapter hops** already use `animateJump` — preserve curl-on-tab behavior.
6. **Phone** uses a tabs sheet; **tablet** softer edge; **desktop** fat right margin for tabs — keep device split.
7. **Minimize scope** — no drive-by refactors; no new deps unless essential.
8. **No fake AI marketing** in UI copy.
9. Private family book — KFC naming OK; no “halal certified” badge.
10. After changes: `npm run typecheck`, smoke flip + tab hop + mobile sheet in browser, bump `VERSION` / `package.json` / `CHANGELOG.md` / `HANDOVER.md` / Capricorn note together.

## Depth / 3D problem (what users feel is flat)

Current bookmarks have elevation bands and a fat fore-edge, but still read as flat UI stickers glued on. Improve:

### A. Fore-edge (stacked paper)

- Visible thickness that scales with remaining pages (or at least looks like ~hundreds of leaves).
- Layered page edges (subtle alternating cream/warm-gray lines), soft shadow into the desk, leather lip already present — deepen without muddy blur.
- Prefer CSS (`box-shadow`, thin repeating gradients, `clip-path`) over heavy canvas/WebGL unless you prove Motion alone cannot do it.
- Respect `prefers-reduced-motion`.

### B. Chapter tabs as physical laminates

- Tabs must appear to poke out from **different depths** of the block (not one flat column).
- Active chapter: slightly more extruded + brighter; past chapters recessed; future chapters deeper in the stack.
- When index changes, tabs should ease depth (spring), not teleport.
- Keep sticker tape / color language from `BookmarkRail` + CSS variables (`--sticker`, chapter `tab` colors).
- Hit targets ≥44px on touch; desktop hover may lift 1–2px with soft shadow.

### C. Page curl presence

- Mid-flip: stronger thickness edge, bend squash, dual-face shade (already partially there — tune, don’t rewrite from scratch).
- Avoid flip-storm: one curl at a time; honor `turningRef` / `locked`.
- Chapter jump curls stay; don’t reintroduce animating every intermediate leaf.

### D. Desk atmosphere

- Journal desk vignette/grain already exists — only tune if depth work makes the book float awkwardly. Book must stay grounded on the desk plane.

## Suggested implementation order

1. Audit current CSS classes for edge/tabs; screenshot desktop + phone before edits.
2. Fore-edge thickness pass (CSS-first).
3. Tab depth mapping from leaf index / chapter start (`chapterStart` in BookController).
4. Motion springs for tab z/x; reduced-motion = instant.
5. Curl shade/thickness polish in `Book.tsx` only if still flat after edge+tabs.
6. Typecheck + browser smoke (desktop 1280, tablet ~768, phone ~390).
7. Docs bump (VERSION patch, e.g. 1.3.3).

## Explicitly out of scope

- Scraping more FoodFusion / rewriting recipes
- Rematching step/hero photos (done in 1.3.2 — use `npm run rematch:steps` only if asked)
- Auth, multiplayer, public SEO marketing site
- Replacing Motion with another animation library
- Mounting every leaf in the DOM

## Definition of done

- [ ] Desktop: book reads as a thick physical object; tabs clearly sit at different paper depths
- [ ] Phone: sheet tabs still usable; no horizontal page scrollbar chrome
- [ ] Flip + chapter tab hop still curl; no flip storm
- [ ] `npm run typecheck` green
- [ ] VERSION / CHANGELOG / HANDOVER / Capricorn `Jia-Cooks.md` updated
- [ ] Short note in Capricorn **Decisions**: what depth model you chose (CSS layers vs other)

## Caveman note for chat

If the user has `/caveman` on, keep replies terse; code/commits stay normal prose.
