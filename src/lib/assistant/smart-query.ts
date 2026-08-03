import type { Recipe } from '@/lib/recipes/types';

/** Rules-based smart query — never LLM. */
export type SmartQuery = {
  cleaned: string;
  maxMinutes?: number;
  mustIngredients: string[];
  hint?: string;
};

const TIME_RE = /\b(\d+)\s*(?:min|mins|minutes?|m)\b/i;
const UNDER_RE = /\b(?:under|less than|≤|<)\s*(\d+)\s*(?:min|mins|minutes?|m)?\b/i;

/** Parse phrases like "30 min yogurt" or "under 20 chicken". */
export function parseSmartQuery(raw: string): SmartQuery {
  let cleaned = raw.trim();
  const mustIngredients: string[] = [];
  let maxMinutes: number | undefined;
  const hints: string[] = [];

  const under = cleaned.match(UNDER_RE);
  if (under) {
    maxMinutes = Number(under[1]);
    cleaned = cleaned.replace(UNDER_RE, ' ').trim();
    hints.push(`≤${maxMinutes} min`);
  } else {
    const t = cleaned.match(TIME_RE);
    if (t) {
      maxMinutes = Number(t[1]);
      cleaned = cleaned.replace(TIME_RE, ' ').trim();
      hints.push(`~${maxMinutes} min`);
    }
  }

  const tokens = cleaned
    .toLowerCase()
    .split(/[\s,+/]+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 3 && !['with', 'and', 'the', 'for', 'recipe'].includes(x));

  for (const tok of tokens) {
    if (/^(easy|hard|medium|quick|veg|vegan)$/.test(tok)) continue;
    mustIngredients.push(tok);
  }

  cleaned = tokens.join(' ');
  return {
    cleaned,
    maxMinutes,
    mustIngredients,
    hint: hints.length || mustIngredients.length
      ? [...hints, ...mustIngredients.map((i) => `has ${i}`)].join(' · ')
      : undefined,
  };
}

/** Apply smart constraints after text search. */
export function filterSmart(recipes: Recipe[], smart: SmartQuery): Recipe[] {
  return recipes.filter((r) => {
    if (smart.maxMinutes != null && r.prepMin + r.cookMin > smart.maxMinutes) return false;
    if (smart.mustIngredients.length === 0) return true;
    const hay = [
      r.title,
      ...r.tags,
      ...r.ingredients.flatMap((g) => g.items.map((i) => i.item)),
    ]
      .join(' ')
      .toLowerCase();
    return smart.mustIngredients.every((ing) => hay.includes(ing));
  });
}
