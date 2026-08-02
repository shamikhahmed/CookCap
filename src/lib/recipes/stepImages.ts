import generated from './step-images.generated.json';
import { withBase } from '@/lib/base-path';

/** Build-time map of process photos for Method steps (see scripts/fetch-step-images.mjs). */
const MAP = generated as Record<string, string[]>;

/**
 * Prefer explicit `step.image`. Else place up to 3 process photos on first /
 * middle / last steps so Method reads like a family cook card with pictures.
 */
export function stepImageFor(
  recipeId: string,
  stepIndex: number,
  stepCount: number,
  explicit?: string,
): string | undefined {
  if (explicit) return withBase(explicit);
  const list = MAP[recipeId];
  if (!list?.length || stepCount <= 0) return undefined;

  const first = list[0];
  if (!first) return undefined;

  const slots = new Map<number, string>();
  slots.set(0, first);
  const mid = list[1];
  const last = list[2];
  if (mid && stepCount > 2) {
    slots.set(Math.floor((stepCount - 1) / 2), mid);
  } else if (mid && stepCount === 2) {
    slots.set(1, mid);
  }
  if (last && stepCount > 2) {
    slots.set(stepCount - 1, last);
  }
  const path = slots.get(stepIndex);
  return path ? withBase(path) : undefined;
}

export function hasStepImages(recipeId: string): boolean {
  return (MAP[recipeId]?.length ?? 0) > 0;
}
