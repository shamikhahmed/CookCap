import type { ModeId } from '@/lib/profiles/types';
import type { ModeDef } from './types';

export const MODES: ModeDef[] = [
  {
    id: 'reader',
    label: 'Reader',
    blurb: 'The pure book — no scoring, no chrome.',
    icon: 'book',
    color: '#8a6b4a',
    group: 'book',
  },
  {
    id: 'plate',
    label: 'My Plate',
    blurb: 'Goal-fit recipes, macros, and healthier swaps.',
    icon: 'flame-cal',
    color: '#c96b4a',
    group: 'kitchen',
    boost: { highProtein: 1.4, lowCal: 0.8 },
    showMacros: true,
  },
  {
    id: 'mother',
    label: 'Mother Mode',
    blurb: 'Cook for others — scale servings, flag allergens.',
    icon: 'users',
    color: '#c96b8f',
    group: 'kitchen',
    boost: { makeAhead: 0.6, batch: 0.5 },
    showMacros: true,
  },
  {
    id: 'budget',
    label: 'Student / Budget',
    blurb: 'Cheap protein, pantry staples, weekly grocery cap.',
    icon: 'leaf',
    color: '#5a8a6a',
    group: 'kitchen',
    boost: { lowCost: 1.6, batch: 1.0, fewIngredients: 0.6 },
    maxCostPerServing: 250,
    showCost: true,
  },
  {
    id: 'quick',
    label: 'Quick',
    blurb: 'Weeknight rescue — under 20 minutes.',
    icon: 'bolt',
    color: '#c7913f',
    group: 'kitchen',
    boost: { quick: 1.8, fewIngredients: 0.8 },
    maxMinutes: 20,
  },
  {
    id: 'beginner',
    label: 'First Kitchen',
    blurb: 'Few ingredients, foolproof steps, no fancy gear.',
    icon: 'whisk',
    color: '#b58a5c',
    group: 'kitchen',
    boost: { fewIngredients: 1.4, quick: 0.4 },
    equipmentExclude: ['stand mixer', 'food processor', 'immersion blender'],
  },
  {
    id: 'couple',
    label: 'Couple / Just-me',
    blurb: 'Small-batch defaults for one or two.',
    icon: 'users',
    color: '#8a6b9e',
    group: 'kitchen',
    boost: { smallBatch: 1.2, fewIngredients: 0.5 },
  },
  {
    id: 'dawat',
    label: 'Dawat / Event',
    blurb: 'Crowd-friendly, make-ahead, feast timeline.',
    icon: 'sparkle',
    color: '#a3552a',
    group: 'occasion',
    boost: { makeAhead: 1.4, batch: 1.2 },
  },
  {
    id: 'ramadan',
    label: 'Ramadan',
    blurb: 'Sehri & iftar picks — hydrating, slow energy.',
    icon: 'moon',
    color: '#6b8cae',
    group: 'occasion',
    boost: { hydrating: 1.2, highFiber: 0.8, makeAhead: 0.6 },
    showMacros: true,
  },
  {
    id: 'toddler',
    label: 'Toddler',
    blurb: 'Soft, gentle spice, kid-friendly portions.',
    icon: 'sprout',
    color: '#d98a4e',
    group: 'occasion',
    boost: { softTexture: 1.4, lowSodium: 0.8 },
  },
  {
    id: 'diabetic',
    label: 'Diabetic-friendly',
    blurb: 'Lower sugar focus. Estimates only — not medical advice.',
    icon: 'gauge',
    color: '#6b8cae',
    group: 'health',
    boost: { lowSugar: 1.6, highFiber: 1.0, lowCal: 0.5 },
    showMacros: true,
  },
  {
    id: 'heart',
    label: 'Heart-smart',
    blurb: 'Leaner picks. Estimates only — not medical advice.',
    icon: 'heart',
    color: '#c96b8f',
    group: 'health',
    boost: { lowSodium: 1.2, lowCal: 0.8, highFiber: 0.6 },
    showMacros: true,
  },
  {
    id: 'fiber',
    label: 'High-fiber',
    blurb: 'Gut-friendly fiber boosts. Estimates only.',
    icon: 'wheat',
    color: '#5a8a6a',
    group: 'health',
    boost: { highFiber: 1.8, lowCal: 0.3 },
    showMacros: true,
  },
];

const BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<ModeId, ModeDef>;

export function getMode(id: ModeId): ModeDef {
  return BY_ID[id] ?? BY_ID.reader;
}

export function listModes(): ModeDef[] {
  return MODES;
}
