'use client';

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DiaryEntry, PantryItem, Profile } from '@/lib/profiles/types';
import type { Recipe } from '@/lib/recipes/types';

/**
 * Offline-first user data. Favorites, notes, ratings, history, shopping,
 * custom recipes, profiles, diary, and pantry live in IndexedDB — fully
 * usable with no network / no account.
 */

interface CookbookDB extends DBSchema {
  favorites: { key: string; value: { id: string; addedAt: number } };
  history: { key: string; value: { id: string; viewedAt: number }; indexes: { viewedAt: number } };
  notes: { key: string; value: { id: string; text: string; updatedAt: number } };
  ratings: { key: string; value: { id: string; stars: number } };
  collections: {
    key: string;
    value: { id: string; name: string; recipeIds: string[]; createdAt: number };
  };
  shopping: {
    key: string;
    value: { key: string; item: string; qty: string; checked: boolean; recipeId?: string };
  };
  customs: { key: string; value: Recipe };
  profiles: { key: string; value: Profile };
  diary: {
    key: string;
    value: DiaryEntry;
    indexes: { date: string; profileId: string };
  };
  pantry: { key: string; value: PantryItem };
  /** Custom recipe heroes — Blob JPEG, keyed by recipe id. */
  'user-heroes': { key: string; value: { id: string; blob: Blob; updatedAt: number } };
  /** Journal cover photo — single row id `cover`. */
  'cover-image': { key: string; value: { id: string; blob: Blob; updatedAt: number } };
  meta: { key: string; value: unknown };
}

const LEGACY_DB_NAME = 'jia-cooks';
const DB_NAME = 'cookcap';
const DB_VERSION = 4;

const STORE_NAMES = [
  'favorites',
  'history',
  'notes',
  'ratings',
  'collections',
  'shopping',
  'customs',
  'profiles',
  'diary',
  'pantry',
  'user-heroes',
  'cover-image',
  'meta',
] as const;

let dbp: Promise<IDBPDatabase<CookbookDB>> | null = null;
let migrated = false;

function upgradeDb(d: IDBPDatabase<CookbookDB>, oldVersion: number) {
  if (oldVersion < 1) {
    d.createObjectStore('favorites', { keyPath: 'id' });
    const h = d.createObjectStore('history', { keyPath: 'id' });
    h.createIndex('viewedAt', 'viewedAt');
    d.createObjectStore('notes', { keyPath: 'id' });
    d.createObjectStore('ratings', { keyPath: 'id' });
    d.createObjectStore('collections', { keyPath: 'id' });
    d.createObjectStore('shopping', { keyPath: 'key' });
    d.createObjectStore('meta');
  }
  if (oldVersion < 2 && !d.objectStoreNames.contains('customs')) {
    d.createObjectStore('customs', { keyPath: 'id' });
  }
  if (oldVersion < 3) {
    if (!d.objectStoreNames.contains('profiles')) {
      d.createObjectStore('profiles', { keyPath: 'id' });
    }
    if (!d.objectStoreNames.contains('diary')) {
      const diary = d.createObjectStore('diary', { keyPath: 'id' });
      diary.createIndex('date', 'date');
      diary.createIndex('profileId', 'profileId');
    }
    if (!d.objectStoreNames.contains('pantry')) {
      d.createObjectStore('pantry', { keyPath: 'id' });
    }
  }
  if (oldVersion < 4) {
    if (!d.objectStoreNames.contains('user-heroes')) {
      d.createObjectStore('user-heroes', { keyPath: 'id' });
    }
    if (!d.objectStoreNames.contains('cover-image')) {
      d.createObjectStore('cover-image', { keyPath: 'id' });
    }
  }
}

async function legacyDbExists(): Promise<boolean> {
  if (typeof indexedDB.databases === 'function') {
    try {
      const list = await indexedDB.databases();
      return list.some((x) => x.name === LEGACY_DB_NAME);
    } catch {
      /* fall through */
    }
  }
  return new Promise((resolve) => {
    const req = indexedDB.open(LEGACY_DB_NAME);
    req.onsuccess = () => {
      const d = req.result;
      const has = d.objectStoreNames.length > 0;
      d.close();
      resolve(has);
    };
    req.onerror = () => resolve(false);
    req.onupgradeneeded = () => {
      /* empty legacy — abort create */
      req.transaction?.abort();
      resolve(false);
    };
  });
}

