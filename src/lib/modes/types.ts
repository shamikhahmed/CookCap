import type { ModeId } from '@/lib/profiles/types';

export interface ModeBoosts {
  highProtein: number;
  lowCal: number;
  highCal: number;
  lowCost: number;
  quick: number;
  fewIngredients: number;
  lowSugar: number;
  lowSodium: number;
  highFiber: number;
  makeAhead: number;
  batch: number;
  softTexture: number;
  hydrating: number;
  smallBatch: number;
}

export type ModeGroup = 'book' | 'kitchen' | 'occasion' | 'health';

export interface ModeDef {
  id: ModeId;
  label: string;
  blurb: string;
  icon: string;
  color: string;
  /** ModeChooser section — book → kitchen → occasion → health. */
  group: ModeGroup;
  boost?: Partial<ModeBoosts>;
  maxMinutes?: number;
  maxCostPerServing?: number;
  equipmentExclude?: string[];
  showCost?: boolean;
  showMacros?: boolean;
}

export const MODE_GROUP_LABELS: Record<ModeGroup, string> = {
  book: 'The book',
  kitchen: 'Kitchen lenses',
  occasion: 'Occasions',
  health: 'Health lenses',
};

export const MODE_GROUP_ORDER: ModeGroup[] = ['book', 'kitchen', 'occasion', 'health'];
