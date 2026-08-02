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
  meta: { key: string; value: unknown };
}

const DB_NAME = 'jia-cooks';
const DB_VERSION = 3;

let dbp: Promise<IDBPDatabase<CookbookDB>> | null = null;

function db() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB unavailable (server render)');
  }
  if (!dbp) {
    dbp = openDB<CookbookDB>(DB_NAME, DB_VERSION, {
      upgrade(d, oldVersion) {
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
      },
    });
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
export async function scrubOrphanFavorites(keepIds: Set<string>): Promise<string[]> {
  const d = await db();
  const all = await d.getAll('favorites');
  const kept: typeof all = [];
  for (const f of all) {
    if (keepIds.has(f.id) && !f.id.startsWith('mdb-')) {
      kept.push(f);
    } else {
      await d.delete('favorites', f.id);
    }
  }
  return kept.sort((a, b) => b.addedAt - a.addedAt).map((f) => f.id);
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

/* ── Notes ─────────────────────────────────────────────────────────────*/
export async function getNote(id: string): Promise<string> {
  return (await (await db()).get('notes', id))?.text ?? '';
}
export async function saveNote(id: string, text: string): Promise<void> {
  await (await db()).put('notes', { id, text, updatedAt: Date.now() });
}

/* ── Ratings ───────────────────────────────────────────────────────────*/
export async function getRating(id: string): Promise<number> {
  return (await (await db()).get('ratings', id))?.stars ?? 0;
}
export async function setRating(id: string, stars: number): Promise<void> {
  await (await db()).put('ratings', { id, stars });
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

/** Wipe every user store (export/delete in About). Does not delete the DB schema. */
export async function clearAllUserData(): Promise<void> {
  const d = await db();
  const stores = [
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
    'meta',
  ] as const;
  const tx = d.transaction(stores as unknown as Array<(typeof stores)[number]>, 'readwrite');
  await Promise.all(stores.map((name) => tx.objectStore(name).clear()));
  await tx.done;
}

/** Snapshot for JSON export. */
export async function exportUserSnapshot() {
  const d = await db();
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
    mealPlan: await getMeta('meal-plan'),
  };
}
