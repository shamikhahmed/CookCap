# CookCap v2.2.5 — Information Architecture Rationale

**Principle:** every surface has exactly one job. No duplicate homes for the same task.

---

## Surface map (one job each)

| Surface | Job | Not responsible for |
|---------|-----|---------------------|
| **Splash** | Quiet launch mark; dissolve when ready | Settings, onboarding data |
| **Cover leaf** | Personal book identity + open gesture | App settings |
| **Book leaves** | Read recipes, chapters, For You (when lens on) | Shopping, profiles CRUD |
| **Top bar** | Global wayfinding + mode/profile affordances | Deep editing |
| **Appearance panel** | Skin, tab style, reading mode (portal over desk) | Data export, legal |
| **Search (⌘K)** | Find recipes + quick actions | Profile setup |
| **Drawers** (favorites, shopping, planner, import) | One workflow each | Cross-drawer settings |
| **Dresser / Simple onboard** | First-run identity + optional profile/mode | Ongoing profile management |
| **NameGate** | Rename only (··· Change book name) | First-run ceremony |
| **Profiles drawer** | Create / edit / delete / switch eaters | Mode preset definitions |
| **Mode chooser** | Lens preset (Reader, Plate, Mother, …) | Biometric entry |
| **Calendar / Pantry** | Diary rings + inventory / budget | Recipe authoring |
| **About modal** | Version, privacy, export, delete | Appearance tweaks |

---

## Settings & ··· menu order

Mature ordering: **identity & daily tools at top → appearance → accessibility notes → privacy → legal at bottom.**

### Top bar (always visible, ≤1 tap)

1. **CookCap wordmark + kitchen line** — app brand + `{Name}'s Kitchen` identity
2. **Profile avatar** (when mode ≠ reader) — switch active eater
3. **Mode badge** — switch lens
4. **Search** — find anything
5. **Appearance** — skin / tabs / reading mode
6. **Favorites** (desktop) · **Theme toggle** (when skin supports it)
7. **··· More**

### ··· overflow menu

| Order | Item | Group |
|-------|------|-------|
| 1 | Favorites & history *(phone)* | Identity / daily |
| 2 | Light / dark mode *(phone)* | Appearance |
| 3 | Page sound on/off | General |
| 4 | Shopping list | Core tool |
| 5 | This week's meals | Core tool |
| 6 | Profiles | Lens setup |
| 7 | Mode | Lens setup |
| 8 | Calendar | Lens tool |
| 9 | Pantry & budget | Lens tool |
| 10 | Import recipe | Authoring |
| 11 | Change book name | Identity |
| 12 | About & data | Legal / privacy last |

---

## Onboarding split

| Path | When | Surface |
|------|------|---------|
| **Dresser** | Default (motion OK, cores > 4) | 3D drawers + reveal book |
| **Simple** | `prefers-reduced-motion` or low cores | Full-bleed calm cards |
| **Rename** | Owner already set | Compact `NameGate` only |

Shared state: `useOnboardingSteps` → persist owner + `cookcap-onboarded`. Skip / Set up later → unnamed edition (**Our Family Cookbook**).

---

## Non-goals (do not invent surfaces)

No second "set up your profile" home outside first-run + Profiles drawer. Mode presets live only in Mode chooser. Favorites label is edition-aware — no hard-coded person name in chrome.

---

*IA locked for v2.2.5 ship. Changes require updating this doc + `USER_GUIDE.md`.*
