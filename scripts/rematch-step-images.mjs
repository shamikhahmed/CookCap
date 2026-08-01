/**
 * Force-rematch CORE step photos. Dish-correct only — no Foodish dosa/burger
 * guesses, no LoremFlickr. If we can't get a matching dish photo → omit.
 *
 * Run: node scripts/rematch-step-images.mjs
 * Flags: --dry  (print plan only)
 */
import sharp from 'sharp';
import { mkdir, writeFile, readFile, unlink, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'recipes', 'steps');
const jsonOut = join(root, 'src', 'lib', 'recipes', 'step-images.generated.json');
const dry = process.argv.includes('--dry');

/** Dishes with no honest stock — leave off map (UI shows text-only Method). */
const OMIT = new Set([
  'simple-buns',
  'chocolate-orange-swirl',
  'nihari-chicken',
  'nihari-beef',
  'pakistani-stew',
  'kheer',
  'cupcakes',
  'balushahi',
  'gulab-jamun',
]);

/** Up to 3 curated dish photos per CORE id. Prefer Unsplash / MealDB thumbs. */
const DIRECT = {
  // Breads / buns
  'simple-bread': [
    'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=1200&q=80',
  ],
  'simple-buns': [
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1612203985729-70726943d223?auto=format&fit=crop&w=1200&q=80',
  ],
  'cinnamon-sugar-bun': [
    'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1623334044306-044a998ba952?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=1200&q=80',
  ],
  'cinnamon-rolls': [
    'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1623334044306-044a998ba952?auto=format&fit=crop&w=1200&q=80',
  ],
  'simple-tea-cake': [
    'https://images.unsplash.com/photo-1486427944299-d1955d23e343?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
  ],
  'vanilla-cake': [
    'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80',
  ],
  'chocolate-cake': [
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1621303837174-89787a7d2398?auto=format&fit=crop&w=1200&q=80',
  ],
  'chocolate-orange-swirl': [
    'https://images.unsplash.com/photo-1614707267537-b85aaf00c2c1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1612203985729-70726943d223?auto=format&fit=crop&w=1200&q=80',
  ],

  // Biryanis / pilaf — Lamb Biryani + Mandi + Pilaf plates (closest honest stock)
  'saadi-biryani-chicken': [
    'https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg',
    'https://www.themealdb.com/images/media/meals/er4d081765186828.jpg',
    'https://www.themealdb.com/images/media/meals/kos9av1699014767.jpg',
  ],
  'sindhi-biryani-chicken': [
    'https://www.themealdb.com/images/media/meals/er4d081765186828.jpg',
    'https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg',
    'https://images.unsplash.com/photo-1563379091339-03b21aad4c8c?auto=format&fit=crop&w=1200&q=80',
  ],
  'zaffarani-biryani-chicken': [
    'https://images.unsplash.com/photo-1563379091339-03b21aad4c8c?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg',
    'https://www.themealdb.com/images/media/meals/er4d081765186828.jpg',
  ],
  'saadi-biryani-mutton': [
    'https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg',
    'https://www.themealdb.com/images/media/meals/kos9av1699014767.jpg',
    'https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg',
  ],
  'sindhi-biryani-mutton': [
    'https://www.themealdb.com/images/media/meals/kos9av1699014767.jpg',
    'https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg',
    'https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg',
  ],
  'zaffarani-biryani-mutton': [
    'https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg',
    'https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg',
    'https://images.unsplash.com/photo-1563379091339-03b21aad4c8c?auto=format&fit=crop&w=1200&q=80',
  ],
  'saadi-biryani-beef': [
    'https://www.themealdb.com/images/media/meals/1nalo51765188375.jpg',
    'https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg',
    'https://images.unsplash.com/photo-1563379091339-03b21aad4c8c?auto=format&fit=crop&w=1200&q=80',
  ],
  'sindhi-biryani-beef': [
    'https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg',
    'https://www.themealdb.com/images/media/meals/1nalo51765188375.jpg',
    'https://www.themealdb.com/images/media/meals/kos9av1699014767.jpg',
  ],
  'zaffarani-biryani-beef': [
    'https://images.unsplash.com/photo-1563379091339-03b21aad4c8c?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/1nalo51765188375.jpg',
    'https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg',
  ],

  // Curries / handi / karahi / qorma / nihari
  'karahi-chicken': [
    'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
    'https://www.themealdb.com/images/media/meals/1520084413.jpg',
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae17e?auto=format&fit=crop&w=1200&q=80',
  ],
  'karahi-mutton': [
    'https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg',
    'https://www.themealdb.com/images/media/meals/yuwtuu1511295751.jpg',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
  ],
  'handi-chicken': [
    'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
    'https://www.themealdb.com/images/media/meals/1520084413.jpg',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80',
  ],
  'handi-mutton': [
    'https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/yuwtuu1511295751.jpg',
  ],
  'cheese-handi-chicken': [
    'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/1520084413.jpg',
  ],
  'green-handi-chicken': [
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/sstssx1487349585.jpg',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
  ],
  'nihari-chicken': [
    'https://www.themealdb.com/images/media/meals/tvttqv1504640475.jpg',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
  ],
  'nihari-beef': [
    'https://www.themealdb.com/images/media/meals/tvttqv1504640475.jpg',
    'https://www.themealdb.com/images/media/meals/bc8v651619789840.jpg',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
  ],
  'pakistani-stew': [
    'https://www.themealdb.com/images/media/meals/bc8v651619789840.jpg',
    'https://www.themealdb.com/images/media/meals/tvttqv1504640475.jpg',
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80',
  ],
  'qorma-chicken': [
    'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/1520084413.jpg',
  ],
  'qorma-mutton': [
    'https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/yuwtuu1511295751.jpg',
  ],
  'badami-qorma-chicken': [
    'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/qptpvt1487339892.jpg',
  ],
  'badami-qorma-mutton': [
    'https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/yuwtuu1511295751.jpg',
  ],

  // Pasta
  'lasagna-chicken': [
    'https://www.themealdb.com/images/media/meals/wtsvxx1511296896.jpg',
    'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=1200&q=80',
  ],
  'lasagna-beef': [
    'https://www.themealdb.com/images/media/meals/wtsvxx1511296896.jpg',
    'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=1200&q=80',
  ],
  'alfredo-pasta': [
    'https://www.themealdb.com/images/media/meals/0jv5gx1661040802.jpg',
    'https://images.unsplash.com/photo-1645112411341-6c4fd023882a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80',
  ],
  'rigatoni-pasta': [
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg',
  ],
  'desi-chinese': [
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/wuyd2h1765655837.jpg',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
  ],

  // Iced lattes / drinks — coffee only
  'iced-caramel-latte': latteUrls(),
  'iced-mocha-latte': [
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=1200&q=80',
  ],
  'iced-spanish-latte': latteUrls(),
  'iced-mocha-orange-latte': [
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80',
  ],
  'iced-blueberry-latte': latteUrls(),
  'iced-strawberry-latte': [
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1553530666-ba11ea2d142f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=1200&q=80',
  ],
  'strawberry-oreo-latte': [
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=1200&q=80',
  ],
  'cookies-cream-latte': [
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80',
  ],

  // Desserts
  'oreo-custard-crunch': [
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
  ],
  kheer: [
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/utypqq1511721264.jpg',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80',
  ],
  'brownies-cupcakes': [
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1614707267537-b85aaf00c2c1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=1200&q=80',
  ],
  cupcakes: [
    'https://images.unsplash.com/photo-1614707267537-b85aaf00c2c1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1612203985729-70726943d223?auto=format&fit=crop&w=1200&q=80',
  ],
  'triple-choc-brownies': [
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1621303837174-89787a7d2398?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
  ],
  'choc-chip-cookies': [
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=1200&q=80',
  ],
  'double-choc-cookies': [
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=80',
  ],
  balushahi: [
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/adxcbq1619787919.jpg',
  ],
  'gulab-jamun': [
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80',
  ],

  // Fried chicken — real fried chicken, not burgers / stir-fry
  'kfc-chicken': [
    'https://www.themealdb.com/images/media/meals/40r49m1763197022.jpg',
    'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80',
  ],
  'kfc-spicy-chicken': [
    'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80',
    'https://www.themealdb.com/images/media/meals/40r49m1763197022.jpg',
    'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=1200&q=80',
  ],
};

