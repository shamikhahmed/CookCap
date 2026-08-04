# CookCap — Universal Product-Standard Audit

**Product:** offline heirloom cookbook PWA (Cap family)  
**Version:** **3.4.1**  
**SW:** `cookcap-v38`  
**Live:** https://shamikhahmed.github.io/CookCap/ (`NEXT_PUBLIC_BASE_PATH=/CookCap`)  
**Stack:** Next.js 15 static export · React 19 · Tailwind v4 · Motion · IndexedDB (`cookcap`) · SW  
**Auth:** none (local-only) — Appendix E **SKIP**  
**Catalog:** **790** recipes  
**Review entry:** `docs/REVIEW-PACK.md`

---

## Architecture map

| Layer | Location | Job |
|-------|----------|-----|
| Entry | `src/app/page.tsx` → `Shell` | Single route book object |
| Chrome | `Shell.tsx` | Top bar, **footer page nav**, drawers, onboard |
| Book | `BookController` · `Book` · `WarmLeafPool` · leaves/* | Position + mount window |
| Desk | `globals.css` `.journal-stage` / `.book-table` | Real wood via `--dr-wood*` |
| Data | `src/lib/recipes/data*.ts` (790) | Bundled catalog + world table |
| Heroes | `images.generated.json` + `images.lock.json` | Locked photo map |
| State | `AppStore` + `src/lib/db/store.ts` (`cookcap`) | Favorites, notes, profiles, plan… |
| Modes | `src/lib/modes/*` | Reader / Plate / Mother / … lenses |
| Search | `search.ts` + `smart-query.ts` + `SearchOverlay` | Indexed + ★ + smart phrases |
| Design | `globals.css` + `data-skin` / `data-tabs` | Skins + paper tabs on wood |
| Deploy | `.github/workflows/pages.yml` | typecheck → recipes → build → anti-2d → wood → smoke → Pages |

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
11. Reading desk is wood (DOM `backgroundImage`), not cream  

---

## Top risks

| Sev | Risk | Plan |
|-----|------|------|
| Med | Some `goal-*` / tips still art-only | Fill only with unlock + honest plates |
| Med | Headless Motion flip longtasks | Real-device GPU ≤50ms target |
| Med | Large catalog JS (790) | WarmLeafPool + chapter pagination hold |
| Low | Gallery tree ~200 MB | Regen on chrome ships (done 3.4.1) |
| Low | Guest PIN = obfuscation not crypto | Documented honesty |
| Low | SEO Lighthouse ~63 (`noindex`) | Intentional private book |

---

## Shipped through 3.4.1 (summary)

- Serve-with · cook ritual · backup merge · guest PIN · smart search · occasions · print · i18n stub · PWA shortcuts  
- Honest guacamole fix (3.0.1)  
- Footer Home / ±5 / scrub / go-to page (3.1.0)  
- Wooden reader + world table restore + `gate:wood` (3.2.0)  
- Even paper wash on dark skins (3.2.1)
- P0 stale-SW crash fix + error screens + motion tokens (3.3.0)
- Animation bible Act III dresser motion (3.3.1)
- Cover open hinge — leather −160° / inside / fan / gutter (3.3.2)
- Type/taps/WhatsNew/hero/tabs polish (3.4.0)
- Bible §9 micros + onboard→flip 60fps proof (3.4.1)
- Full gallery + docs pack sync (3.4.0+) 

## Gates

`typecheck` · `gate:recipes` · `gate:anti-2d` · `gate:wood` · `smoke:product` — required green before ship.
