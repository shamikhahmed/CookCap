/**
 * Force-rematch hero photos that are wrong (steak-for-chai, dessert-for-latte, etc).
 * Prefer MealDB scored hits → direct Unsplash → Foodish category last.
 * Run: node scripts/rematch-heroes.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'recipes');
const jsonOut = join(root, 'src', 'lib', 'recipes', 'images.generated.json');

/** Explicit photo URLs for dishes MealDB/Foodish can't name. */
const DIRECT = {
  'masala-chai': {
    url: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1600&q=80',
    name: 'Masala chai cup',
    src: 'Unsplash',
  },
  'karak-chai': {
    url: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=1600&q=80',
    name: 'Chai tea',
    src: 'Unsplash',
  },
  'doodh-patti': {
    url: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=1600&q=80',
    name: 'Milk tea',
    src: 'Unsplash',
  },
  'iced-caramel-latte': {
    url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1600&q=80',
    name: 'Iced latte',
    src: 'Unsplash',
  },
  'golden-latte': {
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1600&q=80',
    name: 'Golden turmeric latte',
    src: 'Unsplash',
  },
  'cold-brew': {
    url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1600&q=80',
    name: 'Cold brew coffee',
    src: 'Unsplash',
  },
  affogato: {
    url: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=1600&q=80',
    name: 'Affogato',
    src: 'Unsplash',
  },
  'espresso-tonic': {
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1600&q=80',
    name: 'Espresso drink',
    src: 'Unsplash',
  },
  'jia-chai-ritual': {
    url: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1600&q=80',
    name: 'Chai ritual',
    src: 'Unsplash',
  },
  'omelette-dinner': {
    url: 'https://www.themealdb.com/images/media/meals/hqaejl1695738653.jpg',
    name: 'Bread omelette',
    src: 'TheMealDB',
  },
  'mango-lassi': {
    url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1600&q=80',
    name: 'Mango lassi',
    src: 'Unsplash',
  },
  'nihari-beef': {
    url: 'https://www.themealdb.com/images/media/meals/1529444830.jpg',
    name: 'Massaman Beef Curry (stand-in for nihari)',
    src: 'TheMealDB',
  },
};

/** Better MealDB search terms + preferred meal names. */
const SEARCH = {
  'alfredo-pasta': ['Fettuccine Alfredo', 'Carbonara', 'Pasta'],
  'nihari-beef': ['Massaman', 'Beef', 'Rendang'],
  'gulab-jamun': ['Gulab', 'Jalebi', 'Dessert'],
  'qorma-chicken': ['Chicken korma', 'Korma', 'Butter chicken'],
  'qorma-mutton': ['Lamb Tagine', 'Lamb', 'Korma'],
  'karahi-mutton': ['Lamb Rogan josh', 'Lamb', 'Karahi'],
  'handi-mutton': ['Lamb Tagine', 'Butter chicken'],
  'badami-qorma-chicken': ['Chicken korma', 'Butter chicken'],
  'badami-qorma-mutton': ['Lamb Tagine', 'Korma'],
  'saadi-biryani-mutton': ['Lamb Biryani', 'Biryani'],
  'sindhi-biryani-mutton': ['Lamb Biryani', 'Biryani'],
  'zaffarani-biryani-mutton': ['Lamb Biryani', 'Biryani'],
  'saadi-biryani-beef': ['Beef Biryani', 'Biryani', 'Beef'],
  'sindhi-biryani-beef': ['Beef Biryani', 'Biryani'],
  'zaffarani-biryani-beef': ['Beef Biryani', 'Biryani'],
  kheer: ['Rice pudding', 'Kheer'],
  balushahi: ['Jalebi', 'Dessert'],
  paratha: ['Roti', 'Chapati', 'Naan'],
  roti: ['Roti', 'Chapati'],
  bagel: ['Bagel', 'Bread'],
  baguette: ['Bread'],
  ciabatta: ['Focaccia', 'Bread'],
  'cacio-e-pepe': ['Carbonara', 'Pasta'],
  'aglio-olio': ['Spaghetti', 'Pasta'],
  minestrone: ['Minestrone', 'Soup'],
  'pesto-gnocchi': ['Gnocchi', 'Pasta'],
  'sheet-pan-salmon': ['Salmon', 'Fish'],
  'veggie-curry': ['Vegetarian Curry', 'Dal fry'],
  'omelette-dinner': ['Omlette', 'Egg'],
  'triple-choc-brownies': ['Chocolate Gateau', 'Brownie', 'Chocolate'],
  'double-choc-cookies': ['Peanut Butter Cookies', 'Cookie'],
  'oreo-custard-crunch': ['Chocolate Gateau', 'Dessert'],
  'tiramisu-cups': ['Tiramisu'],
  tiramisu: ['Tiramisu'],
  'pakistani-stew': ['Beef stew', 'Beef'],
  'kfc-spicy-chicken': ['Kentucky Fried Chicken', 'Fried Chicken'],
};

function tokens(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !['the', 'and', 'with', 'for'].includes(t));
}

function scoreMeal(mealName, id, title) {
  const mt = tokens(mealName);
  const want = new Set([...tokens(id.replace(/-/g, ' ')), ...tokens(title)]);
  let hit = 0;
  for (const t of mt) if (want.has(t)) hit++;
  // Penalize steak/meat when looking for chai/tea/latte
  const drink = /chai|latte|coffee|tea|brew|espresso|affogato|lassi|patti/.test(`${id} ${title}`);
  if (drink && /steak|beef|pork|chicken|lamb|fish|pie|soup/.test(mealName.toLowerCase())) return -10;
  return hit;
}

