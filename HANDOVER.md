# CookCap — Handover

Heirloom family cookbook PWA (Cap family). Version **1.5.0**.

## Hosting (like other Caps)

| Cap | URL |
|-----|-----|
| PulseCap | https://shamikhahmed.github.io/PulseCap/ |
| VaultCap | https://shamikhahmed.github.io/VaultCap/ |
| **CookCap** | https://shamikhahmed.github.io/CookCap/ |

- `output: 'export'` → `out/`
- Workflow: `.github/workflows/pages.yml` (`NEXT_PUBLIC_BASE_PATH=/CookCap`)
- **Not** Vercel — GitHub Pages from `main`, same as Pulse/Vault

## Stack

- Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB · SW `cookcap-v1`

## Run

```bash
cd "/Users/shamikhahmed/CookBook Website"
npm install && npm run dev
npm run build && npm run typecheck
```

## Architecture

| Piece | Role |
|-------|------|
| **NameGate** | First-run owner name → `{Name} Cooks` |
| **Shell** | Desk chrome; CookCap + book subtitle; safe-area |
| **BookController** | Index, `cookcap-pos`, turn lock |
| **Book** | Single-page curl + haptic |
| **WarmLeafPool** | Off-screen ±3 neighbors |
| **AssetPreloader** | Idle-warm heroes + steps |
| **SW** | Shell + offline.html (`cookcap-v1`, basePath-aware) |

## Page totals

Bundled leaves ≈ **218**. Customs = per-origin IndexedDB.

## Kitchen standard (quiet)

No pork / wine / gelatin as ingredients. No “halal certified” badge.

## Still open

- Real family photos → `docs/photos.md`
- Collections store unused

## Key files

`NameGate.tsx` · `edition.ts` · `Shell.tsx` · `Book*.tsx` · `public/sw.js` · `.github/workflows/pages.yml` · `PRESENTATION.md` · `docs/gallery/`
