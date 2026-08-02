'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as store from '@/lib/db/store';
import {
  defaultEdition,
  resolveEdition,
  writeStoredOwner,
  type Edition,
} from '@/lib/edition';
import { buildLeaves, type Leaf } from '@/lib/book/pages';
import type { Recipe } from '@/lib/recipes/types';
import type {
  DiaryEntry,
  ModeId,
  PantryItem,
  Profile,
  MealSlot,
} from '@/lib/profiles/types';
import { newId } from '@/lib/profiles/types';

type Theme = 'light' | 'dark' | 'system';
type Currency = 'PKR' | 'USD' | 'GBP';

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  recent: string[];
  markViewed: (id: string) => void;
  ready: boolean;
  editionReady: boolean;
  needsName: boolean;
  setOwnerName: (name: string) => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
  edition: Edition;
  customs: Recipe[];
  addCustom: (r: Recipe) => Promise<void>;
  updateCustom: (r: Recipe) => Promise<void>;
  removeCustom: (id: string) => Promise<void>;
  leaves: Leaf[];
  chapterStart: Record<string, number>;
  allRecipes: Recipe[];
  recipeMap: Record<string, Recipe>;
  shoppingCount: number;
  refreshShoppingCount: () => void;
  /* CookCap lenses */
  mode: ModeId;
  setMode: (m: ModeId) => void;
  profiles: Profile[];
  activeProfile: Profile | null;
  setActiveProfileId: (id: string | null) => void;
  cookingForIds: string[];
  setCookingForIds: (ids: string[]) => void;
  upsertProfile: (p: Profile) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  diary: DiaryEntry[];
  logMeal: (entry: {
    recipeId: string;
    profileId: string;
    servings: number;
    meal: MealSlot;
    date: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    healthier?: boolean;
  }) => Promise<void>;
  removeDiaryEntry: (id: string) => Promise<void>;
  pantry: PantryItem[];
  upsertPantry: (item: PantryItem) => Promise<void>;
  removePantry: (id: string) => Promise<void>;
  weeklyBudgetPkr: number;
  setWeeklyBudgetPkr: (n: number) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  healthierOn: boolean;
  setHealthierOn: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

