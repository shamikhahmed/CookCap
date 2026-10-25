# CookCap marketing capture — 3.7.8

Captured: 2026-10-25T18:31:16.880Z
Base URL: http://127.0.0.1:8920/CookCap

## Summary

| Item | Count / status |
| --- | --- |
| Gallery webp (qa/marketing/shots) | 111 (Phase B seeded from docs/screenshots/gallery) |
| App Store PNGs | 16 (Phase B derived @ 1320×2868 / 2064×2752) |
| Walkthrough | mp4 + webm + poster + vtt (Phase B repaired empty capture) |
| Lighthouse landing | Phase A: performance=94 accessibility=95 · Phase B fixes applied; re-run `bash qa/marketing/lighthouse.sh` |

## Gallery paths

Hub format: `qa/marketing/shots/{light,dark}/{iphone,ipad,mac}/<screen>.webp`
App gallery mirror: `docs/screenshots/gallery/{theme}/{device}/<group>--<screen>--<state>.webp`
Site heroes refreshed under `public/site/*.webp`

## Notes

- Phase A live Playwright capture failed every hub screen (app not ready / timeout). Phase B populated hub shots + App Store PNGs from the existing gallery mirror, resized site heroes for Lighthouse image-delivery, and replaced empty walkthrough media with `docs/gallery/recordings/onboard-flip.webm` encodes.
- Landing a11y: muted hub link now underlined (`public/site/site.css`). `scroll-behavior: auto` on `html`.
- See `qa/marketing/HUB-MEDIA.md` for hub copy paths.

## Failures / skips

- Phase A FAIL rows (all themes × devices × screens) — superseded by Phase B seed; re-capture when shell is healthy.
