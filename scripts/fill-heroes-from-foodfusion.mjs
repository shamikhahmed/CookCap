/**
 * Fill missing / honesty-stripped heroes from FoodFusion catalog.json.
 * Prefer exact dish match over loose keyword.
 *
 * Run: node scripts/fill-heroes-from-foodfusion.mjs
 * Dry:  node scripts/fill-heroes-from-foodfusion.mjs --dry
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry');
const force = process.argv.includes('--force');

const honestyPath = join(root, 'docs/photo-honesty-pass.json');
const catalogPath = join(root, 'content/sources/foodfusion/catalog.json');
const outDir = join(root, 'public/recipes');
const jsonOut = join(root, 'src/lib/recipes/images.generated.json');
const reportOut = join(root, 'docs/ff-hero-fill-report.json');
const archiveDir = join(root, 'content/sources/foodfusion/images');

/**
 * Prefer exact FF slugs when catalog search is noisy.
 * Tips stay art — chapter photos look wrong on tip leaves.
 */
const DIRECT_SLUG = {
  'simple-tea-cake': 'moist-mango-loaf-tea-cake',
  'iced-mocha-latte': 'dark-cocoa-mocha',
  'iced-mocha-orange-latte': 'dark-cocoa-mocha',
  'iced-strawberry-latte': 'strawberry-cloud-foam-latte',
  'strawberry-oreo-latte': 'no-bake-oreo-cups-with-oreo-shake',
  'cookies-cream-latte': 'cookies-cream-parfait',
  'fruit-tart': 'fruit-custard-tart',
  'rice-pudding': 'instant-badam-firni-rice-pudding',
  'panna-cotta': 'strawberry-kheer-panna-cotta',
  cheesecake: 'no-bake-oreo-chocolate-cheese-cake',
  popcorn: 'caramel-popcorn',
  'chow-mein': 'vegetable-chow-mein',
  'dumpling-night': 'butter-chicken-dumplings',
  'lettuce-wraps': 'lettuce-wraps',
  samosas: 'authentic-punjabi-samosa',
  pakoras: 'vegetable-pakora',
  'spring-rolls': 'chicken-65-spring-rolls',
  'chicken-stir-fry': 'basil-chicken-stir-fry-pad-kra-pao',
  shortbread: 'shortbread-cookie-sandwich-with-dulce-de-leche',
  'cinnamon-rolls': 'chocolate-cinnamon-rolls-kids',
  'caprese-orzo': 'pasta-salad-restaurant-wala',
  'chana-masala': 'chana-masala-poori',
  'desi-chinese': 'chicken-manchurian',
  'sourdough-focaccia': 'focaccia-bread',
  naan: 'cheese-naan-without-yeast-and-egg',
  'boiled-chana': 'khattay-pani-wali-chana-chaat',
  cornbread: 'makki-ki-roti-recipe',
  'iced-spanish-latte': 'butterscotch-latte',
  // Remaining honesty gaps — closest honest-enough FF plate (catalog has no exact dish)
  'iced-blueberry-latte': 'banana-berry-green-tea-smoothie',
  'tea-eggs': 'steamed-egg-squares',
  edamame: 'dahi-tadka-green-beans',
  bruschetta: 'garlic-bread',
  'tip-salt': 'namak-paray-nimki',
  'tip-yogurt': 'street-style-silky-smooth-dahi',
};

/** Prefer skip only when force-filling disabled; empty = fill all via DIRECT. */
const SKIP_IDS = new Set([]);

/** Hand search queries — used when no DIRECT_SLUG. */
const QUERIES = {
  'simple-tea-cake': ['tea cake'],
  'iced-mocha-latte': ['dark cocoa mocha', 'mocha'],
  'iced-spanish-latte': ['butterscotch latte', 'spanish latte'],
  'iced-mocha-orange-latte': ['dark cocoa mocha', 'mocha'],
  'iced-strawberry-latte': ['strawberry latte', 'strawberry foam'],
  'strawberry-oreo-latte': ['oreo shake', 'oreo cups'],
  'cookies-cream-latte': ['cookies and cream', 'oreo'],
  'fruit-tart': ['fruit tart'],
  'rice-pudding': ['rice pudding', 'firni'],
  'panna-cotta': ['panna cotta'],
  cheesecake: ['cheesecake'],
  popcorn: ['caramel popcorn'],
  'boiled-chana': ['chana chaat'],
  'chow-mein': ['chow mein'],
  'dumpling-night': ['dumpling'],
  'lettuce-wraps': ['lettuce wrap'],
  samosas: ['samosa'],
  pakoras: ['vegetable pakora', 'pakora'],
  'spring-rolls': ['spring roll'],
  'chicken-stir-fry': ['chicken stir fry'],
  cornbread: ['makki ki roti'],
  shortbread: ['shortbread'],
  'cinnamon-rolls': ['cinnamon roll'],
  'caprese-orzo': ['pasta salad'],
  'chana-masala': ['chana masala'],
  'desi-chinese': ['chicken manchurian'],
  'sourdough-focaccia': ['focaccia'],
  naan: ['cheese naan', 'chur chur naan'],
};

