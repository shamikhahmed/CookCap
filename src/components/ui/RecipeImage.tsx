/**
 * RecipeImage: user IDB hero → blur manifest → disk → generated art.
 * Skeleton while first paint / decode.
 */
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getImage } from '@/lib/recipes/images';
import { generateHero } from '@/lib/recipes/hero';
import { withBase } from '@/lib/base-path';

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
  userSrc,
}: {
  recipeId: string;
  seed: number;
  tab: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Object URL from IDB user-heroes — wins over bundled. */
  userSrc?: string | null;
}) {
  const meta = getImage(recipeId);
  const [failed, setFailed] = useState(!meta && !userSrc);
  const [loaded, setLoaded] = useState(false);
  const [userFailed, setUserFailed] = useState(false);

  if (userSrc && !userFailed) {
    return (
      <>
        {!loaded && (
          <div
            className="absolute inset-0 animate-pulse bg-[color:var(--color-paper-sunk)]"
            aria-hidden
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- blob:/object URL */}
        <img
          src={userSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setUserFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        />
      </>
    );
  }

  if (!meta || failed) {
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

  const src = meta.src ?? withBase(`/recipes/${recipeId}.webp`);
  const blur = meta.blurDataURL ?? EMPTY_BLUR;

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
