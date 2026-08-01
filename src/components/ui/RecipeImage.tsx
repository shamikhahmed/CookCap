/**
 * RecipeImage: blur manifest preferred; disk path fallback; generated art on error.
 * Skeleton while first paint / decode.
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
  const [loaded, setLoaded] = useState(false);
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
    <>
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-[color:var(--color-paper-sunk)]"
          aria-hidden
        />
      )}
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
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </>
  );
}
