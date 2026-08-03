# CookCap — Claude / agent review pack (v3.3.2)

**Purpose:** one door for an external agent (Claude, Cursor, etc.) to audit the product without rediscovering history.

**Live:** https://shamikhahmed.github.io/CookCap/  
**Repo:** https://github.com/shamikhahmed/CookCap  
**Path:** `/Users/shamikhahmed/CookBook Website`  
**Version:** 3.3.2 · SW `cookcap-v36` · Catalog **790**

---

## Read order

1. This file  
2. `HANDOVER.md`  
3. `docs/ROADMAP.md` + `docs/SECURITY.md` (P15 hard nos)  
4. `CHANGELOG.md` (3.3.2 → 3.1.0)  
5. `USER_GUIDE.md`  
6. `AUDIT.md` · `QA-MATRIX.md` · `PERF.md` · `IA-RATIONALE.md`  
7. Visuals: `docs/gallery/README.md` + `docs/gallery/{desktop,mobile}/`  
8. Wood plan: `docs/cursor-wood-reader-v3.2.md`  
9. Master plan: `docs/master-roadmap.md` · SW crash: `docs/cursor-sw-crash-v3.2.2.md`

---

## Guardrails (fail review if broken)

| Rule | Meaning |
|------|---------|
| local-only | No accounts, no cloud sync |
| offline-first | SW + IDB |
| honest food photos | Never wrong-dish stock; lock + `--force-unlock` |
| no fake AI | Rules = **Smart Assistant**, never “AI” |
| book-first | First viewport = book object, not dashboard |
| WarmLeafPool | Never mount all recipes |
| hero lock | `images.lock.json` |
| never “Family Cooks” | Default untitled copy is **Our Family Cookbook** |
| wood in reader | `.journal-stage` `backgroundImage` not `none`; not cream desk |
| no stale-SW crash | HTML network-first; ChunkLoadError self-heals |

---

## What shipped recently

| Ver | What |
|-----|------|
| **3.3.2** | Cover open (bible §6) — hinge −160° `--e-page`, inside cover, cast shadow, page fan |
| **3.3.1** | Animation bible Act III — dresser idle + drawer open/close wood physics |
| **3.3.0** | P0 stale-SW crash fix; ChunkLoadError recovery; designed error/404; motion tokens |
| **3.2.1** | Even paper wash on dark skins (no grey→black band); warm walnut paper |
| **3.2.0** | Wooden reading table + paper tabs on wood + phone wood frame; world table restore (~790); `gate:wood` |
| **3.1.0** | Footer: Home, ±5, scrub slider, go-to page # |
| **3.0.1** | Guacamole/jia-salad honest hero fix |
| **3.0.0** | P7–P14; P15 docs only |
| **2.7.0** | Cook ritual + backup restore + IDB `cookcap` |

---

## Verify checklist

```bash
npm run typecheck
npm run gate:recipes          # 790
npm run pages:build
# serve out under /CookCap then:
GATE_URL=… npm run gate:anti-2d
GATE_URL=… npm run gate:wood
npm run smoke:product
```

DOM wood proof: `getComputedStyle('.journal-stage').backgroundImage` contains gradient/url in all 4 skins.
