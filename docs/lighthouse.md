# Lighthouse (CookCap v2.0.1)

Audited live: https://shamikhahmed.github.io/CookCap/  
Tool: `lighthouse@12` · 2026-08-02

## Scores

| Form factor | Performance | Accessibility | Best Practices | SEO |
|-------------|-------------|---------------|----------------|-----|
| Desktop | **96** | **100** | **96** | **63** |
| Mobile | **76** | **100** | **96** | **63** |

Desktop: FCP 0.5s · LCP 1.0s · CLS 0 · TBT 0ms  
Mobile: FCP 1.2s · LCP 4.4s · CLS 0 · TBT 310ms (main cost = JS + recipe images)

## SEO 63 — intentional

Only failing SEO audit: **Page is blocked from indexing** (`robots` noindex).
Private family book — keep noindex. Not a bug.

## Reports

- [desktop HTML](./lighthouse-desktop.report.html)
- [desktop JSON](./lighthouse-desktop.report.json)
- [mobile HTML](./lighthouse-mobile.report.html)
- [mobile JSON](./lighthouse-mobile.report.json)

## Regen

```bash
npx lighthouse@12 https://shamikhahmed.github.io/CookCap/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop --chrome-flags="--headless --no-sandbox" \
  --output=json --output=html --output-path=./docs/lighthouse-desktop
```
