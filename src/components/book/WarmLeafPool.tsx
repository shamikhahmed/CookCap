'use client';

import type { Leaf } from '@/lib/book/pages';
import { LeafView } from './LeafView';

/** Off-screen mounted neighbors so flip finds DOM + images already warm. */
function leafKey(leaf: Leaf, i: number): string {
  if (leaf.kind === 'recipe') return `recipe:${leaf.recipeId}`;
  if (leaf.kind === 'chapter') return `chapter:${leaf.chapter}`;
  return `${leaf.kind}:${i}`;
}

const OFFSETS = [-3, -2, -1, 1, 2, 3, 4] as const;

export function WarmLeafPool({ index, leaves }: { index: number; leaves: Leaf[] }) {
  const indices = OFFSETS.map((d) => index + d).filter((i) => i >= 0 && i < leaves.length);

  return (
    <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
      {indices.map((i) => {
        const leaf = leaves[i]!;
        return (
          <div key={leafKey(leaf, i)} className="relative h-[720px] w-[560px]">
            <LeafView leaf={leaf} passive />
          </div>
        );
      })}
    </div>
  );
}
