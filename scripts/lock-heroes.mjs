/**
 * Fix soft/wrong heroes from FoodFusion catalog + Unsplash, then LOCK the map.
 *
 *   node scripts/lock-heroes.mjs
 *   node scripts/lock-heroes.mjs --dry
 *
 * After lock: rematch / fill refuse overwrite unless --force-unlock.
 */
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry');
const outDir = join(root, 'public', 'recipes');
const archiveDir = join(root, 'content/sources/foodfusion/images');
const jsonOut = join(root, 'src/lib/recipes/images.generated.json');
const lockOut = join(root, 'src/lib/recipes/images.lock.json');
const catalogPath = join(root, 'content/sources/foodfusion/catalog.json');

/** Honest FoodFusion catalog slugs (exact dish or nearest real plate). */
const FF_SLUG = {
  'nihari-beef': 'best-tender-beef-nihari-in-multi-cooker',
  'karahi-mutton': 'mutton-karahi-gosht',
  'jia-karahi': 'special-chicken-karahi',
  'qorma-chicken': 'danedaar-degi-chicken-korma',
  'qorma-mutton': 'delhi-korma',
  'badami-qorma-chicken': 'white-chicken-korma',
  'badami-qorma-mutton': 'maharaja-mutton-lazeez-handi',
  'handi-mutton': 'noormehal-mutton-handi',
  'veggie-curry': 'mix-vegetable-karahi',
  naan: 'cheesy-garlic-naan',
  'strawberry-oreo-latte': 'no-bake-oreo-cups-with-oreo-shake',
};

/** Local archive files already vetted (content/sources/foodfusion/images/). */
const ARCHIVE = {
  edamame: 'Salted edamame',
  'tea-eggs': 'Chinese tea eggs',
};

/** Direct Unsplash — drinks FoodFusion can't name honestly. */
const UNSPLASH = {
  'iced-blueberry-latte': {
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1600&q=80',
    name: 'Purple berry iced drink',
  },
  'iced-mocha-orange-latte': {
    url: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=1600&q=80',
    name: 'Iced mocha-style coffee',
  },
  minestrone: {
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1600&q=80',
    name: 'Vegetable soup',
  },
  'masala-chai': {
    url: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1600&q=80',
    name: 'Masala chai cup',
  },
  'karak-chai': {
    url: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=1600&q=80',
    name: 'Chai tea',
  },
  'doodh-patti': {
    url: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=1600&q=80',
    name: 'Milk tea',
  },
  'jia-chai-ritual': {
    url: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1600&q=80',
    name: 'Chai ritual',
  },
  'mango-lassi': {
    url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1600&q=80',
    name: 'Mango lassi',
  },
};

