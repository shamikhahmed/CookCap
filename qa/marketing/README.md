# CookCap marketing capture

**Phase A** ships static pages + this script. **Phase B** wires reviewer outputs.

```bash
bash qa/marketing/capture.sh
```

Requires local `node_modules`, Playwright browsers, and a free port in **8920–8929**. Does not network-install packages.

Outputs:

| Path | Contents |
|------|----------|
| `qa/marketing/shots/{light,dark}/{iphone,ipad,mac}/*.webp` | Hub shot names |
| `docs/screenshots/gallery/...` | Double-dash gallery mirror |
| `qa/marketing/appstore/*.png` | 6.9" + 13" App Store PNGs |
| `public/site/walkthrough.*` | mp4/webm + poster + vtt |
| `qa/marketing/SUMMARY.md` | Counts + Lighthouse note |
