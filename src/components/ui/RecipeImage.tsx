/**
 * RecipeImage: prefer blur manifest; if missing, still try /recipes/<id>.webp
 * so orphans on disk don't fall back to abstract blobs.
 */
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getImage } from '@/lib/recipes/images';
import { generateHero } from '@/lib/recipes/hero';

const EMPTY_BLUR =
  'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

export function RecipeImage({
  recipeId,
  seed,
  tab,
  alt,
  sizes = '(max-width: 640px) 100vw, 560px',
  priority = false,
  className = '',
}: {
  recipeId: string;
  seed: number;
  tab: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const meta = getImage(recipeId);
  const [failed, setFailed] = useState(false);
  const src = meta?.src ?? `/recipes/${recipeId}.webp`;
  const blur = meta?.blurDataURL ?? EMPTY_BLUR;

  if (failed) {
    return (
      <div
        className={`absolute inset-0 h-full w-full ${className}`}
        role="img"
        aria-label={alt}
        // eslint-disable-next-line react/no-danger -- generated, trusted SVG
        dangerouslySetInnerHTML={{ __html: generateHero(seed, tab) }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={82}
      priority={priority}
      unoptimized
      placeholder="blur"
      blurDataURL={blur}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