/** Tips stay generated art — never dish stock. */
const ART_ONLY = new Set([
  'tip-fried-onions',
  'tip-rice',
  'tip-knives',
  'tip-mise',
  'tip-salt',
  'tip-eggs',
  'tip-yogurt',
  'tip-leftovers',
  'tip-taste',
  'tip-cast-iron',
  'tip-herbs',
  'tip-spice',
  'tip-dough',
  'tip-rest-meat',
  'tip-trust',
]);

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function fetchBuf(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CookCapHeroLock/1.0', Accept: 'image/*,*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function writeHero(id, buf, credit, matched, manifest) {
  const full = join(outDir, `${id}.webp`);
  const sm = join(outDir, `${id}@sm.webp`);
  if (!dry) {
    await sharp(buf).rotate().resize(1600, 1600, { fit: 'cover', position: 'centre' }).webp({ quality: 82 }).toFile(full);
    await sharp(buf).rotate().resize(800, 800, { fit: 'cover', position: 'centre' }).webp({ quality: 78 }).toFile(sm);
    const tiny = await sharp(buf).rotate().resize(20, 20, { fit: 'cover' }).webp({ quality: 40 }).toBuffer();
    manifest[id] = {
      blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`,
      credit,
      matched,
      w: 1600,
      h: 1600,
      locked: true,
    };
  } else {
    manifest[id] = { ...(manifest[id] || {}), credit, matched, locked: true, w: 1600, h: 1600 };
  }
}

async function backfillBlur(id, manifest) {
  const full = join(outDir, `${id}.webp`);
  if (!(await exists(full))) return false;
  const buf = await readFile(full);
  const tiny = await sharp(buf).resize(20, 20, { fit: 'cover' }).webp({ quality: 40 }).toBuffer();
  const prev = manifest[id] || {};
  manifest[id] = {
    blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`,
    credit: prev.credit || 'Local',
    matched: prev.matched || id.replace(/-/g, ' '),
    w: prev.w || 1600,
    h: prev.h || 1600,
    locked: true,
  };
  return true;
}

async function fileSha(path) {
  const buf = await readFile(path);
  return createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const bySlug = new Map(catalog.map((r) => [r.slug, r]));
  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(jsonOut, 'utf8'));
  } catch {
    /* empty */
  }

  const report = [];

  // 1) Local archive (vetted)
  for (const [id, name] of Object.entries(ARCHIVE)) {
    const arch = join(archiveDir, `${id}.webp`);
    if (!(await exists(arch))) {
      console.warn(`? ${id}: missing archive ${arch}`);
      report.push({ id, status: 'nomatch', reason: 'no archive' });
      continue;
    }
    console.log(`${dry ? '~' : '→'} ${id} ← archive ${name}`);
    if (!dry) {
      const buf = await readFile(arch);
      await writeHero(id, buf, 'Local', name, manifest);
    } else {
      await writeHero(id, Buffer.alloc(0), 'Local', name, manifest);
    }
    report.push({ id, status: 'ok', source: 'archive', matched: name });
  }

  // 2) Unsplash fixes
  for (const [id, hit] of Object.entries(UNSPLASH)) {
    if (ARCHIVE[id]) continue;
    try {
      console.log(`${dry ? '~' : '↓'} ${id} ← Unsplash ${hit.name}`);
      if (!dry) {
        const buf = await fetchBuf(hit.url);
        await writeHero(id, buf, 'Unsplash', hit.name, manifest);
      } else {
        await writeHero(id, Buffer.alloc(0), 'Unsplash', hit.name, manifest);
      }
      report.push({ id, status: 'ok', source: 'Unsplash', matched: hit.name });
    } catch (e) {
      console.warn(`✗ ${id}: ${e.message}`);
      report.push({ id, status: 'fail', error: e.message });
    }
  }

  // 3) FoodFusion slug fixes
  for (const [id, slug] of Object.entries(FF_SLUG)) {
    if (UNSPLASH[id] || ARCHIVE[id]) continue;
    const row = bySlug.get(slug);
    if (!row?.imageUrl) {
      console.warn(`? ${id}: missing FF slug ${slug}`);
      report.push({ id, status: 'nomatch', slug });
      continue;
    }
    try {
      console.log(`${dry ? '~' : '↓'} ${id} ← FF ${row.title}`);
      if (!dry) {
        const buf = await fetchBuf(row.imageUrl);
        await writeHero(id, buf, 'FoodFusion', row.title, manifest);
        await sharp(buf)
          .rotate()
          .resize(1600, 1600, { fit: 'cover', position: 'centre' })
          .webp({ quality: 82 })
          .toFile(join(archiveDir, `${id}.webp`))
          .catch(() => {});
      } else {
        await writeHero(id, Buffer.alloc(0), 'FoodFusion', row.title, manifest);
      }
      report.push({ id, status: 'ok', source: 'FoodFusion', matched: row.title, slug });
    } catch (e) {
      console.warn(`✗ ${id}: ${e.message}`);
      report.push({ id, status: 'fail', error: e.message });
    }
  }

  // 4) Strip tip photos if any slipped in — art only
  for (const id of ART_ONLY) {
    if (manifest[id]) {
      delete manifest[id];
      report.push({ id, status: 'art-only', note: 'tips use generated art' });
    }
    // remove tip files from public if present
    if (!dry) {
      for (const p of [join(outDir, `${id}.webp`), join(outDir, `${id}@sm.webp`)]) {
        try {
          const { unlink } = await import('node:fs/promises');
          await unlink(p);
        } catch {
          /* ok */
        }
      }
    }
  }

  // 5) Backfill blur for every public hero file missing/partial manifest
  const { readdir } = await import('node:fs/promises');
  const files = (await readdir(outDir)).filter((f) => f.endsWith('.webp') && !f.includes('@sm'));
  for (const f of files) {
    const id = f.replace(/\.webp$/, '');
    if (ART_ONLY.has(id)) continue;
    if (!manifest[id]?.blurDataURL || !manifest[id]) {
      if (!dry) {
        const ok = await backfillBlur(id, manifest);
        if (ok) {
          console.log(`blur ${id}`);
          report.push({ id, status: 'blur-backfill' });
        }
      }
    } else {
      manifest[id].locked = true;
    }
  }

  // 6) Lock every remaining entry
  for (const id of Object.keys(manifest)) {
    manifest[id].locked = true;
  }

  const hashes = {};
  if (!dry) {
    for (const f of files) {
      const id = f.replace(/\.webp$/, '');
      if (ART_ONLY.has(id)) continue;
      hashes[id] = await fileSha(join(outDir, f));
    }
  }

  const lock = {
    version: 1,
    lockedAt: new Date().toISOString(),
    policy:
      'Hero map locked. scripts/rematch-heroes.mjs + fill-heroes-from-foodfusion.mjs refuse overwrite unless --force-unlock. Tips stay generated art.',
    artOnly: [...ART_ONLY],
    ids: Object.keys(manifest).sort(),
    sha256_16: hashes,
    report,
  };

  if (!dry) {
    await writeFile(jsonOut, JSON.stringify(manifest, null, 2) + '\n');
    await writeFile(lockOut, JSON.stringify(lock, null, 2) + '\n');
  }

  console.log(`\n${dry ? 'DRY ' : ''}Done. manifest=${Object.keys(manifest).length} locked. report=${report.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
