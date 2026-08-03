# CookCap v3.2.0 — Information Architecture Rationale

**Principle:** every surface has exactly one job. No duplicate homes for the same task.  
**Ordering law:** most-used / daily tools at top → rarely used middle → identity rename late → legal last.

---

## Surface map (one job each)

| Surface | Job | Not responsible for |
|---------|-----|---------------------|
| **Splash** | Quiet launch mark | Settings |
| **Cover leaf** | Book identity + open + optional cover photo | App settings |
| **Book leaves** | Read recipes / chapters / For You; Serve with; kitchen copy | Shopping CRUD |
| **Wooden desk** | Frame book (`--dr-wood*`) — not content | Recipe text |
| **Top bar** | Global wayfinding + mode/profile | Deep editing |
| **Footer** | Page position + **Home / ±5 / scrub / go-to #** | Chapter tabs (desktop rail) |
| **Appearance** | Skin, tabs, Flip/Fast, Labels (EN/Ur stub) | Data export |
| **Search (⌘K)** | Find + ★ + smart phrases | Profile setup |
| **Drawers** | One workflow each | Cross-drawer settings |
| **Dresser / Simple onboard** | First-run identity | Ongoing profiles |
| **NameGate** | Rename only | First-run ceremony |
| **Profiles** | Eaters + Cooking for | Mode definitions |
| **Mode chooser** | Lens groups | Biometrics |
| **Calendar / Pantry** | Diary + inventory / budget | Recipe authoring |
| **About** | Version, privacy, export/merge, guest PIN, wipe | Appearance |

---

## Recipe leaf section order

Title/hero → meta → story → ingredients (party scale + print + shop) → method → Serve with / Goes well with → Cook next → Good to know (subs / swap ideas) → Your kitchen copy → notes

---

## ··· overflow menu

Favorites · Theme*(phone)* · Shopping · This week · Import · Mode · Profiles · Calendar · Pantry · Appearance* · Change book name · About & data (last)

---

## Deep links / PWA

| Entry | Opens |
|-------|-------|
| `?open=search\|shop\|plan` | Overlay / drawer |
| `?share-target=1` / title/text | Import |
| `?restore=1` | About |
| `?recipe=` | Leaf |

---

## Non-goals (P15)

Cloud sync · LLM chef · AR — `docs/SECURITY.md`
