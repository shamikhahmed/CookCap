/**
 * Fetch hero photos for every recipe that lacks one.
 * Sources: TheMealDB (free) → loremflickr fallback.
 * Run: node scripts/fetch-images.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'recipes');
const jsonOut = join(root, 'src', 'lib', 'recipes', 'images.generated.json');

/** Hand-tuned search terms for known mismatches / sparse MealDB coverage. */
const OVERRIDES = {
  'buttermilk-pancakes': ['Pancakes'],
  shakshuka: ['Shakshuka'],
  'roast-chicken': ['Roast chicken', 'Chicken Handi'],
  'risotto-milanese': ['Risotto', 'Mushroom risotto'],
  'chana-masala': ['Chickpea', 'Dal fry', 'Chana'],
  tiramisu: ['Tiramisu'],
  'masala-chai': ['Chai', 'Tea'],
  'kung-pao-tofu': ['Tofu', 'Kung Po', 'Stir fry'],
  'green-shakverdi-salad': ['Salad', 'Greek Salad'],
  'sourdough-focaccia': ['Focaccia', 'Bread'],
  'caprese-orzo': ['Pasta salad', 'Caprese'],
  'halloumi-wrap': ['Kebab', 'Wrap'],
  'saadi-biryani-chicken': ['Biryani', 'Chicken Biryani'],
  'sindhi-biryani-chicken': ['Biryani'],
  'zaffarani-biryani-chicken': ['Biryani'],
  'karahi-chicken': ['Karahi', 'Chicken curry'],
  'handi-chicken': ['Chicken Handi', 'Butter chicken'],
  'qorma-chicken': ['Korma', 'Chicken korma'],
  'nihari-beef': ['Beef', 'Nihari'],
  'chocolate-cake': ['Chocolate Cake'],
  'vanilla-cake': ['Vanilla Cake', 'Cake'],
  'cinnamon-rolls': ['Cinnamon rolls', 'Sticky toffee pudding'],
  'gulab-jamun': ['Gulab jamun', 'Jalebi'],
  kheer: ['Rice pudding', 'Kheer'],
  'alfredo-pasta': ['Carbonara', 'Pasta'],
  'lasagna-beef': ['Lasagne'],
  'egg-fried-rice': ['Egg Fried Rice', 'Fried Rice'],
  'desi-chinese': ['Sweet and Sour', 'Stir fry'],
  'iced-caramel-latte': ['Latte', 'Coffee'],
  'kfc-chicken': ['Fried Chicken', 'Chicken'],
  naan: ['Naan', 'Roti'],
  'simple-bread': ['Bread'],
  'jia-sunday-biryani': ['Biryani'],
  'jia-cake': ['Chocolate Cake'],
};

