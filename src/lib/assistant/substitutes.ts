/** Rules-based pantry swaps — never LLM. */

const PAIRS: { match: RegExp; to: string }[] = [
  { match: /\byogurt\b|\bdahi\b/i, to: 'plain Greek yogurt or sour cream' },
  { match: /\bcream\b/i, to: 'evaporated milk or coconut cream' },
  { match: /\bbutter\b/i, to: 'ghee or neutral oil' },
  { match: /\bghee\b/i, to: 'butter or neutral oil' },
  { match: /\bamchur\b/i, to: 'lemon juice or vinegar' },
  { match: /\bkashmiri\b/i, to: 'paprika + pinch cayenne' },
  { match: /\bcoconut milk\b/i, to: 'evaporated milk + splash water' },
  { match: /\bpaneer\b/i, to: 'firm tofu or halloumi' },
  { match: /\bchicken thigh\b/i, to: 'chicken breast (less juicy)' },
  { match: /\bbasmati\b/i, to: 'any long-grain rice' },
];

export type SwapHint = { from: string; to: string };

/** Suggest swaps for ingredient names present on a recipe. */
export function suggestSwaps(ingredientNames: string[], limit = 4): SwapHint[] {
  const out: SwapHint[] = [];
  const seen = new Set<string>();
  for (const name of ingredientNames) {
    for (const p of PAIRS) {
      if (!p.match.test(name)) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ from: name, to: p.to });
      if (out.length >= limit) return out;
    }
  }
  return out;
}
