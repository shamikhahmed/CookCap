import type { Recipe } from '@/lib/recipes/types';

export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type WeekPlan = Partial<Record<Day, string>>;

export type OccasionTemplate = {
  id: string;
  label: string;
  blurb: string;
  prefer: string[];
  tags: string[];
};

export const OCCASION_TEMPLATES: OccasionTemplate[] = [
  {
    id: 'ramadan-iftar',
    label: 'Ramadan iftar week',
    blurb: 'Hydrating, make-ahead friendly evenings.',
    prefer: ['fruit-chaat', 'masala-chai', 'seekh-kebab', 'jia-sunday-biryani', 'mint-raita'],
    tags: ['hydrating', 'make-ahead', 'kebab', 'festive'],
  },
  {
    id: 'eid-feast',
    label: 'Eid feast',
    blurb: 'Festive mains + sweet finish.',
    prefer: ['jia-sunday-biryani', 'saadi-biryani-chicken', 'kheer', 'seekh-kebab', 'boondi-raita'],
    tags: ['festive', 'biryani', 'dessert'],
  },
  {
    id: 'rainy-day',
    label: 'Rainy-day comfort',
    blurb: 'Chai, soft carbs, gentle spice.',
    prefer: ['masala-chai', 'paratha', 'roti', 'banana-bread', 'fruit-chaat'],
    tags: ['comfort', 'quick', 'bread'],
  },
];

const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function buildWeekFromTemplate(
  template: OccasionTemplate,
  pool: Recipe[],
): WeekPlan {
  const byId = new Map(pool.map((r) => [r.id, r]));
  const picked: string[] = [];
  for (const id of template.prefer) {
    if (byId.has(id) && !picked.includes(id)) picked.push(id);
  }
  if (picked.length < 7) {
    const scored = pool
      .filter((r) => r.chapter !== 'tips' && !picked.includes(r.id))
      .map((r) => {
        const score = template.tags.reduce(
          (s, t) => s + (r.tags.some((x) => x.toLowerCase().includes(t)) ? 2 : 0),
          0,
        );
        return { id: r.id, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    for (const s of scored) {
      if (picked.length >= 7) break;
      picked.push(s.id);
    }
  }
  const plan: WeekPlan = {};
  DAYS.forEach((day, i) => {
    const id = picked[i % Math.max(1, picked.length)];
    if (id) plan[day] = id;
  });
  return plan;
}

export function occasionRail(
  template: OccasionTemplate,
  pool: Recipe[],
  limit = 4,
): Recipe[] {
  const out: Recipe[] = [];
  const byId = new Map(pool.map((r) => [r.id, r]));
  for (const id of template.prefer) {
    const r = byId.get(id);
    if (r) out.push(r);
    if (out.length >= limit) return out;
  }
  for (const r of pool) {
    if (out.some((x) => x.id === r.id)) continue;
    if (template.tags.some((t) => r.tags.some((x) => x.toLowerCase().includes(t)))) {
      out.push(r);
      if (out.length >= limit) break;
    }
  }
  return out;
}
