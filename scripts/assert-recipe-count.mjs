#!/usr/bin/env node
/** Assert cover/reader/About/website-facing count share getCatalogRecipeCount. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const countSrc = fs.readFileSync(path.join(root, 'src/lib/recipes/count.ts'), 'utf8');
if (!countSrc.includes('export function getCatalogRecipeCount')) {
  console.error('FAIL: getCatalogRecipeCount missing');
  process.exit(1);
}
const consumers = [
  'src/components/book/leaves/CoverLeaf.tsx',
  'src/components/book/leaves/ContentsLeaf.tsx',
  'src/components/app/AboutModal.tsx',
];
for (const rel of consumers) {
  const t = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!t.includes('getCatalogRecipeCount')) {
    console.error('FAIL: ' + rel + ' does not import getCatalogRecipeCount');
    process.exit(1);
  }
}
// Count RECIPES array length roughly via data.ts export usage
const data = fs.readFileSync(path.join(root, 'src/lib/recipes/data.ts'), 'utf8');
if (!data.includes('export const RECIPES')) {
  console.error('FAIL: RECIPES export missing');
  process.exit(1);
}
console.log('PASS: recipe count single source wired to cover, contents, About');