const THEME_KEY = 'cookcap-theme';
const SOUND_KEY = 'cookcap-sound';
const MODE_KEY = 'cookcap-mode';
const ACTIVE_PROFILE_KEY = 'cookcap-active-profile';
const COOKING_FOR_KEY = 'cookcap-cooking-for';
const BUDGET_KEY = 'cookcap-weekly-budget';
const CURRENCY_KEY = 'cookcap-currency';
const HEALTHIER_KEY = 'cookcap-healthier';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function AppStore({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [soundOn, setSoundOnState] = useState(false);
  const [edition, setEdition] = useState<Edition>(defaultEdition);
  const [editionReady, setEditionReady] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [customs, setCustoms] = useState<Recipe[]>([]);
  const [shoppingCount, setShoppingCount] = useState(0);

  const [mode, setModeState] = useState<ModeId>('reader');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [cookingForIds, setCookingForIdsState] = useState<string[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [weeklyBudgetPkr, setWeeklyBudgetState] = useState(5000);
  const [currency, setCurrencyState] = useState<Currency>('PKR');
  const [healthierOn, setHealthierOnState] = useState(false);

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem(THEME_KEY) as Theme) ||
      (localStorage.getItem('jia-theme') as Theme) ||
      (localStorage.getItem('grimoire-theme') as Theme) ||
      'system';
    setThemeState(savedTheme);
    applyTheme(savedTheme);
    setSoundOnState(
      localStorage.getItem(SOUND_KEY) === '1' || localStorage.getItem('jia-sound') === '1',
    );

    const savedMode = localStorage.getItem(MODE_KEY) as ModeId | null;
    if (savedMode) setModeState(savedMode);
    const savedActive = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (savedActive) setActiveProfileIdState(savedActive);
    try {
      const cf = JSON.parse(localStorage.getItem(COOKING_FOR_KEY) || '[]');
      if (Array.isArray(cf)) setCookingForIdsState(cf.filter((x) => typeof x === 'string'));
    } catch {
      /* ignore */
    }
    const bud = Number(localStorage.getItem(BUDGET_KEY));
    if (Number.isFinite(bud) && bud > 0) setWeeklyBudgetState(bud);
    const cur = localStorage.getItem(CURRENCY_KEY) as Currency | null;
    if (cur === 'PKR' || cur === 'USD' || cur === 'GBP') setCurrencyState(cur);
    setHealthierOnState(localStorage.getItem(HEALTHIER_KEY) === '1');

    const resolved = resolveEdition();
    if (resolved) {
      setEdition(resolved);
      setNeedsName(false);
    } else {
      setNeedsName(true);
    }
    setEditionReady(true);

    Promise.all([
      store.getFavorites(),
      store.getRecentlyViewed(),
      store.getCustomRecipes(),
      store.getShopping(),
      store.listProfiles(),
      store.listDiary(),
      store.listPantry(),
    ])
      .then(([f, r, c, shop, profs, diaryRows, pantryRows]) => {
        setFavorites(new Set(f));
        setRecent(r);
        setCustoms(c);
        setShoppingCount(shop.filter((s) => !s.checked).length);
        setProfiles(profs);
        setDiary(diaryRows);
        setPantry(pantryRows);
        if (!savedActive && profs[0]) setActiveProfileIdState(profs[0].id);
      })
      .catch(() => void 0)
      .finally(() => setReady(true));
  }, []);

  const catalog = useMemo(() => buildLeaves(customs, mode !== 'reader'), [customs, mode]);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId],
  );

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  }, []);

  const setSoundOn = useCallback((v: boolean) => {
    setSoundOnState(v);
    localStorage.setItem(SOUND_KEY, v ? '1' : '0');
  }, []);

  const setOwnerName = useCallback((name: string) => {
    const next = writeStoredOwner(name);
    setEdition(next);
    setNeedsName(false);
  }, []);

  const setMode = useCallback((m: ModeId) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
  }, []);

  const setActiveProfileId = useCallback((id: string | null) => {
    setActiveProfileIdState(id);
    if (id) localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    else localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }, []);

  const setCookingForIds = useCallback((ids: string[]) => {
    setCookingForIdsState(ids);
    localStorage.setItem(COOKING_FOR_KEY, JSON.stringify(ids));
  }, []);

  const setWeeklyBudgetPkr = useCallback((n: number) => {
    setWeeklyBudgetState(n);
    localStorage.setItem(BUDGET_KEY, String(n));
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(CURRENCY_KEY, c);
  }, []);

  const setHealthierOn = useCallback((v: boolean) => {
    setHealthierOnState(v);
    localStorage.setItem(HEALTHIER_KEY, v ? '1' : '0');
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    store.toggleFavorite(id).catch(() => void 0);
  }, []);

  const markViewed = useCallback((id: string) => {
    store.recordView(id).catch(() => void 0);
    setRecent((prev) => [id, ...prev.filter((r) => r !== id)].slice(0, 12));
  }, []);

  const addCustom = useCallback(async (r: Recipe) => {
    await store.saveCustomRecipe(r);
    setCustoms((prev) => [...prev.filter((x) => x.id !== r.id), r]);
  }, []);

  const updateCustom = useCallback(async (r: Recipe) => {
    await store.saveCustomRecipe(r);
    setCustoms((prev) => prev.map((x) => (x.id === r.id ? r : x)));
  }, []);

  const removeCustom = useCallback(async (id: string) => {
    await store.deleteCustomRecipe(id);
    setCustoms((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const refreshShoppingCount = useCallback(() => {
    store
      .getShopping()
      .then((shop) => setShoppingCount(shop.filter((s) => !s.checked).length))
      .catch(() => void 0);
  }, []);

  const upsertProfile = useCallback(async (p: Profile) => {
    await store.putProfile(p);
    setProfiles((prev) => {
      const i = prev.findIndex((x) => x.id === p.id);
      if (i < 0) return [...prev, p];
      const next = [...prev];
      next[i] = p;
      return next;
    });
    setActiveProfileIdState((cur) => cur ?? p.id);
  }, []);

  const removeProfile = useCallback(async (id: string) => {
    await store.deleteProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setCookingForIdsState((prev) => prev.filter((x) => x !== id));
    setActiveProfileIdState((cur) => (cur === id ? null : cur));
  }, []);

  const logMeal = useCallback(
    async (entry: {
      recipeId: string;
      profileId: string;
      servings: number;
      meal: MealSlot;
      date: string;
      kcal: number;
      protein: number;
      carbs: number;
      fat: number;
      healthier?: boolean;
    }) => {
      const row: DiaryEntry = { id: newId('log'), ...entry };
      await store.putDiary(row);
      setDiary((prev) => [...prev, row]);
    },
    [],
  );

  const removeDiaryEntry = useCallback(async (id: string) => {
    await store.deleteDiary(id);
    setDiary((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const upsertPantry = useCallback(async (item: PantryItem) => {
    await store.putPantry(item);
    setPantry((prev) => {
      const i = prev.findIndex((x) => x.id === item.id);
      if (i < 0) return [...prev, item];
      const next = [...prev];
      next[i] = item;
      return next;
    });
  }, []);

  const removePantry = useCallback(async (id: string) => {
    await store.deletePantry(id);
    setPantry((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      theme,
      setTheme,
      favorites,
      isFavorite: (id) => favorites.has(id),
      toggleFavorite,
      recent,
      markViewed,
      ready,
      editionReady,
      needsName,
      setOwnerName,
      soundOn,
      setSoundOn,
      edition,
      customs,
      addCustom,
      updateCustom,
      removeCustom,
      leaves: catalog.leaves,
      chapterStart: catalog.chapterStart,
      allRecipes: catalog.allRecipes,
      recipeMap: catalog.recipeMap,
      shoppingCount,
      refreshShoppingCount,
      mode,
      setMode,
      profiles,
      activeProfile,
      setActiveProfileId,
      cookingForIds,
      setCookingForIds,
      upsertProfile,
      removeProfile,
      diary,
      logMeal,
      removeDiaryEntry,
      pantry,
      upsertPantry,
      removePantry,
      weeklyBudgetPkr,
      setWeeklyBudgetPkr,
      currency,
      setCurrency,
      healthierOn,
      setHealthierOn,
    }),
    [
      theme,
      setTheme,
      favorites,
      toggleFavorite,
      recent,
      markViewed,
      ready,
      editionReady,
      needsName,
      setOwnerName,
      soundOn,
      setSoundOn,
      edition,
      customs,
      addCustom,
      updateCustom,
      removeCustom,
      catalog,
      shoppingCount,
      refreshShoppingCount,
      mode,
      setMode,
      profiles,
      activeProfile,
      setActiveProfileId,
      cookingForIds,
      setCookingForIds,
      upsertProfile,
      removeProfile,
      diary,
      logMeal,
      removeDiaryEntry,
      pantry,
      upsertPantry,
      removePantry,
      weeklyBudgetPkr,
      setWeeklyBudgetPkr,
      currency,
      setCurrency,
      healthierOn,
      setHealthierOn,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within <AppStore>');
  return ctx;
}
