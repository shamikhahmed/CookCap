/**
 * One-shot cleanup: delete hero webp files and manifest entries for ids
 * not in the current catalog (plus leftover mdb- / ff- orphans).
 * Run: node scripts/scrub-orphan-heroes.mjs
 */
import { readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'recipes');
const jsonOut = join(root, 'src', 'lib', 'recipes', 'images.generated.json');

async function discoverCatalogIds() {
  const files = [
    'src/lib/recipes/data.ts',
    'src/lib/recipes/data-extra.ts',
    'src/lib/recipes/data-fill.ts',
    'src/lib/recipes/data-foodfusion.ts',
    'src/lib/recipes/data-goal.ts',
  ];
  const ids = new Set();
  for (const f of files) {
    const text = await readFile(join(root, f), 'utf8');
    for (const m of text.matchAll(/\bid:\s*'([^']+)'/g)) {
      const id = m[1];
      if (id.includes(' ') || id.length < 2) continue;
      ids.add(id);
    }
    for (const lm of text.matchAll(/\.\.\.latte\('([^']+)'/g)) {
      ids.add(lm[1]);
    }
    for (const bm of text.matchAll(/\.\.\.biryani\('(\w+)',\s*'(\w+)'/g)) {
      ids.add(`${bm[1]}-biryani-${bm[2]}`);
    }
  }
  return ids;
}

function baseId(filename) {
  return filename.replace(/@sm\.webp$/, '').replace(/\.webp$/, '');
}

async function main() {
  const catalog = await discoverCatalogIds();
  console.log(`Catalog: ${catalog.size} recipe ids`);

  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(jsonOut, 'utf8'));
  } catch {
    /* fresh */
  }

  const files = await readdir(outDir);
  let deletedFiles = 0;
  let keptFiles = 0;

  for (const file of files) {
    if (!file.endsWith('.webp')) continue;
    const id = baseId(file);
    const inCatalog = catalog.has(id);
    const isOrphanPrefix = id.startsWith('mdb-') || id.startsWith('ff-');
    const shouldDelete = !inCatalog && (isOrphanPrefix || !id.startsWith('tip-'));

    if (shouldDelete) {
      await unlink(join(outDir, file));
      deletedFiles++;
      console.log(`✗ deleted ${file}`);
    } else {
      keptFiles++;
    }
  }

  let removedManifest = 0;
  for (const id of Object.keys(manifest)) {
    if (!catalog.has(id)) {
      delete manifest[id];
      removedManifest++;
      console.log(`✗ manifest ${id}`);
    }
  }

  await writeFile(jsonOut, JSON.stringify(manifest, null, 2));
  console.log(
    `\nDone. catalog=${catalog.size} deleted_files=${deletedFiles} kept_files=${keptFiles} removed_manifest=${removedManifest} manifest_now=${Object.keys(manifest).length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