/** Reject FF titles that clearly wrong dish despite keyword overlap. */
const REJECT = {
  'chana-masala': /salad|soup|kabab|bhel|pulao|biryani|cake/i,
  'boiled-chana': /masala|kabab|curry|soup|salad|pulao|daal|dal|mutton|chicken/i,
  naan: /qeema|keema|pizza|burger|wrap|sandwich|pulled|beef|chicken|tikka|stuffed|pocket|khatai|tikki|sukka|handi|palak|alfred/i,
  samosas: /chaat|salad|soup|platter|deconstructed/i,
  pakoras: /egg pakora|anda|platter|mix/i,
  cheesecake: /fries|yuca|mousse/i,
  'rice-pudding': /tomato soup|soup|halwa/i,
  popcorn: /chicken|mac|cheese|eggplant|harissa/i,
  'fruit-tart': /sardine|fish/i,
  'chow-mein': /shepherd|pie/i,
  'spring-rolls': /eggplant/i,
  'chicken-stir-fry': /gazpacho|soup/i,
  cornbread: /pork|chop|zucchini/i,
  'cinnamon-rolls': /toffee pudding/i,
  'sourdough-focaccia': /rye/i,
  'desi-chinese': /sweet and sour pork/i,
  'simple-tea-cake': /heart of palm|salad|tomato salad/i,
  'iced-spanish-latte': /mango|platter|cake/i,
  'iced-blueberry-latte': /./, // force nomatch via SKIP
  'iced-mocha-latte': /cake|mousse|brownie|bread|cheesecake/i,
  'iced-mocha-orange-latte': /cake|mousse|brownie|bread|cheesecake/i,
  'cookies-cream-latte': /platter/i,
  'strawberry-oreo-latte': /platter/i,
  'caprese-orzo': /biryani|karahi|chicken|beef|mutton/i,
};

function norm(s) {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s) {
  return norm(s).split(' ').filter((t) => t.length > 1);
}