async function findMealDb(terms, id, title) {
  let best = null;
  let bestScore = 0;
  for (const term of terms) {
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`,
      );
      const data = await res.json();
      for (const meal of data.meals || []) {
        if (!meal.strMealThumb) continue;
        const sc = scoreMeal(meal.strMeal, id, title);
        if (sc > bestScore) {
          bestScore = sc;
          best = { url: `${meal.strMealThumb}/large`, name: meal.strMeal, src: 'TheMealDB', score: sc };
        }
      }
    } catch {
      /* next */
    }
  }
  if (best && best.score >= 1) return best;
  return null;
}

async function findFoodish(id, title) {
  const hay = `${id} ${title}`.toLowerCase();
  const cats = [
    ['biryani', 'biryani|pulao'],
    ['butter-chicken', 'butter|handi|karahi|qorma|korma|tikka|nihari|stew|curry|gosht|qeema'],
    ['burger', 'kfc|fried chicken|burger'],
    ['pasta', 'pasta|lasagna|lasagne|alfredo|rigatoni|spaghetti|carbonara|gnocchi|cacio|aglio|minestrone'],
    ['dessert', 'cake|cookie|brownie|cupcake|mousse|tiramisu|cheesecake|fudge|churro|baklava|gulab|kheer|balush|pudding|parfait|ice cream|mochi|shortbread|cinnamon|oreo'],
    ['samosa', 'samosa|pakora|chaat|salad|guacamole|hummus'],
    ['dosa', 'dosa|idli|bread|bun|naan|roti|paratha|bagel|baguette|focaccia|brioche|ciabatta|pita|roll'],
    ['rice', 'rice|fried rice|risotto'],
    ['pizza', 'pizza'],
  ];
  let cat = 'biryani';
  for (const [c, re] of cats) {
    if (new RegExp(re).test(hay)) {
      cat = c;
      break;
    }
  }
  // Never Foodish for drinks — wrong categories
  if (/latte|chai|coffee|espresso|affogato|brew|lassi|patti|karak|tonic/.test(hay)) return null;
  try {
    const res = await fetch(`https://foodish-api.com/api/images/${cat}`);
    const data = await res.json();
    if (data.image) return { url: data.image, name: `${cat} (${title})`, src: 'Foodish' };
  } catch {
    /* ignore */
  }
  return null;
}

function needsRematch(id, entry) {
  if (!entry) return true;
  if (DIRECT[id]) return true;
  if (SEARCH[id]) return true;
  const m = (entry.matched || '').toLowerCase();
  const c = entry.credit || '';
  if (id.includes('chai') && m.includes('steak')) return true;
  if (id.includes('nihari') && m.includes('pho')) return true;
  if (/latte|chai|coffee|espresso|affogato|brew|lassi|patti|karak/.test(id) && c === 'Foodish')
    return true;
  if (c === 'Foodish' && SEARCH[id]) return true;
  return false;
}

async function writeHero(id, hit, manifest) {
  const dest = join(outDir, `${id}.webp`);
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
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const manifest = JSON.parse(await readFile(jsonOut, 'utf8'));

  // Discover titles from recipe data files
  const files = [
    'src/lib/recipes/data.ts',
    'src/lib/recipes/data-extra.ts',
    'src/lib/recipes/data-fill.ts',
    'src/lib/recipes/data-foodfusion.ts',
  ];
  const recipes = new Map();
  for (const f of files) {
    const text = await readFile(join(root, f), 'utf8');
    const idRe = /\bid:\s*'([^']+)'/g;
    let m;
    while ((m = idRe.exec(text))) {
      const id = m[1];
      if (id.includes(' ') || id.length < 2 || id.startsWith('tip-')) continue;
      const slice = text.slice(m.index, m.index + 400);
      const t = slice.match(/title:\s*'((?:\\'|[^'])*)'/);
      const title = t ? t[1].replace(/\\'/g, "'") : id.replace(/-/g, ' ');
      if (!recipes.has(id)) recipes.set(id, title);
    }
    for (const lm of text.matchAll(/\.\.\.latte\('([^']+)',\s*'([^']+)'/g)) {
      recipes.set(lm[1], lm[2]);
    }
    for (const bm of text.matchAll(/\.\.\.biryani\('(\w+)',\s*'(\w+)'/g)) {
      const id = `${bm[1]}-biryani-${bm[2]}`;
      const style = bm[1][0].toUpperCase() + bm[1].slice(1);
      const meat = bm[2][0].toUpperCase() + bm[2].slice(1);
      recipes.set(id, `${style} Biryani ${meat}`);
    }
  }

  const targets = new Set(
    [...recipes.keys()].filter((id) => needsRematch(id, manifest[id])),
  );
  for (const id of Object.keys(DIRECT)) targets.add(id);
  console.log(`Rematching ${targets.size} heroes`);

  let ok = 0;
  let fail = 0;
  for (const id of targets) {
    const title = recipes.get(id) || id.replace(/-/g, ' ');
    try {
      let hit = DIRECT[id] || null;
      if (!hit) {
        const terms = SEARCH[id] || [
          title.replace(/[()]/g, '').trim(),
          title.split(' ').slice(-2).join(' '),
        ];
        hit = await findMealDb(terms, id, title);
      }
      if (!hit) hit = await findFoodish(id, title);
      if (!hit) {
        console.warn(`✗ ${id}: no source`);
        fail++;
        continue;
      }
      await writeHero(id, hit, manifest);
      ok++;
      console.log(`✓ ${id} ← ${hit.name} (${hit.src})`);
    } catch (e) {
      fail++;
      console.warn(`✗ ${id}: ${e.message}`);
    }
  }

  await writeFile(jsonOut, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
