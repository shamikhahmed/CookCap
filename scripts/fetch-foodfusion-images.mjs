/**
 * Download FoodFusion hero images from content/sources/foodfusion/image-jobs.json
 * → public/recipes/<id>.webp + archive copy under content/sources/foodfusion/images/
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jobsPath = join(root, 'content/sources/foodfusion/image-jobs.json');
const archiveDir = join(root, 'content/sources/foodfusion/images');
const pubDir = join(root, 'public/recipes');
const mapPath = join(root, 'content/sources/foodfusion/images.map.json');

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
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const jobs = JSON.parse(await readFile(jobsPath, 'utf8'));
await mkdir(archiveDir, { recursive: true });
await mkdir(pubDir, { recursive: true });

const map = {};
let ok = 0;
let skip = 0;
let fail = 0;

for (const job of jobs) {
  const outPub = join(pubDir, `${job.id}.webp`);
  const outArch = join(archiveDir, `${job.id}.webp`);
  if (await exists(outPub)) {
    skip++;
    map[job.id] = { path: `/recipes/${job.id}.webp`, source: job.url, skipped: true };
    continue;
  }
  try {
    const buf = await fetchBuf(job.url);
    const webp = await sharp(buf)
      .rotate()
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    await writeFile(outPub, webp);
    await writeFile(outArch, webp);
    map[job.id] = { path: `/recipes/${job.id}.webp`, source: job.url, bytes: webp.length };
    ok++;
    process.stdout.write(`✓ ${job.id}\n`);
  } catch (e) {
    fail++;
    map[job.id] = { error: String(e), source: job.url };
    process.stdout.write(`✗ ${job.id}: ${e.message || e}\n`);
  }
}

await writeFile(mapPath, JSON.stringify(map, null, 2));
console.log(`done ok=${ok} skip=${skip} fail=${fail}`);
