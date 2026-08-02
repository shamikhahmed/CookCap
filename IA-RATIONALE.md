# CookCap v2.4.5 — Information Architecture Rationale

**Principle:** every surface has exactly one job. No duplicate homes for the same task.  
**Ordering law:** most-used / daily tools at top → rarely used middle → identity rename late → legal last.

---

## Surface map (one job each)

| Surface | Job | Not responsible for |
|---------|-----|---------------------|
| **Splash** | Quiet launch mark; dissolve when ready | Settings, onboarding data |
| **Cover leaf** | Personal book identity + open gesture | App settings |
| **Book leaves** | Read recipes, chapters, For You (when lens on) | Shopping, profiles CRUD |
| **Top bar** | Global wayfinding + mode/profile affordances | Deep editing |
| **Appearance panel** | Skin, tab style, reading mode (portal over desk) | Data export, legal |
| **Search (⌘K)** | Find recipes + ★ rating filters + quick actions | Profile setup |
| **Drawers** (favorites, shopping, planner, import) | One workflow each | Cross-drawer settings |
| **Dresser / Simple onboard** | First-run identity + optional profile/mode | Ongoing profile management |
| **NameGate** | Rename only (··· Change book name) | First-run ceremony |
| **Profiles drawer** | Create / edit / delete / switch eaters | Mode preset definitions |
| **Mode chooser** | Lens preset (Reader, Plate, Mother, …) | Biometric entry |
| **Calendar / Pantry** | Diary rings + inventory / budget | Recipe authoring |
| **About modal** | Version, privacy, export, wipe | Appearance tweaks |

---

## ··· overflow menu (v2.4.5 — matches code)

| Order | Item | Why |
|-------|------|-----|
| 1–2 | Favorites · Theme *(phone only)* | Daily / appearance when not in top bar |
| 3 | Page sound | General preference |
| 4 | Shopping list | Core weekly tool |
| 5 | This week’s meals | Core weekly tool |
| 6 | Profiles | Lens setup |
| 7 | Mode | Lens setup |
| 8 | Calendar | Lens tool |
| 9 | Pantry & budget | Lens tool |
| 10 | Import WhatsApp recipe | Authoring |
| 11 | Change book name | Identity (rare) |
| 12 | About & data | Legal / privacy **last** |

**Why rename is late:** first-timers need shopping/planner faster than renaming; About stays bottom for destructive wipe discoverability without accidental taps mid-list.

---

## Onboarding split

| Path | When | Surface |
|------|------|---------|
| **Dresser** | Default (motion OK; or `cookcap-force-dresser`) | 3D drawers + reveal |
| **Simple** | `prefers-reduced-motion` or ≤4 cores | Calm cards |
| **Rename** | Owner already set | Compact `NameGate` |

Skip / Set up later → unnamed edition (**Our Family Cookbook**).

---

## Discoverability (≤2 taps)

| Need | Path |
|------|------|
| Find a recipe | Search icon or ⌘K |
| Flip pages | Footer / keys / drag |
| Chapters | Paper tabs or footer Tabs (phone) |
| Shopping | ··· → Shopping |
| Appearance | Top-bar Appearance |
| Export / wipe | ··· → About & data |

---

## Non-goals

No second “set up profile” home. No dashboard chrome. No accounts. Reader stays pure book.

---

*Update this file whenever ··· order or surface ownership changes.*
