'use client';

import type { Leaf } from '@/lib/book/pages';
import { CoverLeaf } from './leaves/CoverLeaf';
import { TitleLeaf } from './leaves/TitleLeaf';
import { FriendsLeaf } from './leaves/FriendsLeaf';
import { ContentsLeaf } from './leaves/ContentsLeaf';
import { ChapterLeaf } from './leaves/ChapterLeaf';
import { ForYouLeaf } from './leaves/ForYouLeaf';
import { RecipeLeaf } from './leaves/RecipeLeaf';

/** Maps a leaf descriptor to its rendered page content. */
export function LeafView({ leaf, passive = false }: { leaf: Leaf; passive?: boolean }) {
  switch (leaf.kind) {
    case 'cover':
      return <CoverLeaf />;
    case 'title':
      return <TitleLeaf />;
    case 'friends':
      return <FriendsLeaf />;
    case 'contents':
      return <ContentsLeaf />;
    case 'foryou':
      return <ForYouLeaf />;
    case 'chapter':
      return <ChapterLeaf chapter={leaf.chapter} />;
    case 'recipe':
      return <RecipeLeaf recipeId={leaf.recipeId} passive={passive} />;
  }
}
