import type { ChapterId, Recipe } from '@/lib/recipes/types';

/**
 * Parse a WhatsApp-forwarded / pasted recipe blob into a Recipe draft.
 * Best-effort — humans write messy. Always produces something cookable.
 *
 * Expected shapes (any mix):
 *   Title
 *   Ingredients:
 *   - 2 cups flour
 *   Method: / Steps: / Directions:
 *   1. Mix …
 */

let importSeq = 0;

export function parseWhatsAppRecipe(raw: string, chapter: ChapterId = 'meals'): Recipe {
  const text = raw.replace(/\r/g, '').trim();
  const lines = text.split('\n').map((l) => l.replace(/^[\s>*•\-–—]+/, '').trim()).filter(Boolean);

  let title = lines[0]?.replace(/^[\d.]+\s*/, '') || 'Imported recipe';
  // Strip common WA prefixes
  title = title.replace(/^recipe\s*[:=-]?\s*/i, '').slice(0, 80);

  const ingStart = lines.findIndex((l) => /^(ingredients?|ingredientes)\b/i.test(l));
  const stepStart = lines.findIndex((l) =>
    /^(method|steps?|directions?|instructions?|preparaci[oó]n)\b/i.test(l),
  );

  let ingLines: string[] = [];
  let stepLines: string[] = [];

  if (ingStart >= 0 && stepStart >= 0) {
    const a = Math.min(ingStart, stepStart);
    const b = Math.max(ingStart, stepStart);
    if (ingStart < stepStart) {
      ingLines = lines.slice(ingStart + 1, stepStart);
      stepLines = lines.slice(stepStart + 1);
    } else {
      stepLines = lines.slice(stepStart + 1, ingStart);
      ingLines = lines.slice(ingStart + 1);
    }
    void a;
    void b;
  } else if (ingStart >= 0) {
    ingLines = lines.slice(ingStart + 1);
  } else if (stepStart >= 0) {
    stepLines = lines.slice(stepStart + 1);
    ingLines = lines.slice(1, stepStart);
  } else {
    // Heuristic: short lines with numbers = ingredients; long = steps
    for (const l of lines.slice(1)) {
      if (l.length < 60 && /^[\d½¼¾./\s]+/.test(l)) ingLines.push(l);
      else stepLines.push(l);
    }
  }

  if (ingLines.length === 0) ingLines = ['As written — adjust to taste'];
  if (stepLines.length === 0) stepLines = ['Follow the pasted notes.', 'Taste and adjust.'];

  importSeq += 1;
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'import';
  const id = `import-${slug}-${Date.now().toString(36)}-${importSeq}`;

  return {
    id,
    chapter,
    title,
    tagline: 'Imported from a chat — tweak me anytime.',
    story: 'Pasted into the book from WhatsApp. Edit the note below if anything’s off.',
    tasteLike: 'As the cook intended.',
    texture: '—',
    cuisine: 'Home',
    difficulty: 'easy',
    spiceLevel: 0,
    allergens: [],
    prepMin: 15,
    cookMin: 30,
    servings: 4,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    tags: ['imported', 'custom'],
    ingredients: [
      {
        items: ingLines.map((line) => parseIngLine(line)),
      },
    ],
    steps: stepLines.map((instruction) => ({ instruction })),
    tips: ['Imported recipes are yours to edit — open Your notes.'],
    related: [],
    heroSeed: Math.abs(hash(id)) % 10000,
  };
}

function parseIngLine(line: string): {
  quantity: number | null;
  unit: string;
  item: string;
  note?: string;
} {
  const m = line.match(/^([\d./½¼¾]+)\s*([a-zA-Z]+)?\s+(.+)$/);
  if (!m) return { quantity: null, unit: '', item: line };
  const qtyRaw = m[1]!.replace('½', '.5').replace('¼', '.25').replace('¾', '.75');
  const quantity = Number(qtyRaw);
  return {
    quantity: Number.isFinite(quantity) ? quantity : null,
    unit: m[2] ?? '',
    item: m[3]!,
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
