'use client';

import type { Leaf } from '@/lib/book/pages';
import { LeafView } from './LeafView';

/** Off-screen mounted neighbors so flip finds DOM + images already warm. */
function leafKey(leaf: Leaf, i: number): string {
  if (leaf.kind === 'recipe') return `recipe:${leaf.recipeId}`;
  if (leaf.kind === 'chapter') return `chapter:${leaf.chapter}`;
  return `${leaf.kind}:${i}`;
}

/** Full recipe DOM for immediate neighbors; hero shell farther out. */
const FULL_OFFSETS = [-1, 1] as const;
const SHELL_OFFSETS = [-3, -2, 2, 3, 4] as const;

export function WarmLeafPool({ index, leaves }: { index: number; leaves: Leaf[] }) {
  const full = FULL_OFFSETS.map((d) => index + d).filter((i) => i >= 0 && i < leaves.length);
  const shell = SHELL_OFFSETS.map((d) => index + d).filter((i) => i >= 0 && i < leaves.length);

  return (
    <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
      {full.map((i) => {
        const leaf = leaves[i]!;
        return (
          <div key={`full:${leafKey(leaf, i)}`} className="relative h-[720px] w-[560px]">
            <LeafView leaf={leaf} prefetch />
          </div>
        );
      })}
      {shell.map((i) => {
        const leaf = leaves[i]!;
        return (
          <div key={`shell:${leafKey(leaf, i)}`} className="relative h-[720px] w-[560px]">
            <LeafView leaf={leaf} passive />
          </div>
        );
      })}
    </div>
  );
}