function latteUrls() {
  return [
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=1200&q=80',
  ];
}

/** Same CORE ids as family list — minus OMIT (no dishonest stock). */
const CORE_IDS = Object.keys(DIRECT).filter((id) => !OMIT.has(id));

async function fetchBuf(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'JiaCooks/1.3.2 (private heirloom cookbook)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function writeStep(id, n, url) {
  const buf = await fetchBuf(url);
  const out = join(outDir, `${id}-${n}.webp`);
  await sharp(buf)
    .rotate()
    .resize(1200, 800, { fit: 'cover', position: 'centre' })
    .webp({ quality: 78 })
    .toFile(out);
  return `/recipes/steps/${id}-${n}.webp`;
}

async function clearOldSteps() {
  let files = [];
  try {
    files = await readdir(outDir);
  } catch {
    return;
  }
  for (const f of files) {
    if (!f.endsWith('.webp')) continue;
    if (dry) continue;
    await unlink(join(outDir, f)).catch(() => void 0);
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  console.log(dry ? 'DRY run' : 'Force rematch ALL CORE step photos');
  console.log('Clearing old step webps…');
  await clearOldSteps();

  const map = {};
  let ok = 0;
  let removed = 0;
  let fail = 0;

  for (const id of CORE_IDS) {
    const urls = DIRECT[id] || [];
    const paths = [];
    for (let i = 0; i < urls.length && paths.length < 3; i++) {
      const url = urls[i];
      try {
        if (dry) {
          paths.push(`/recipes/steps/${id}-${paths.length + 1}.webp`);
          console.log(`  plan ${id} ← ${url.slice(0, 60)}…`);
        } else {
          const p = await writeStep(id, paths.length + 1, url);
          paths.push(p);
          console.log(`  ✓ ${id} #${paths.length}`);
        }
      } catch (e) {
        console.warn(`  ✗ ${id} #${paths.length + 1}: ${e.message}`);
        fail++;
      }
    }
    if (paths.length >= 2) {
      map[id] = paths;
      ok++;
    } else {
      removed++;
      console.warn(`  omit ${id} (only ${paths.length} good photos)`);
      // clean partials
      if (!dry) {
        for (let n = 1; n <= 3; n++) {
          await unlink(join(outDir, `${id}-${n}.webp`)).catch(() => void 0);
        }
      }
    }
  }

  if (!dry) {
    await writeFile(jsonOut, `${JSON.stringify(map, null, 2)}\n`);
  }
  console.log(`\nDone. kept=${ok} omitted=${removed} fetchFails=${fail} mapKeys=${Object.keys(map).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
