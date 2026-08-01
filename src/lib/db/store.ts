'use client';

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Recipe } from '@/lib/recipes/types';

/**
 * Offline-first user data. Favorites, notes, ratings, history, shopping, and
 * custom recipes live in IndexedDB — fully usable with no network / no account.
 * `collections` store exists for a future curated-lists UI (API unused in UI).
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
  meta: { key: string; value: unknown };
}

const DB_NAME = 'jia-cooks';
const DB_VERSION = 2;

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
      // Merge quantities when the same ingredient lands twice.
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
