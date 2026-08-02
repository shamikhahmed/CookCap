# CookCap — Presentation

**Version 1.5.0** · Cap family heirloom cookbook PWA  
Live: https://shamikhahmed.github.io/CookCap/  
Repo: https://github.com/shamikhahmed/CookCap

## One-liner

**CookCap** — name your book, open a leather-bound heirloom cookbook offline. No account.

## Demo path (2 min)

1. Enter name → cover becomes **`{Name} Cooks`**
2. Flip Title → Friends → Contents
3. Chapter tab → recipe → **Cook mode**
4. Search → Shopping / This week
5. ··· → Change book name

Screens: [docs/gallery/README.md](./docs/gallery/README.md)

## Why GitHub Pages (not Vercel)

Other Caps (PulseCap, VaultCap, ScentCap) ship static files on
`shamikhahmed.github.io/<Repo>/`. CookCap uses the same: Next static export +
Actions deploy. Phone opens that URL — public git alone was never enough.

## Stack

Next.js 15 static export · React 19 · Tailwind v4 · Motion · IndexedDB · SW `cookcap-v1`
