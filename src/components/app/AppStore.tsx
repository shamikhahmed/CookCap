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
import { resolveEdition, listEditions, type Edition } from '@/lib/edition';
import { buildLeaves, type Leaf } from '@/lib/book/pages';
import type { Recipe } from '@/lib/recipes/types';

type Theme = 'light' | 'dark' | 'system';

const DEFAULT_EDITION = listEditions()[0]!;

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  recent: string[];
  markViewed: (id: string) => void;
  ready: boolean;
  /** True after client resolves edition from localStorage — cover waits on this. */
  editionReady: boolean;
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
}

const Ctx = createContext<AppState | null>(null);

const THEME_KEY = 'jia-theme';
const SOUND_KEY = 'jia-sound';

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
  const [edition, setEdition] = useState<Edition>(DEFAULT_EDITION);
  const [editionReady, setEditionReady] = useState(false);
  const [customs, setCustoms] = useState<Recipe[]>([]);
  const [shoppingCount, setShoppingCount] = useState(0);

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem(THEME_KEY) as Theme) ||
      (localStorage.getItem('grimoire-theme') as Theme) ||
      'system';
    setThemeState(savedTheme);
    applyTheme(savedTheme);
    setSoundOnState(localStorage.getItem(SOUND_KEY) === '1');
    localStorage.removeItem('jia-spread');
    setEdition(resolveEdition());
    setEditionReady(true);

    Promise.all([
      store.getFavorites(),
      store.getRecentlyViewed(),
      store.getCustomRecipes(),
      store.getShopping(),
    ])
      .then(([f, r, c, shop]) => {
        setFavorites(new Set(f));
        setRecent(r);
        setCustoms(c);
        setShoppingCount(shop.filter((s) => !s.checked).length);
      })
      .catch(() => void 0)
      .finally(() => setReady(true));
  }, []);

  const catalog = useMemo(() => buildLeaves(customs), [customs]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  }, []);

  const setSoundOn = useCallback((v: boolean) => {
    setSoundOnState(v);
    localStorage.setItem(SOUND_KEY, v ? '1' : '0');
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
    setCustoms((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const refreshShoppingCount = useCallback(() => {
    store
      .getShopping()
      .then((shop) => setShoppingCount(shop.filter((s) => !s.checked).length))
      .catch(() => void 0);
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
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within <AppStore>');
  return ctx;
}
