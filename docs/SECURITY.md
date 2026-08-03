# Security (CookCap)

**Version context:** 3.2.1 · See `docs/REVIEW-PACK.md`

Local-first PWA. No accounts. No server recipe DB. User data stays in IndexedDB / localStorage on device.

## Hard nos (P15)

Do **not** ship without an explicit product decision:

- Encrypted cloud sync / multi-device accounts
- Real LLM / generative “AI chef”
- AR / camera cook overlays

Rules-based helpers (smart search, swap ideas, occasions) must stay labeled as **Smart Assistant** — never “AI”.

## Threat model (device)

| Risk | Mitigation |
|------|------------|
| Guest peek at kitchen data | Guest PIN (obfuscated localStorage — **not** crypto) |
| EXIF / GPS in uploaded photos | Canvas JPEG re-encode strips metadata (`compressImageFile`) |
| Accidental wipe | Confirm gate + export backup first |
| XSS via import JSON | Parse-only typed snapshot; no `eval`; recipe HTML never injected raw |

## CSP / headers

GitHub Pages static host cannot set response CSP headers from this repo.

When self-hosting (Nginx / Cloudflare / Render), prefer:

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

`unsafe-inline` styles may be required for Next/Tailwind until nonces land.

## Backup honesty

Export JSON is plaintext on disk. Treat like a paper cookbook photocopy — protect the file, not the app.
