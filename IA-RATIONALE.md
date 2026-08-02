# CookCap v2.2.0 — Information Architecture Rationale

**Principle:** every surface has exactly one job. No duplicate homes for the same task.

---

## Surface map (one job each)

| Surface | Job | Not responsible for |
|---------|-----|---------------------|
| **Splash** | Quiet launch mark; dissolve when ready | Settings, onboarding data |
| **Cover leaf** | Personal book identity + open gesture | App settings |
| **Book leaves** | Read recipes, chapters, For You (when lens on) | Shopping, profiles CRUD |
| **Top bar** | Global wayfinding + mode/profile affordances | Deep editing |
| **Appearance panel** | Skin, tab style, reading mode | Data export, legal |
| **Search (⌘K)** | Find recipes + quick actions | Profile setup |
| **Drawers** (favorites, shopping, planner, import) | One workflow each | Cross-drawer settings |
| **NameGate** | First-run identity + optional profile/mode | Ongoing profile management |
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
| 10 | Import WhatsApp recipe | Advanced |
| 11 | Change book name | Identity |
| 12 | **About CookCap** *(bottom)* | About & Legal |

### About modal (bottom of stack)

1. Version + tagline
2. **Privacy** statement (stays on device)
3. **Licenses**
4. **Privacy & data** — export JSON · delete all (confirm)

### Appearance panel sections

1. Theme (4 skins)
2. Chapter tabs (4 styles)
3. Reading (Flip / Fast) + accessibility note: *"Flip keeps page-turn hops. Fast jumps chapters instantly."*

No duplicate profile setup: **NameGate** handles first-run optional profile; ongoing edits live only in **Profiles drawer**. Mode presets live only in **Mode chooser**.

---

## Core tools ≤2 taps

| Tool | Path | Taps |
|------|------|------|
| Search | Top bar | 1 |
| Appearance | Top bar palette | 1 |
| Favorites | Top bar *(desktop)* or ··· *(phone)* | 1–2 |
| Shopping | ··· | 2 |
| Meal planner | ··· | 2 |
| Profiles | Top avatar *(non-reader)* or ··· | 1–2 |
| Mode | Top badge or ··· | 1–2 |
| Calendar | ··· | 2 |

Audit rule: anything used daily stays in top bar or first ··· block; import and rename sink lower.

---

## Progressive disclosure

- **Common path:** open book → flip → cook. Zero setup required (Reader mode).
- **Lens path:** pick mode → optional profile → For You / badges / log appear additively.
- **Advanced:** import, export, wipe — behind ··· → About or Import modal.
- **Mother mode note:** "Cooking-for list lives in Profiles" — inline hint, not a second profiles screen.

---

## Anti-patterns avoided

- No second "set up your profile" home outside NameGate + Profiles drawer
- No settings dashboard replacing the book as first viewport
- No telemetry or account surfaces (local/public product)
- Health/macros always labeled estimates unless `macrosVerified`

---

*IA locked for v2.2.0 ship. Changes require updating this doc + `USER_GUIDE.md`.*
