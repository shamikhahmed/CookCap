# CookCap — Claude / agent review pack (v3.1.0)

**Purpose:** one door for an external agent (Claude, Cursor, etc.) to audit the product without rediscovering history.

**Live:** https://shamikhahmed.github.io/CookCap/  
**Repo:** https://github.com/shamikhahmed/CookCap  
**Path:** `/Users/shamikhahmed/CookBook Website`  
**Version:** 3.1.0 · SW `cookcap-v31` · Catalog **223**

---

## Read order

1. This file  
2. `HANDOVER.md`  
3. `docs/ROADMAP.md` + `docs/SECURITY.md` (P15 hard nos)  
4. `CHANGELOG.md` (3.1.0 → 3.0.0)  
5. `USER_GUIDE.md`  
6. `AUDIT.md` · `QA-MATRIX.md` · `PERF.md` · `IA-RATIONALE.md`  
7. Visuals: `docs/gallery/README.md` + `docs/gallery/{desktop,mobile}/`

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

---

## What shipped recently

| Ver | What |
|-----|------|
| **3.1.0** | Footer: Home, ±5, scrub slider, go-to page # |
| **3.0.1** | Guacamole/jia-salad honest hero fix |
| **3.0.0** | P7–P14 (content, PWA, smart search, occasions, i18n stub, print, guest/merge, harden); P15 docs only |
| **2.7.0** | Cook ritual + backup restore + IDB `cookcap` |

---

## Verify checklist

```bash
npm run typecheck
npm run gate:recipes      # expect 223
npm run pages:build
# serve out under /CookCap then:
GATE_URL=http://127.0.0.1:3456/CookCap npm run gate:anti-2d
GATE_URL=http://127.0.0.1:3456/CookCap npm run smoke:product
```

### Manual spot

- [ ] Guacamole hero = guacamole (not samosas)  
- [ ] Footer Home → cover; scrub moves page; tap `n/total` → Go  
- [ ] Search “30 min yogurt” shows Smart filter hint  
- [ ] About: merge restore + Guest PIN  
- [ ] Appearance: Labels EN / Roman Urdu  
- [ ] Print from recipe leaf  
- [ ] No claim of cloud sync / LLM / AR  

### Gallery spot files

- `desktop/01-cover.png` · `05-recipe.png` · `19-page-nav.png` (if present)  
- `desktop/scroll/` · `desktop/modes/` · `mobile/` twins  

---

## Hard nos (do not recommend building)

Encrypted cloud sync · real LLM chef · AR cook overlays — see `docs/SECURITY.md`.
