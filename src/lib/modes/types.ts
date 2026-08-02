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

export interface ModeDef {
  id: ModeId;
  label: string;
  blurb: string;
  icon: string;
  color: string;
  boost?: Partial<ModeBoosts>;
  maxMinutes?: number;
  maxCostPerServing?: number;
  equipmentExclude?: string[];
  showCost?: boolean;
  showMacros?: boolean;
}