async function copyLegacyInto(target: IDBPDatabase<CookbookDB>): Promise<boolean> {
  let legacy: IDBPDatabase<CookbookDB>;
  try {
    legacy = await openDB<CookbookDB>(LEGACY_DB_NAME, DB_VERSION, {
      upgrade(d, oldVersion) {
        upgradeDb(d, oldVersion);
      },
    });
  } catch {
    return false;
  }

  let copied = false;
  try {
    for (const name of STORE_NAMES) {
      if (name === 'meta') continue;
      if (!legacy.objectStoreNames.contains(name)) continue;
      if (!target.objectStoreNames.contains(name)) continue;
      const rows = await legacy.getAll(name);
      if (rows.length === 0) continue;
      const tx = target.transaction(name, 'readwrite');
      for (const row of rows) {
        await tx.store.put(row as never);
      }
      await tx.done;
      copied = true;
    }
    if (legacy.objectStoreNames.contains('meta')) {
      const keys = await legacy.getAllKeys('meta');
      for (const key of keys) {
        const val = await legacy.get('meta', key);
        await target.put('meta', val, key);
        copied = true;
      }
    }
  } finally {
    legacy.close();
  }
  return copied;
}

async function cookcapIsEmpty(d: IDBPDatabase<CookbookDB>): Promise<boolean> {
  for (const name of ['favorites', 'customs', 'profiles', 'notes'] as const) {
    if (!d.objectStoreNames.contains(name)) continue;
    const n = await d.count(name);
    if (n > 0) return false;
  }
  return true;
}

function db() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB unavailable (server render)');
  }
  if (!dbp) {
    dbp = (async () => {
      const d = await openDB<CookbookDB>(DB_NAME, DB_VERSION, {
        upgrade(database, oldVersion) {
          upgradeDb(database, oldVersion);
        },
      });
      if (!migrated) {
        migrated = true;
        try {
          if ((await cookcapIsEmpty(d)) && (await legacyDbExists())) {
            await copyLegacyInto(d);
          }
        } catch (e) {
          console.warn('[CookCap] Legacy IDB migrate skipped:', e);
        }
      }
      return d;
    })();
  }
  return dbp;
}

/* ── Favorites ─────────────────────────────────────────────────────────*/
export async function getFavorites(): Promise<string[]> {
  const all = await (await db()).getAll('favorites');
  return all.sort((a, b) => b.addedAt - a.addedAt).map((f) => f.id);
}
export async function toggleFavorite(id: string): Promise<boolean> {
  const d = await db();
  const existing = await d.get('favorites', id);
  if (existing) {
    await d.delete('favorites', id);
    return false;
  }
  await d.put('favorites', { id, addedAt: Date.now() });
  return true;
}
function isOrphanId(id: string, keepIds: Set<string>): boolean {
  return !keepIds.has(id) || id.startsWith('mdb-');
}

export async function scrubOrphanUserData(
  keepIds: Set<string>,
): Promise<{ favorites: string[]; recent: string[] }> {
  const d = await db();

  const allFavorites = await d.getAll('favorites');
  const keptFavorites: typeof allFavorites = [];
  for (const f of allFavorites) {
    if (isOrphanId(f.id, keepIds)) {
      await d.delete('favorites', f.id);
    } else {
      keptFavorites.push(f);
    }
  }

  const allHistory = await d.getAll('history');
  const keptHistory: typeof allHistory = [];
  for (const h of allHistory) {
    if (isOrphanId(h.id, keepIds)) {
      await d.delete('history', h.id);
    } else {
      keptHistory.push(h);
    }
  }

  for (const row of await d.getAll('ratings')) {
    if (isOrphanId(row.id, keepIds)) await d.delete('ratings', row.id);
  }

  for (const row of await d.getAll('notes')) {
    if (isOrphanId(row.id, keepIds)) await d.delete('notes', row.id);
  }

  type MealPlan = Partial<Record<string, string>>;
  const plan = await getMeta<MealPlan>('meal-plan');
  if (plan) {
    let changed = false;
    const cleaned: MealPlan = { ...plan };
    for (const [day, id] of Object.entries(plan)) {
      if (id && isOrphanId(id, keepIds)) {
        delete cleaned[day as keyof MealPlan];
        changed = true;
      }
    }
    if (changed) await putMeta('meal-plan', cleaned);
  }

  const favorites = keptFavorites.sort((a, b) => b.addedAt - a.addedAt).map((f) => f.id);
  const recent = keptHistory
    .sort((a, b) => b.viewedAt - a.viewedAt)
    .slice(0, 12)
    .map((h) => h.id);

  return { favorites, recent };
}

