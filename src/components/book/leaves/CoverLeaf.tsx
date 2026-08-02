'use client';

import { useBook } from '@/components/book/BookController';
import { useApp } from '@/components/app/AppStore';
import { PRODUCT_NAME } from '@/lib/edition';

/**
 * The closed-book cover, rendered as the first leaf. Embossed gold title on
 * grained leather, with a subtle spine highlight. Tapping it "opens" the book.
 *
 * Brand hierarchy: big personal title (or Our Family / Cookbook), tiny CookCap
 * foil mark as publisher at the bottom.
 */
export function CoverLeaf() {
  const { next } = useBook();
  const { edition, editionReady } = useApp();

  return (
    <div
      data-tap-advance
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          next();
        }
      }}
      className="leather relative flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden text-center"
      aria-label="Open the cookbook"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />

      <div className="foil-sweep pointer-events-none absolute inset-0 z-20" />

      <div className="pointer-events-none absolute inset-6 rounded-lg border border-[color:var(--color-gold)]/40" />
      <div className="pointer-events-none absolute inset-8 rounded-md border border-[color:var(--color-gold)]/25" />

      <div
        className="cover-rise relative z-10 px-10 transition-opacity duration-300"
        style={{ opacity: editionReady ? 1 : 0 }}
      >
        <p className="gold-foil mb-6 text-sm uppercase tracking-[0.5em]" suppressHydrationWarning>
          {edition.coverEyebrow}
        </p>
        <h1
          className="gold-foil text-balance font-serif text-[clamp(2.8rem,9vw,4.6rem)] font-black italic leading-[0.92] tracking-tight"
          suppressHydrationWarning
        >
          {edition.coverLine1}
          <br />
          {edition.coverLine2}
        </h1>
        <div className="mx-auto my-8 h-px w-24 bg-gradient-to-r from-transparent via-[color:var(--color-gold)]/60 to-transparent" />
        <p className="gold-foil text-xs uppercase tracking-[0.4em] opacity-80" suppressHydrationWarning>
          {edition.tagline}
        </p>
      </div>

      <span className="cover-hint absolute bottom-14 z-10 text-xs uppercase tracking-[0.35em] text-[color:var(--color-gold)]/70">
        Tap to open
      </span>
      <span
        className="absolute bottom-5 z-10 font-serif text-[0.65rem] uppercase tracking-[0.35em] text-[color:var(--color-gold)]/55"
        aria-hidden
      >
        {PRODUCT_NAME}
      </span>
    </div>
  );
}
