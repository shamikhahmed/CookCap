/**
 * Jia's Kitchen Friends — the little cast that appears through the book. Each is
 * a hand-drawn character (see CharacterArt.tsx) with a one-line personality and
 * the job they help with. Kept as data so friends can be reused anywhere (intro
 * spread, empty states, loading messages) and stay stylistically consistent.
 */
export interface Friend {
  id: string;
  name: string;
  role: string;
  personality: string;
  /** Base colour used for the character + its little name card. */
  color: string;
}

export const FRIENDS: Friend[] = [
  {
    id: 'mr-pots',
    name: 'Mr Pots',
    role: 'Simmers & stews',
    personality: 'Steady and warm. Never rushes a good braise.',
    color: '#5a8a6a',
  },
  {
    id: 'spoon-bubs',
    name: 'Baby Spoon Bubs',
    role: 'Tastes everything',
    personality: 'Cheeky. Always sneaks the first bite.',
    color: '#d98a4e',
  },
  {
    id: 'chef-whisk',
    name: 'Chef Whisk',
    role: 'Whips & folds',
    personality: 'Energetic to a fault. Cannot sit still.',
    color: '#c7913f',
  },
  {
    id: 'miss-rolling-pin',
    name: 'Miss Rolling Pin',
    role: 'Rolls the dough',
    personality: 'Calm and precise. Believes in even pressure.',
    color: '#b58a5c',
  },
  {
    id: 'tiny-timer',
    name: 'Tiny Timer',
    role: 'Keeps the time',
    personality: 'A worrier. Ticks so you never burn a thing.',
    color: '#c96b8f',
  },
  {
    id: 'captain-oven',
    name: 'Captain Oven',
    role: 'Bakes & roasts',
    personality: 'Big-hearted and toasty. Gives the best hugs.',
    color: '#a3552a',
  },
  {
    id: 'air-fryer-buddy',
    name: 'Air Fryer Buddy',
    role: 'Crisps in a hurry',
    personality: 'The speedy one. Loud, but gets it done.',
    color: '#6a8fae',
  },
  {
    id: 'mixer-max',
    name: 'Mixer Max',
    role: 'Does the heavy mixing',
    personality: 'Strong and dependable. Hums while he works.',
    color: '#7c6f9a',
  },
];