export async function scrubOrphanFavorites(keepIds: Set<string>): Promise<string[]> {
  const { favorites } = await scrubOrphanUserData(keepIds);
  return favorites;
}

/* ── History ───────────────────────────────────────────────────────────*/
export async function recordView(id: string): Promise<void> {
  await (await db()).put('history', { id, viewedAt: Date.now() });
}
export async function getRecentlyViewed(limit = 12): Promise<string[]> {
  const all = await (await db()).getAll('history');
  return all
    .sort((a, b) => b.viewedAt - a.viewedAt)
    .slice(0, limit)
    .map((h) => h.id);
}
export async function deleteHistory(id: string): Promise<void> {
  await (await db()).delete('history', id);
}

/* ── Notes ─────────────────────────────────────────────────────────────*/
export async function getNote(id: string): Promise<string> {
  return (await (await db()).get('notes', id))?.text ?? '';
}
export async function saveNote(id: string, text: string): Promise<void> {
  await (await db()).put('notes', { id, text, updatedAt: Date.now() });
}
export async function deleteNote(id: string): Promise<void> {
  await (await db()).delete('notes', id);
}

/* ── Ratings ───────────────────────────────────────────────────────────*/
export async function getRating(id: string): Promise<number> {
  return (await (await db()).get('ratings', id))?.stars ?? 0;
}
export async function setRating(id: string, stars: number): Promise<void> {
  await (await db()).put('ratings', { id, stars });
}
export async function deleteRating(id: string): Promise<void> {
  await (await db()).delete('ratings', id);
}
/** id → 1–5 stars. Unrated recipes omitted. */
export async function getAllRatings(): Promise<Record<string, number>> {
  const rows = await (await db()).getAll('ratings');
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (r.stars >= 1 && r.stars <= 5) out[r.id] = r.stars;
  }
  return out;
}

/* ── Collections ───────────────────────────────────────────────────────*/
export async function getCollections() {
  return (await db()).getAll('collections');
}
export async function upsertCollection(c: CookbookDB['collections']['value']) {
  await (await db()).put('collections', c);
}
export async function deleteCollection(id: string) {
  await (await db()).delete('collections', id);
}

/* ── Shopping list ─────────────────────────────────────────────────────*/
export async function getShopping() {
  return (await db()).getAll('shopping');
}
export async function putShopping(row: CookbookDB['shopping']['value']) {
  await (await db()).put('shopping', row);
}
export async function clearCheckedShopping() {
  const d = await db();
  const all = await d.getAll('shopping');
  await Promise.all(all.filter((r) => r.checked).map((r) => d.delete('shopping', r.key)));
}
export async function clearAllShopping() {
  const d = await db();
  const all = await d.getAll('shopping');
  await Promise.all(all.map((r) => d.delete('shopping', r.key)));
}
export async function deleteShoppingForRecipe(recipeId: string): Promise<void> {
  const d = await db();
  const all = await d.getAll('shopping');
  await Promise.all(
    all.filter((r) => r.recipeId === recipeId).map((r) => d.delete('shopping', r.key)),
  );
}
export async function addIngredientsToShopping(
  recipeId: string,
  items: { item: string; qty: string }[],
) {
  const d = await db();
  const all = await d.getAll('shopping');
  for (const it of items) {
    const name = it.item.trim();
    if (!name) continue;
    const norm = name.toLowerCase();
    const existing = all.find((r) => r.item.toLowerCase() === norm);
    if (existing) {
      const qty =
        existing.qty && it.qty && existing.qty !== it.qty
          ? `${existing.qty} + ${it.qty}`
          : existing.qty || it.qty;
      const next = { ...existing, qty, checked: false };
      await d.put('shopping', next);
      Object.assign(existing, next);
      continue;
    }
    const key = `${recipeId}::${norm}`;
    const row = { key, item: name, qty: it.qty, checked: false, recipeId };
    await d.put('shopping', row);
    all.push(row);
  }
}

