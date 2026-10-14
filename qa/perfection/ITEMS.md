# CookCap — Perfection v3 ITEMS
Seeded from §13.14 + Auditor baseline 2026-10-14. Status: only Auditor sets ✅ VERIFIED.

### CK-V3-1 — React hydration error #418
severity: P0     status: ✅ FIXED (Builder) — awaiting Auditor
Where: /CookCap/?demo=1 · every device  
Evidence: live before = Auditor `auditor-baseline-live/` (#418); local before = empty ideas SSR on main C-37; after = `qa/perfection/device/`  
Cause: Live Pages still SSR'd time-of-day kitchen ideas (`ideasForToday(new Date())`) → text mismatch on hydrate.  
Fix: Keep client-only ideas fill after mount (C-37); `suppressHydrationWarning` on ideas section; Appearance portal gated on `mounted` (no SSR/`typeof document` split).  
Test: device-qa 0 pageerrors on local `out/` under `/CookCap/?demo=1`  
Auditor: —

### CK-V3-2 — INPUT tap target &lt; 32px
severity: P1     status: ✅ FIXED (Builder) — awaiting Auditor
Where: touch devices · Evidence: baseline INPUT on live; after `qa/perfection/device/`  
Cause: 1×1 `sr-only` file inputs + undersized NameGate fields / scrub thumb.  
Fix: On-demand `document.createElement('input')` for recipe/about file picks; NameGate `min-h-11`; page-scrub thumb 32px.  
Test: device-qa `smallCount` = 0 on touch devices  
Auditor: —

### CK-V3-3 — publish VERSION.json on Pages
severity: P1     status: ✅ FIXED (Builder) — awaiting Auditor
Where: /CookCap/VERSION.json  
Cause: VERSION.json only at repo root — Next export did not publish it.  
Fix: `public/VERSION.json` (copied into `out/` on build).  
Test: `curl -sf http://127.0.0.1:<port>/CookCap/VERSION.json`  
Auditor: —

### CK-V3-4 — merge finish/cookcap-stepR
severity: P1     status: ✅ FIXED (Phase 0) — awaiting Auditor confirmation
Where: main @ c43a70c  
Fix: Conductor Phase 0 merge already on `main`; perfection branch cut from that tip.  
Auditor: —

### CK-V3-5 — screen-gallery.html both themes
severity: P2     status: ✅ FIXED (prep) — dark capture = phase G
Where: repo root `screen-gallery.html` + `docs/screenshots/gallery/gallery-manifest.json` `v3` block  
Fix: Viewer installed (CookCap-retitled); manifest flags dark required; light shots = 52 existing. Full dark×device capture deferred to phase G.  
Auditor: —

### CK-V3-6 — hub CookCap screenshot placeholder
severity: P2     status: ⏳ OPEN (Hub Engineer)
Where: hub assets — Builder cannot write hub repo under this lock  
Auditor: —
