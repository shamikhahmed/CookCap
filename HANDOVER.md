# Jia Cooks — Handover

Heirloom family cookbook PWA. Version **1.4.1**.

## Stack

- Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB · SW `jia-v7`

## Run

```bash
cd "/Users/shamikhahmed/CookBook Website"
npm install && npm run dev    # http://localhost:3000
npm run build && npm run typecheck
```

## Architecture

| Piece | Role |
|-------|------|
| **Shell** | Desk chrome; grounded book stage; safe-area; ··· menu |
| **BookController** | Index, `jia-pos`, `turningRef`, `animateJump` chapter hops |
| **Book** | Single-page curl + haptic on commit |
| **WarmLeafPool** | Off-screen ±3 neighbors (`passive`) |
| **AssetPreloader** | Idle-warm heroes + steps → SW `CACHE_URLS` |
| **BookmarkRail** | Fat fore-edge + depth tabs; phone sheet |
| **MealPlannerDrawer** | Week plan in IndexedDB `meta` |
| **ShoppingDrawer** | Aisle groups + merge dupes |
| **SearchOverlay** | ⌘K + quick actions |
| **SW** | Shell + offline.html (`jia-v7`) |

## Page totals (gotcha)

Bundled leaves ≈ **218**. Footer shows `leaves.length` after `ready`. Extra pages = **custom imports** in IndexedDB (`customs`) — **per browser origin**. Desktop `localhost` ≠ phone LAN IP ≠ installed PWA. Hover the counter for a tip when customs exist.

## Editions

`?for=jia|ali|shamikh`

## Kitchen standard (quiet)

No pork / wine / gelatin as ingredients. **No** “halal certified” badge in UI.

## Still open

- Real family photos → `docs/photos.md`
- True process step shots (current steps = honest plated stock or omitted)
- Collections store unused
- Optional 2P spread (disabled — empty leather half risk)

## Key files

`Book.tsx` · `BookController.tsx` · `BookmarkRail.tsx` · `Shell.tsx` · `MealPlannerDrawer.tsx` · `WarmLeafPool.tsx` · `AssetPreloader.tsx` · `data*.ts` · `public/sw.js` · `USER_GUIDE.md` · `CHANGELOG.md`
