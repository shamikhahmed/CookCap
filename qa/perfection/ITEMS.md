# CookCap — Perfection v3 ITEMS
Seeded from §13.14 + Auditor baseline 2026-10-14. Status: only Auditor sets ✅ VERIFIED.

### CK-V3-1 — React hydration error #418
severity: P0     status: ✅ VERIFIED
Where: /CookCap/?demo=1 · every device  
Evidence: 3.6.0 live regression (#418 all devices); hotfix `e435bba` / tag `v3.6.1`; `qa/perfection/live-v3.6.1/` 7/7 pageErr=0  
Cause: Stale HTML/JS during Pages deploy + edition-dependent copy in SSR (cover/title/topbar/ideas).  
Fix: Gate edition copy + kitchen ideas until `editionReady` / post-mount; G-8 bump SW `cookcap-v42`.  
Test: device-qa local `local-v3.6.1/` + live `live-v3.6.1/` — hard=0 pageErr=0  
Auditor: ✅ VERIFIED 2026-10-14T12:10:00Z — live 3.6.1 `auditor-2026-10-14/` 7/7 pageErr=0 (#418 cleared)

### CK-V3-2 — INPUT tap target &lt; 32px
severity: P1     status: ✅ VERIFIED
Where: touch devices · chromium/android page-scrub  
Evidence: reject = auditor-independent INPUT; Builder = `device-ck-v3-2/`; recheck = `auditor-ck2/` (7/7 hard=0 tap&lt;32=0)  
Cause: Footer flex shrunk `.page-scrub` range INPUT to ~24px wide on 412px android (height was already 44).  
Fix: `min-width: 44px` on `.page-scrub` + label `min-w-11`; hide ±5 page-jump IconBtns below `sm` so phone does not overflow-x. Prior file-input / NameGate fixes retained.  
Test: device-qa chromium/android `smallCount` = 0  
Auditor: ✅ VERIFIED 2026-10-14T11:30:00Z — tip dad026d/9ff7894; auditor-ck2 7/7 tap=0 text=0 pageErr=0

### CK-V3-3 — publish VERSION.json on Pages
severity: P1     status: ✅ VERIFIED
Where: /CookCap/VERSION.json  
Cause: VERSION.json only at repo root — Next export did not publish it.  
Fix: `public/VERSION.json` (copied into `out/` on build).  
Test: `curl -sf http://127.0.0.1:<port>/CookCap/VERSION.json`  
Auditor: ✅ VERIFIED 2026-10-14T12:10:00Z — live `VERSION.json` **3.6.1** 200

### CK-V3-4 — merge finish/cookcap-stepR
severity: P1     status: ✅ VERIFIED
Where: main @ c43a70c  
Fix: Conductor Phase 0 merge already on `main`; perfection branch cut from that tip.  
Auditor: ✅ VERIFIED 2026-10-14 — Phase 0 merge on lineage

### CK-V3-5 — screen-gallery.html both themes
severity: P2     status: ✅ FIXED (Gallery Builder 2026-10-14)
Where: hub `/?demo=1` · `e2e/gallery-v3.spec.ts` · schema 2 manifest  
Evidence: **18** shots (Cover/Contents/Recipe × light/dark × iphone/ipad/mac) · **9** dark · G17 ✅  
Auditor: —

### CK-V3-6 — hub CookCap screenshot placeholder
severity: P2     status: ⏳ OPEN (Hub Engineer)
Where: hub assets — Builder cannot write hub repo under this lock  
Auditor: —

### CK-V3-7 — matrix extended overlays × states × engines
severity: P2     status: ⏳ OPEN
Where: import/SW/guest/offline/empty × light/dark × full device-qa grid beyond home smoke
Evidence: MATRIX.md extended section ⏳
Auditor: —