/* ── Meta (meal plan, etc.) ────────────────────────────────────────────*/
export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('meta', key)) as T | undefined;
}
export async function putMeta(key: string, value: unknown): Promise<void> {
  await (await db()).put('meta', value, key);
}

type MealPlanDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
type MealPlan = Partial<Record<MealPlanDay, string>>;

export async function removeRecipeFromMealPlan(id: string): Promise<void> {
  const plan = await getMeta<MealPlan>('meal-plan');
  if (!plan) return;
  let changed = false;
  const next: MealPlan = { ...plan };
  for (const [day, recipeId] of Object.entries(plan)) {
    if (recipeId === id) {
      delete next[day as MealPlanDay];
      changed = true;
    }
  }
  if (changed) await putMeta('meal-plan', next);
}

/* ── Custom / imported recipes ─────────────────────────────────────────*/
export async function getCustomRecipes(): Promise<Recipe[]> {
  return (await db()).getAll('customs');
}
export async function saveCustomRecipe(r: Recipe): Promise<void> {
  await (await db()).put('customs', r);
}
export async function deleteCustomRecipe(id: string): Promise<void> {
  await (await db()).delete('customs', id);
}

/* ── Profiles ──────────────────────────────────────────────────────────*/
export async function listProfiles(): Promise<Profile[]> {
  return (await db()).getAll('profiles');
}
export async function putProfile(p: Profile): Promise<void> {
  await (await db()).put('profiles', p);
}
export async function deleteProfile(id: string): Promise<void> {
  await (await db()).delete('profiles', id);
}

/* ── Diary ─────────────────────────────────────────────────────────────*/
export async function listDiary(): Promise<DiaryEntry[]> {
  return (await db()).getAll('diary');
}
export async function putDiary(entry: DiaryEntry): Promise<void> {
  await (await db()).put('diary', entry);
}
export async function deleteDiary(id: string): Promise<void> {
  await (await db()).delete('diary', id);
}
export async function deleteDiaryForProfile(profileId: string): Promise<void> {
  const d = await db();
  const all = await d.getAll('diary');
  await Promise.all(
    all.filter((e) => e.profileId === profileId).map((e) => d.delete('diary', e.id)),
  );
}
export async function diaryByDate(date: string): Promise<DiaryEntry[]> {
  return (await db()).getAllFromIndex('diary', 'date', date);
}

/* ── Pantry ────────────────────────────────────────────────────────────*/
export async function listPantry(): Promise<PantryItem[]> {
  return (await db()).getAll('pantry');
}
export async function putPantry(item: PantryItem): Promise<void> {
  await (await db()).put('pantry', item);
}
export async function deletePantry(id: string): Promise<void> {
  await (await db()).delete('pantry', id);
}

/* ── User heroes (custom photos) ───────────────────────────────────────*/
export async function listUserHeroes(): Promise<{ id: string; blob: Blob; updatedAt: number }[]> {
  return (await db()).getAll('user-heroes');
}
export async function getUserHero(id: string): Promise<Blob | undefined> {
  return (await (await db()).get('user-heroes', id))?.blob;
}
export async function putUserHero(id: string, blob: Blob): Promise<void> {
  await (await db()).put('user-heroes', { id, blob, updatedAt: Date.now() });
}
export async function deleteUserHero(id: string): Promise<void> {
  await (await db()).delete('user-heroes', id);
}

/* ── Cover photo ───────────────────────────────────────────────────────*/
const COVER_ID = 'cover';
export async function getCoverImage(): Promise<Blob | undefined> {
  return (await (await db()).get('cover-image', COVER_ID))?.blob;
}
export async function putCoverImage(blob: Blob): Promise<void> {
  await (await db()).put('cover-image', { id: COVER_ID, blob, updatedAt: Date.now() });
}
export async function deleteCoverImage(): Promise<void> {
  await (await db()).delete('cover-image', COVER_ID);
}

