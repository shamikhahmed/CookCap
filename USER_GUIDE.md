# Jia Cooks — User guide

A private family cookbook that opens like a real hardcover. Works offline after the first visit. No account.

## Open the book

1. Visit the site (or install as an app from the browser install prompt).
2. Tap the cover to open.
3. Flip pages by dragging the page, using the bottom arrows, or the keyboard (← →).
4. Chapter tabs on the right (phone: **Tabs** button) jump with a short page curl.

## Find a recipe

- **⌘K** / **Ctrl+K** — search. Empty search shows quick actions (Surprise me, theme, shopping, week plan).
- Contents page lists chapters and “Today’s kitchen” ideas.
- Favorites (♥) chapter shows your hearts plus Jia’s picks.

## Cook

- Open a recipe → **Cook mode** for big steps and timers (keeps the screen awake when the browser allows).
- Tick steps as you go.
- Scale servings with +/- ; **Add to list** sends ingredients to Shopping (duplicates merge).

## Shopping & this week

- ··· menu → **Shopping list** — grouped by aisle; clear checked / clear all.
- ··· → **This week’s meals** — pick a dish per day; **Add week to shopping list**.

## Editions (Jia / Ali / Shamikh)

Share links can use `?for=ali` or `?for=shamikh`. Cover and title follow the edition. Default is Jia.

## Photos

Drop heroes at `public/recipes/<id>.webp` (+ `@sm.webp`). Step photos optional at `public/recipes/steps/<id>-1.webp` … `-3.webp`. See `docs/photos.md`. Wrong stock is omitted on purpose — blank Method pics beat wrong ones.

## Adding recipes

See `docs/adding-recipes.md`. One object in `data*.ts` → bookmarks, search, and pages update automatically.

## Themes & sound

Moon/sun toggles light/dark. ··· → page flip sound (off by default).

## Backup / restore

Favorites, notes, ratings, shopping, meal plan, and imports live in **this device’s** IndexedDB. Clearing site data wipes them. Import WhatsApp recipes via ··· if you need extras on another phone.

## Print

On a recipe page, use **Print** — chrome hides; ingredients + method stay.

## Deploy notes

Bump `public/sw.js` `VERSION` when shell assets change. Never commit `.env*.local` or secrets.
