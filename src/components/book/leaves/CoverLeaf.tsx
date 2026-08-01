'use client';

import { useBook } from '@/components/book/BookController';
import { useApp } from '@/components/app/AppStore';

/**
 * The closed-book cover, rendered as the first leaf. Embossed gold title on
 * grained leather, with a subtle spine highlight. Tapping it "opens" the book.
 *
 * The reveal uses CSS animation (not JS) so the title is never gated on a
 * framer mount effect — the cover is the first impression and must always paint.
 * `prefers-reduced-motion` collapses the animation via the global reset.
 */
export function CoverLeaf() {
  const { next } = useBook();
  const { edition, editionReady } = useApp();
  const titleParts = edition.bookTitle.split(/\s+/);
  const twoLine = titleParts.length === 2;

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

      {/* Light sweep that travels across the gold foil once on open. */}
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
          className="gold-foil font-serif text-[clamp(2.8rem,9vw,4.6rem)] font-black italic leading-[0.92] tracking-tight"
          suppressHydrationWarning
        >
          {twoLine ? (
            <>
              {titleParts[0]}
              <br />
              {titleParts[1]}
            </>
          ) : (
            edition.bookTitle
          )}
        </h1>
        <div className="mx-auto my-8 h-px w-24 bg-gradient-to-r from-transparent via-[color:var(--color-gold)]/60 to-transparent" />
        <p className="gold-foil text-xs uppercase tracking-[0.4em] opacity-80" suppressHydrationWarning>
          {edition.tagline}
        </p>
      </div>

      <span className="cover-hint absolute bottom-8 z-10 text-xs uppercase tracking-[0.35em] text-[color:var(--color-gold)]/70">
        Tap to open
      </span>
    </div>
  );
}
