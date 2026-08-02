# CookCap — Universal Product-Standard Audit (Phase 1)

**Product:** offline heirloom cookbook PWA (Cap family)  
**Version:** **2.4.5**  
**SW:** `cookcap-v24`  
**Live:** https://shamikhahmed.github.io/CookCap/ (`NEXT_PUBLIC_BASE_PATH=/CookCap`)  
**Stack:** Next.js 15 static export · React 19 · Tailwind v4 · Motion · IndexedDB (`idb`) · SW  
**Auth:** none (local-only) — Appendix E **SKIP**  
**Push / deep-link platform:** none beyond `?recipe=` / `?for=` — Appendix I partial (`?recipe` kept)  
**i18n/RTL:** English UI + Roman-Urdu recipe copy — Appendix J **SKIP** (no locale packs)

---

## Architecture map

| Layer | Location | Job |
|-------|----------|-----|
| Entry | `src/app/page.tsx` → `Shell` | Single route book object |
| Chrome | `Shell.tsx` | Top bar, footer, drawers, onboard |
| Book | `BookController` · `Book` · `WarmLeafPool` · leaves/* | Position + mount window |
| Data | `src/lib/recipes/data*.ts` (215) | Bundled catalog |
| Heroes | `images.generated.json` + `images.lock.json` | Locked photo map |
| State | `AppStore` + IndexedDB `src/lib/db/store.ts` | Favorites, notes, profiles, plan… |
| Modes | `src/lib/modes/*` | Reader / Plate / Mother / … lenses |
| Search | `src/lib/search/search.ts` + `SearchOverlay` | Indexed + ★ filters |
| Design | `globals.css` tokens + `data-skin` / `data-tabs` | Skins + paper tabs default |
| Deploy | `.github/workflows/pages.yml` | typecheck → recipes → build → anti-2d → Pages |

### Guardrails (do not regress)

1. First viewport = brand + book, not dashboard  
2. No scrollbar chrome  
3. No scroll-to-turn  
4. Never mount all recipes (`WarmLeafPool`)  
5. Reader = pure book; lenses additive  
6. Local-only — no accounts / telemetry  
7. Hero lock — rematch/fill need `--force-unlock`  
8. Honest photos or generated art (never wrong-dish stock)

---

## Top risks (prioritized)

| Sev | Risk | Plan |
|-----|------|------|
| High | QA-MATRIX mostly VERIFY not live-proven | Phase 11: Playwright smoke + gate evidence |
| High | ··· menu order ≠ IA-RATIONALE (rename too high) | Phase 3: reorder |
| Med | MenuItem hit targets &lt; 44px | Phase 5/7: `min-h-11` |
| Med | Stale root prompts / audit docs (v2.2.5) | Phase 1/12: refresh; archive clutter note |
| Med | Bundle ~328 kB first load + 38 MB heroes | Monitor; WarmLeafPool holds |
| Low | SEO Lighthouse ~63 (`noindex`) | Intentional private book |
| Low | Gallery tree ~192 MB | Keep; regen on chrome ships |

---

## Dead / duplicate / clutter

| Item | Action |
|------|--------|
| MealDB runtime data | Already purged (v2.4.0); scrub leftover `mdb-*` IDB |
| `docs/haram-removal.json` etc. | Historical — keep |
| Root `*_PROMPT.md` / `MASTER_PROMPT.md` | Keep for ops; not shipped to Pages |
| Tip heroes | Art-only (locked) |
| Orphan `ff-*` public heroes | Scrubbed prior |

---

## Phase plan (this pass)

1. **Discover** — this doc  
2. **Code health** — menu a11y targets; no drive-by architecture rewrite  
3. **IA** — ··· order match IA-RATIONALE; update rationale to 2.4.5  
4–5. **UI/forms** — menu row height; contrast already 2.4.3  
6–7. **Platform/a11y** — live 390/1280 smoke; dialog a11y already  
8. **Perf** — `measure:perf` + First Load JS from build  
9. **Security** — local-only prove (no auth; SW same-origin)  
10. **Offline** — SW shell; gates  
11. **QA** — anti-2d + recipes + smoke script evidence in QA-MATRIX  
12. **Docs/gallery** — bump versions; gallery regen if chrome changes  
13. **Final** — typecheck/lint/gates green; ship

---

## Skipped appendices (explicit)

- **E Auth** — no accounts  
- **I Notifications** — none  
- **J i18n/RTL** — single UI locale  
- **K Analytics** — none; prove no third-party runtime fetch in smoke  

---

*Phase 1 complete when map + risks + plan match the running tree. Live proof in later phases.*
