# CookCap — Perfection v3 INVENTORY
Seeded from CURSOR-PERFECTION-LOOP.md §13.14 + code (`Shell`, leaves, drawers).  
**Route model:** single-route Next export (`/CookCap/`); navigation is leaf index inside the book.

## Screens / leaves
| ID | Surface | Entry | Notes |
|---|---|---|---|
| S-splash | Splash | auto | Dissolves when store ready |
| S-namegate | NameGate | first-run / rename | Steps: welcome · name · profile · mode |
| S-onboard-simple | OnboardingFlow | first-run (RM / low-CPU) | Flat card flow |
| S-onboard-dresser | DresserOnboarding | first-run (default) | 3D dresser |
| S-cover | CoverLeaf | leaf 0 | Leather cover, photo, tap open |
| S-title | TitleLeaf | after cover | Personalized title page |
| S-friends | FriendsLeaf | before contents | Kitchen friends |
| S-contents | ContentsLeaf | TOC | Ideas (client-only), occasions, chapters |
| S-chapter | ChapterLeaf | per chapter | Chapter opener |
| S-foryou | ForYouLeaf | mode ≠ reader | Goal-fit shelf |
| S-recipe | RecipeLeaf | per recipe | Servings, nutrition, cooking CTA |
| S-cooking | CookingMode | from recipe | Step timer, wake lock |
| S-search | SearchOverlay | ⌘K / header | Filters + recent |
| S-favorites | FavoritesDrawer | header | Favs, history, collections |
| S-shop | ShoppingDrawer | header / cart | Checklist |
| S-plan | MealPlannerDrawer | more menu | Week slots |
| S-import | ImportModal | more / share-target | WhatsApp / text import |
| S-profiles | ProfilesDrawer | mode chrome | Profiles, diary, goals |
| S-mode | ModeChooser | mode button | Reader / plate / mother / … |
| S-calendar | CalendarDrawer | more | Month + streak |
| S-pantry | PantryDrawer | more | Pantry items |
| S-appearance | Appearance panel | palette | Skin, tabs, read mode, locale |
| S-about | AboutModal | more | Version, backup, guest PIN |
| S-whatsnew | WhatsNewSheet | version bump | Corner toast |
| S-install | InstallBanner | PWA | iOS tip / BIP |
| S-offline | OfflineChip | offline | Status chip |
| S-swupdate | SwUpdateToast | SW update | Reload CTA |
| S-guest | Guest banner | guest PIN active | Readonly banner |

## Forms (fields)
| Form | Fields | Types | Keyboard |
|---|---|---|---|
| Name gate / onboard name | owner name | text, max 40 | given-name |
| Profile create | name, diet, goals, allergens | text, number, chips | default |
| Search | query + filters | search | search |
| Servings | servings | number stepper | — |
| Meal plan | day × slot recipe | picker | — |
| Shopping add | item text, check | text, checkbox | — |
| Import | paste / file | textarea, file | — |
| Appearance | skin, tabs, read, locale | radios | — |
| About restore | JSON file, merge flag | file, checkbox | — |
| Guest PIN | PIN ≥4 | password-like text | — |
| Go-to page | page number | number | numeric |
| Cover / recipe photo | image file | file (on-demand) | — |

## Designed states (§7.9)
empty · loading · error · offline · first-run · demo (`?demo=1`) · lots-of-data · guest · storage-error

## Settings / storage keys (non-exhaustive)
`cookcap-theme`, `cookcap-skin`, `cookcap-tabs`, `cookcap-readmode`, `cookcap-locale`, `cookcap-owner`, `cookcap-onboarded`, `cookcap-pos`, `cookcap-sound`, `cookcap-mode`, `cookcap-whats-new`, IDB: favorites, history, notes, customs, shopping, profiles, diary, pantry, heroes, cover

## External links / network
| Dest | Why |
|---|---|
| `privacy.html` (same origin) | Privacy |
| Hub support (linked from About / privacy) | G-4 support |
| Optional: none at runtime for core cook (G-9) | Self-hosted fonts via Next |

## Leaves / architecture cross-check
Code leaves: `CoverLeaf`, `TitleLeaf`, `FriendsLeaf`, `ContentsLeaf`, `ChapterLeaf`, `ForYouLeaf`, `RecipeLeaf` + overlays above. No URL router beyond `/?demo=1&for=&recipe=&open=`.