/** Wipe every user store (export/delete in About). Does not delete the DB schema. */
export async function clearAllUserData(): Promise<void> {
  const d = await db();
  const tx = d.transaction([...STORE_NAMES], 'readwrite');
  await Promise.all(STORE_NAMES.map((name) => tx.objectStore(name).clear()));
  await tx.done;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/** Snapshot for JSON export (blobs as base64). */
export async function exportUserSnapshot() {
  const d = await db();
  const heroes = await d.getAll('user-heroes');
  const covers = await d.getAll('cover-image');
  return {
    favorites: await d.getAll('favorites'),
    history: await d.getAll('history'),
    notes: await d.getAll('notes'),
    ratings: await d.getAll('ratings'),
    collections: await d.getAll('collections'),
    shopping: await d.getAll('shopping'),
    customs: await d.getAll('customs'),
    profiles: await d.getAll('profiles'),
    diary: await d.getAll('diary'),
    pantry: await d.getAll('pantry'),
    userHeroes: await Promise.all(
      heroes.map(async (h) => ({
        id: h.id,
        mime: h.blob.type || 'image/jpeg',
        dataBase64: await blobToBase64(h.blob),
        updatedAt: h.updatedAt,
      })),
    ),
    coverImage: await Promise.all(
      covers.map(async (c) => ({
        id: c.id,
        mime: c.blob.type || 'image/jpeg',
        dataBase64: await blobToBase64(c.blob),
        updatedAt: c.updatedAt,
      })),
    ),
    mealPlan: await getMeta('meal-plan'),
  };
}

function base64ToBlob(dataBase64: string, mime: string): Blob {
  const bin = atob(dataBase64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime || 'image/jpeg' });
}

export type UserSnapshot = Awaited<ReturnType<typeof exportUserSnapshot>> & {
  localStorage?: Record<string, string | null>;
  app?: string;
  version?: string;
};

/** Restore from export JSON. `mode: 'replace'` wipes first; `merge` upserts. */
export async function importUserSnapshot(
  payload: UserSnapshot,
  mode: 'replace' | 'merge' = 'replace',
): Promise<void> {
  const d = await db();
  if (mode === 'replace') await clearAllUserData();

  const putAll = async <T>(storeName: (typeof STORE_NAMES)[number], rows: T[] | undefined) => {
    if (!rows?.length) return;
    const tx = d.transaction(storeName, 'readwrite');
    for (const row of rows) await tx.store.put(row as never);
    await tx.done;
  };

  await putAll('favorites', payload.favorites);
  await putAll('history', payload.history);
  await putAll('notes', payload.notes);
  await putAll('ratings', payload.ratings);
  await putAll('collections', payload.collections);
  await putAll('shopping', payload.shopping);
  await putAll('customs', payload.customs);
  await putAll('profiles', payload.profiles);
  await putAll('diary', payload.diary);
  await putAll('pantry', payload.pantry);

  if (payload.userHeroes?.length) {
    const tx = d.transaction('user-heroes', 'readwrite');
    for (const h of payload.userHeroes) {
      if (!h?.id || !h.dataBase64) continue;
      await tx.store.put({
        id: h.id,
        blob: base64ToBlob(h.dataBase64, h.mime),
        updatedAt: h.updatedAt ?? Date.now(),
      });
    }
    await tx.done;
  }
  if (payload.coverImage?.length) {
    const tx = d.transaction('cover-image', 'readwrite');
    for (const c of payload.coverImage) {
      if (!c?.id || !c.dataBase64) continue;
      await tx.store.put({
        id: c.id,
        blob: base64ToBlob(c.dataBase64, c.mime),
        updatedAt: c.updatedAt ?? Date.now(),
      });
    }
    await tx.done;
  }
  if (payload.mealPlan != null) await putMeta('meal-plan', payload.mealPlan);

  if (payload.localStorage && typeof localStorage !== 'undefined') {
    for (const [k, v] of Object.entries(payload.localStorage)) {
      if (!k.startsWith('cookcap-') && !k.startsWith('jia-') && !k.startsWith('grimoire-')) continue;
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    }
  }

  try {
    new BroadcastChannel('cookcap-data').postMessage({ type: 'restored' });
  } catch {
    /* ignore */
  }
}

export async function getLocalStats() {
  const d = await db();
  return {
    favorites: await d.count('favorites'),
    customs: await d.count('customs'),
    notes: await d.count('notes'),
    ratings: await d.count('ratings'),
    collections: await d.count('collections'),
    diary: await d.count('diary'),
    pantry: await d.count('pantry'),
    shopping: await d.count('shopping'),
    heroes: await d.count('user-heroes'),
    hasCover: (await d.count('cover-image')) > 0,
    dbName: DB_NAME,
  };
}

