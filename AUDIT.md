# CookCap — Universal Product-Standard Audit (Phase 1)

**Product:** offline heirloom cookbook PWA (Cap family)  
**Version:** **2.4.6**  
**SW:** `cookcap-v25`  
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
| Chrome | `Shell.tsx` | Top bar, footer, drawers, onboard; first-run blocks chrome |
| Book | `BookController` · `Book` · `WarmLeafPool` · leaves/* | Position + mount window |
| Data | `src/lib/recipes/data*.ts` (215) | Bundled catalog |
| Heroes | `images.generated.json` + `images.lock.json` | Locked photo map |
| State | `AppStore` + IndexedDB `src/lib/db/store.ts` (`jia-cooks` name kept — migration risk) | Favorites, notes, profiles, plan… |
| Modes | `src/lib/modes/*` | Reader / Plate / Mother / … lenses |
| Search | `src/lib/search/search.ts` + `SearchOverlay` | Indexed + ★ filters |
| Design | `globals.css` tokens + `data-skin` / `data-tabs` | Skins + paper tabs default |
| Deploy | `.github/workflows/pages.yml` | typecheck → recipes → build → anti-2d → smoke → Pages |

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
| Med | 32 `goal-*` recipes still art-only | Fill only with human unlock + honest plates |
| Med | Headless Motion flip longtasks | Real-device GPU target ≤50ms |
| Low | IDB name still `jia-cooks` | Keep until one-time copy migration |
| Low | SEO Lighthouse ~63 (`noindex`) | Intentional private book |
| Low | Gallery tree ~192 MB | Regen on major chrome ships |

---

## Fixed this pass (2.4.6)

- Profile / cooking-for localStorage integrity on delete + first upsert  
- Mother allergen fallback + Cooking for UI  
- Import navigate-after-leaves  
- First-run chrome gate  
- Drawer close a11y / handlers · CookingMode timer · theme cycle · onboard Escape align  

---

## Skipped appendices (explicit)

- **E Auth** — no accounts  
- **I Notifications** — none  
- **J i18n/RTL** — single UI locale  
- **K Analytics** — none; smoke proves no third-party runtime fetch  

---

*Live proof: gates + `smoke:product` + Pages deploy.*