async function discoverRecipes() {
const files = [
  'src/lib/recipes/data.ts',
  'src/lib/recipes/data-extra.ts',
  'src/lib/recipes/data-fill.ts',
  'src/lib/recipes/data-foodfusion.ts',
];
  const map = new Map();
  for (const f of files) {
    const text = await readFile(join(root, f), 'utf8');
    // id: 'x' ... title: 'Y' within same object (best-effort)
    const idRe = /\bid:\s*'([^']+)'/g;
    let m;
    while ((m = idRe.exec(text))) {
      const id = m[1];
      if (id.includes(' ') || id.length < 2) continue;
      // look ahead for title nearby
      const slice = text.slice(m.index, m.index + 400);
      const t = slice.match(/title:\s*'((?:\\'|[^'])*)'/);
      const title = t ? t[1].replace(/\\'/g, "'") : id.replace(/-/g, ' ');
      if (!map.has(id)) map.set(id, title);
    }
    // generators: ...latte('id', 'Title'
    for (const lm of text.matchAll(/\.\.\.latte\('([^']+)',\s*'([^']+)'/g)) {
      map.set(lm[1], lm[2]);
    }
    for (const bm of text.matchAll(/\.\.\.biryani\('(\w+)',\s*'(\w+)'/g)) {
      const id = `${bm[1]}-biryani-${bm[2]}`;
      const style = bm[1][0].toUpperCase() + bm[1].slice(1);
      const meat = bm[2][0].toUpperCase() + bm[2].slice(1);
      map.set(id, `${style} Biryani ${meat}`);
    }
  }
  return map;
}

async function findMealDb(terms) {
  for (const term of terms) {
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`,
      );
      const data = await res.json();
      const meal = data.meals?.find((m) => m.strMealThumb);
      if (meal) return { url: `${meal.strMealThumb}/large`, name: meal.strMeal, src: 'TheMealDB' };
    } catch {
      /* next */
    }
  }
  return null;
}

async function findFoodish(id, title) {
  const hay = `${id} ${title}`.toLowerCase();
  const cats = [
    ['biryani', 'biryani'],
    ['butter-chicken', 'butter|handi|karahi|qorma|korma|tikka|nihari'],
    ['burger', 'kfc|fried chicken|burger'],
    ['pizza', 'pizza'],
    ['pasta', 'pasta|lasagna|lasagne|alfredo|rigatoni|spaghetti|carbonara|gnocchi|cacio|aglio'],
    ['dessert', 'cake|cookie|brownie|cupcake|mousse|tiramisu|cheesecake|fudge|churro|baklava|gulab|kheer|balush|pudding|parfait|ice cream|mochi|shortbread|cinnamon'],
    ['samosa', 'samosa|pakora'],
    ['dosa', 'dosa|idli'],
    ['idly', 'idly|idli'],
    ['rice', 'rice|biryani|pulao|fried rice|risotto'],
    ['samosa', 'chaat'],
  ];
  let cat = 'biryani'; // warm default for this book
  for (const [c, re] of cats) {
    if (new RegExp(re).test(hay)) {
      cat = c;
      break;
    }
  }
  // Drinks have no Foodish category — skip (caller uses MealDB / Unsplash rematch).
  if (/latte|chai|coffee|espresso|affogato|brew|lassi|patti|karak|tonic/.test(hay)) return null;
  if (/bread|bun|naan|roti|paratha|bagel|baguette|focaccia|brioche|ciabatta|pita|roll/.test(hay))
    cat = 'dosa';
  if (/salad|guacamole|hummus|edamame/.test(hay)) cat = 'samosa';

  try {
    const res = await fetch(`https://foodish-api.com/api/images/${cat}`);
    const data = await res.json();
    if (data.image) return { url: data.image, name: `${cat} (${title})`, src: 'Foodish' };
  } catch {
    /* ignore */
  }
  return null;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function termsFor(id, title) {
  if (OVERRIDES[id]) return OVERRIDES[id];
  const clean = title.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
  const parts = clean.split(' ');
  return [clean, parts.slice(-2).join(' '), parts[0]].filter(Boolean);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(jsonOut, 'utf8'));
  } catch {
    /* fresh */
  }

  const recipes = await discoverRecipes();
  console.log(`Discovered ${recipes.size} recipes`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const [id, title] of recipes) {
    const dest = join(outDir, `${id}.webp`);
    if (await exists(dest) && manifest[id]) {
      skip++;
      continue;
    }

    const terms = termsFor(id, title);
    // Tips chapter = procedural art (photos of random food look wrong)
    if (id.startsWith('tip-')) {
      skip++;
      continue;
    }

    // MealDB first (named dishes); Foodish category only as last resort
    let hit = await findMealDb(terms);
    if (!hit) hit = await findFoodish(id, title);
    if (!hit) {
      console.warn(`✗ ${id}: no source`);
      fail++;
      continue;
    }

    try {
      const res = await fetch(hit.url, { redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());

      await sharp(buf)
        .rotate()
        .resize(1600, 1600, { fit: 'cover', position: 'centre' })
        .webp({ quality: 82 })
        .toFile(dest);

      await sharp(buf)
        .rotate()
        .resize(800, 800, { fit: 'cover', position: 'centre' })
        .webp({ quality: 78 })
        .toFile(join(outDir, `${id}@sm.webp`));

      const tiny = await sharp(buf)
        .rotate()
        .resize(20, 20, { fit: 'cover' })
        .webp({ quality: 40 })
        .toBuffer();

      manifest[id] = {
        blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`,
        credit: hit.src,
        matched: hit.name,
        w: 1600,
        h: 1600,
      };
      ok++;
      console.log(`✓ ${id} ← ${hit.name} (${hit.src})`);
    } catch (e) {
      fail++;
      console.warn(`✗ ${id}: ${e.message}`);
    }
  }

  await writeFile(jsonOut, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. new=${ok} skip=${skip} fail=${fail} total_in_manifest=${Object.keys(manifest).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
