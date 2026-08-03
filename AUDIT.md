# CookCap — Universal Product-Standard Audit

**Product:** offline heirloom cookbook PWA (Cap family)  
**Version:** **3.1.0**  
**SW:** `cookcap-v31`  
**Live:** https://shamikhahmed.github.io/CookCap/ (`NEXT_PUBLIC_BASE_PATH=/CookCap`)  
**Stack:** Next.js 15 static export · React 19 · Tailwind v4 · Motion · IndexedDB (`cookcap`) · SW  
**Auth:** none (local-only) — Appendix E **SKIP**  
**Catalog:** **223** recipes  
**Review entry:** `docs/REVIEW-PACK.md`

---

## Architecture map

| Layer | Location | Job |
|-------|----------|-----|
| Entry | `src/app/page.tsx` → `Shell` | Single route book object |
| Chrome | `Shell.tsx` | Top bar, **footer page nav**, drawers, onboard |
| Book | `BookController` · `Book` · `WarmLeafPool` · leaves/* | Position + mount window |
| Data | `src/lib/recipes/data*.ts` (223) | Bundled catalog |
| Heroes | `images.generated.json` + `images.lock.json` | Locked photo map |
| State | `AppStore` + `src/lib/db/store.ts` (`cookcap`) | Favorites, notes, profiles, plan… |
| Modes | `src/lib/modes/*` | Reader / Plate / Mother / … lenses |
| Search | `search.ts` + `smart-query.ts` + `SearchOverlay` | Indexed + ★ + smart phrases |
| Design | `globals.css` + `data-skin` / `data-tabs` | Skins + paper tabs |
| Deploy | `.github/workflows/pages.yml` | typecheck → recipes → build → anti-2d → smoke → Pages |

### Guardrails (do not regress)

1. First viewport = brand + book, not dashboard  
2. No scrollbar chrome on book body (footer scrubber is intentional nav)  
3. No scroll-to-turn  
4. Never mount all recipes (`WarmLeafPool`)  
5. Reader = pure book; lenses additive  
6. Local-only — no accounts / telemetry  
7. Hero lock — rematch/fill need `--force-unlock`  
8. Honest photos or generated art (never wrong-dish stock)  
9. No fake AI marketing  
10. P15 hard nos stay out unless product reopens  

---

## Top risks

| Sev | Risk | Plan |
|-----|------|------|
| Med | Some `goal-*` / tips still art-only | Fill only with unlock + honest plates |
| Med | Headless Motion flip longtasks | Real-device GPU ≤50ms target |
| Low | Gallery tree ~200 MB | Regen on chrome ships (done 3.1.0) |
| Low | Guest PIN = obfuscation not crypto | Documented honesty |
| Low | SEO Lighthouse ~63 (`noindex`) | Intentional private book |

---

## Shipped through 3.1.0 (summary)

- Serve-with · cook ritual · backup merge · guest PIN · smart search · occasions · print · i18n stub · PWA shortcuts  
- Honest guacamole fix (3.0.1)  
- Footer Home / ±5 / scrub / go-to page (3.1.0)  

## Gates

`typecheck` · `gate:recipes` · `gate:anti-2d` · `smoke:product` — required green before ship.
