import type { Chapter } from './types';

/**
 * Chapters. Order = bookmark tab order + page-turn order.
 * Numbers on dividers derive from this array.
 */
export const CHAPTERS: Chapter[] = [
  {
    id: 'pakistani',
    title: 'Pakistani',
    subtitle: 'Home, in spices',
    blurb: 'The food I grew up on — built in slow, patient layers of spice.',
    quote: '“This is the smell of my mother’s kitchen on a Sunday.”',
    tab: '#4f7a4a',
    icon: 'flame',
  },
  {
    id: 'chinese',
    title: 'Chinese',
    subtitle: 'The wok sings',
    blurb: 'Fast, hot, and balanced — everything ready before the pan is.',
    quote: '“Have everything chopped first. Then it’s over in a minute.”',
    tab: '#c23a2a',
    icon: 'chili',
  },
  {
    id: 'italian',
    title: 'Italian',
    subtitle: 'Few things, done well',
    blurb: 'A short list of good ingredients, treated with a little respect.',
    quote: '“You don’t need much. You just need to pay attention.”',
    tab: '#a3552a',
    icon: 'olive',
  },
  {
    id: 'desserts',
    title: 'Desserts',
    subtitle: 'A little theatre',
    blurb: 'The sweet ending. Weigh carefully and don’t rush the chilling.',
    quote: '“Dessert is where I show off. Let me.”',
    tab: '#c96b8f',
    icon: 'cake',
  },
  {
    id: 'coffee',
    title: 'Coffee & Chai',
    subtitle: 'Something warm',
    blurb: 'The cup that starts the morning and ends the meal.',
    quote: '“Sit. Have chai first. The cooking can wait.”',
    tab: '#8a5a3a',
    icon: 'cup',
  },
  {
    id: 'breads',
    title: 'Breads',
    subtitle: 'Flour & patience',
    blurb: 'Dough asks for time, not effort. Let it do the work.',
    quote: '“Bread teaches you to slow down. Trust it.”',
    tab: '#b58a5c',
    icon: 'wheat',
  },
  {
    id: 'baking',
    title: 'Baking',
    subtitle: 'The cosy chemistry',
    blurb: 'Weigh, whisk, and trust the oven. This is my happy place.',
    quote: '“Baking is just chemistry that smells wonderful.”',
    tab: '#c7913f',
    icon: 'whisk',
  },
  {
    id: 'snacks',
    title: 'Easy Snacks',
    subtitle: 'Little bites',
    blurb: 'For the in-between hours, and the friends who drop by.',
    quote: '“Someone’s always hungry. This is for them.”',
    tab: '#d0724a',
    icon: 'cookie',
  },
  {
    id: 'meals',
    title: 'Easy Meals',
    subtitle: 'Weeknight suppers',
    blurb: 'Real dinners for real evenings — kind to your time.',
    quote: '“Tired is not an excuse for a sad dinner.”',
    tab: '#6f9a5f',
    icon: 'pot',
  },
  {
    id: 'favorites',
    title: 'Favorites',
    subtitle: 'The ones we make most',
    blurb: 'The recipes we come back to again and again. Tap a heart, and yours gather here too.',
    quote: '“If we could only keep a handful, it would be these.”',
    tab: '#c98a2e',
    icon: 'heart',
  },
  {
    id: 'tips',
    title: 'Tips & Tricks',
    subtitle: 'What I wish I’d known',
    blurb: 'Small lessons from years of burnt onions and happy accidents.',
    quote: '“Every mistake in here, I made first — so you don’t have to.”',
    tab: '#7c6f9a',
    icon: 'sparkle',
  },
];

export const CHAPTER_MAP = Object.fromEntries(CHAPTERS.map((c) => [c.id, c])) as Record<
  Chapter['id'],
  Chapter
>;

/** Chapter display number (I, II, III…) derived from physical order. */
export const chapterNumeral = (id: string): string => {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  const romans = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII',
    'XIII',
    'XIV',
    'XV',
  ];
  return i >= 0 ? (romans[i] ?? String(i + 1)) : '';
};