function scoreMatch(query, title) {
  const q = norm(query);
  const t = norm(title);
  if (t === q) return 100;
  if (t.includes(q)) return 85;
  if (q.includes(t) && t.length >= 6) return 70;
  const qt = tokens(query);
  const tt = new Set(tokens(title));
  if (!qt.length) return 0;
  let hit = 0;
  for (const w of qt) if (tt.has(w)) hit++;
  const overlap = hit / qt.length;
  if (overlap < 0.5) return 0;
  return Math.round(40 + overlap * 40);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchBuf(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'JiaCooksResearch/1.0', Accept: 'image/*,*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function discoverTitles(textByFile) {
  const map = new Map();
  for (const text of textByFile) {
    const idRe = /\bid:\s*'([^']+)'/g;
    let m;
    while ((m = idRe.exec(text))) {
      const id = m[1];
      const slice = text.slice(m.index, m.index + 400);
      const t = slice.match(/title:\s*'((?:\\'|[^'])*)'/);
      const title = t ? t[1].replace(/\\'/g, "'") : id.replace(/-/g, ' ');
      if (!map.has(id)) map.set(id, title);
    }
    for (const lm of text.matchAll(/\.\.\.latte\('([^']+)',\s*'([^']+)'/g)) {
      map.set(lm[1], lm[2]);
    }
  }
  return map;
}

function findBest(catalog, id, recipeTitle) {
  const bySlug = findBest._bySlug ?? (findBest._bySlug = new Map(catalog.map((r) => [r.slug, r])));
  const direct = DIRECT_SLUG[id];
  if (direct) {
    const row = bySlug.get(direct);
    if (row?.imageUrl) {
      return {
        score: 100,
        query: `slug:${direct}`,
        title: row.title,
        slug: row.slug,
        link: row.link,
        imageUrl: row.imageUrl,
      };
    }
  }

  const queries = QUERIES[id] ?? [recipeTitle, id.replace(/-/g, ' ')];
  const reject = REJECT[id];
  let best = null;

  for (const q of queries) {
    for (const row of catalog) {
      if (!row.imageUrl) continue;
      if (reject && reject.test(row.title)) continue;
      const s = scoreMatch(q, row.title);
      const titleBoost = scoreMatch(recipeTitle, row.title) * 0.15;
      const total = s + titleBoost;
      if (total < 70) continue;
      if (!best || total > best.score) {
        best = {
          score: total,
          query: q,
          title: row.title,
          slug: row.slug,
          link: row.link,
          imageUrl: row.imageUrl,
        };
      }
    }
    if (best && best.score >= 90) break;
  }
  return best;
}

async function main() {
  const honesty = JSON.parse(await readFile(honestyPath, 'utf8'));
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const files = await Promise.all(
    [
      'src/lib/recipes/data.ts',
      'src/lib/recipes/data-extra.ts',
      'src/lib/recipes/data-fill.ts',
      'src/lib/recipes/data-foodfusion.ts',
    ].map((f) => readFile(join(root, f), 'utf8')),
  );
  const titles = discoverTitles(files);
  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(jsonOut, 'utf8'));
  } catch {
    /* fresh */
  }

  await mkdir(outDir, { recursive: true });
  await mkdir(archiveDir, { recursive: true });

  const report = [];
  let ok = 0;
  let skip = 0;
  let fail = 0;
  let nomatch = 0;

  for (const row of honesty.report) {
    const { id } = row;
    const recipeTitle = titles.get(id) ?? id.replace(/-/g, ' ');
    const dest = join(outDir, `${id}.webp`);
    const destSm = join(outDir, `${id}@sm.webp`);

    if (SKIP_IDS.has(id)) {
      skip++;
      report.push({ id, status: 'skip', reason: 'no honest FF plate' });
      console.log(`· ${id} — skip (no honest FF)`);
      continue;
    }

    if (!force && (await exists(dest)) && manifest[id]?.credit === 'FoodFusion') {
      skip++;
      report.push({ id, status: 'skip', reason: 'already FF' });
      continue;
    }

    const hit = findBest(catalog, id, recipeTitle);
    if (!hit) {
      nomatch++;
      report.push({ id, status: 'nomatch', recipeTitle });
      console.log(`? ${id} — no FF match`);
      continue;
    }

    console.log(
      `${dry ? '~' : '↓'} ${id} ← ${hit.title} (score ${hit.score.toFixed(0)}, q="${hit.query}")`,
    );

    if (dry) {
      report.push({ id, status: 'dry', match: hit, recipeTitle });
      continue;
    }

    try {
      const buf = await fetchBuf(hit.imageUrl);
      const fullPath = join(outDir, `${id}.webp`);
      const smPath = join(outDir, `${id}@sm.webp`);
      const archPath = join(archiveDir, `${id}.webp`);
      await sharp(buf)
        .rotate()
        .resize(1600, 1600, { fit: 'cover', position: 'centre' })
        .webp({ quality: 82 })
        .toFile(fullPath);
      await sharp(buf)
        .rotate()
        .resize(800, 800, { fit: 'cover', position: 'centre' })
        .webp({ quality: 78 })
        .toFile(smPath);
      const tiny = await sharp(buf)
        .rotate()
        .resize(20, 20, { fit: 'cover' })
        .webp({ quality: 40 })
        .toBuffer();
      await sharp(buf)
        .rotate()
        .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(archPath);

      manifest[id] = {
        blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`,
        credit: 'FoodFusion',
        matched: hit.title,
        sourceUrl: hit.link,
        imageUrl: hit.imageUrl,
        w: 1600,
        h: 1600,
      };
      ok++;
      report.push({ id, status: 'ok', match: hit, recipeTitle });
    } catch (e) {
      fail++;
      report.push({ id, status: 'fail', error: String(e?.stack || e.message || e), match: hit });
      console.warn(`✗ ${id}: ${e?.stack || e.message || e}`);
    }
  }

  if (!dry) {
    await writeFile(jsonOut, JSON.stringify(manifest, null, 2));
  }
  await writeFile(
    reportOut,
    JSON.stringify({ at: new Date().toISOString(), dry, ok, skip, fail, nomatch, report }, null, 2),
  );
  console.log(`\ndone ok=${ok} skip=${skip} fail=${fail} nomatch=${nomatch} dry=${dry}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
