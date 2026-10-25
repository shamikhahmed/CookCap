'use client';

import { useBook } from '@/components/book/BookController';
import { useApp } from '@/components/app/AppStore';
import { PRODUCT_NAME } from '@/lib/edition';
import { getCatalogRecipeCount } from '@/lib/recipes/count';

/**
 * The closed-book cover, rendered as the first leaf. Embossed gold title on
 * grained leather, with a subtle spine highlight. Tapping it "opens" the book.
 *
 * Brand hierarchy: big personal title (or Our Family / Cookbook), tiny CookCap
 * foil mark as publisher at the bottom. Optional user cover photo under scrim.
 *
 * Open control is a sibling button (not a role=button wrapper) so photo
 * controls are not nested interactive (axe nested-interactive). Photo file
 * input is created on demand so LH label audit stays clean.
 */
export function CoverLeaf() {
  const { next } = useBook();
  const { edition, editionReady, coverUrl, setCoverPhoto, clearCoverPhoto } = useApp();
  // CK-V3-1 / 3.6.1: keep cover copy out of the DOM until edition resolves post-mount
  // so SSR HTML never disagrees with the first client tree (React #418).
  const openLabel = editionReady
    ? `${edition.coverLine1} ${edition.coverLine2} — Tap to open`
    : 'Open cookbook';

  return (
    <div
      data-tap-advance
      className="leather relative flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden text-center"
    >
      <button
        type="button"
        className="absolute inset-0 z-[5] cursor-pointer bg-transparent"
        aria-label={openLabel}
        onClick={() => next()}
      />

      {coverUrl && (
        <img
          src={coverUrl}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
        />
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-6 bg-gradient-to-r from-black/40 to-transparent" />
      <div
        className={`pointer-events-none absolute inset-0 z-[1] rounded-[inherit] ${
          coverUrl ? 'bg-black/45 shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]' : 'shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]'
        }`}
      />

      <div className="foil-sweep pointer-events-none absolute inset-0 z-20" />

      <div className="pointer-events-none absolute inset-6 z-[2] rounded-lg border border-[color:var(--color-gold)]/40" />
      <div className="pointer-events-none absolute inset-8 z-[2] rounded-md border border-[color:var(--color-gold)]/25" />

      <div
        className="cover-rise pointer-events-none relative z-10 px-10 transition-opacity duration-300"
        style={{ opacity: editionReady ? 1 : 0 }}
      >
        {editionReady ? (
          <>
            {/* Small caps: solid ink (≥4.5:1). Foil reserved for the big title only. */}
            <p className="cover-meta mb-6 font-sans text-xs font-semibold tracking-[0.02em] text-[color:var(--color-ink-soft)]">
              {edition.coverEyebrow}
            </p>
            <h1 className="gold-foil text-balance font-serif text-[clamp(2.8rem,9vw,4.6rem)] font-black italic leading-[0.92] tracking-tight">
              {edition.coverLine1}
              <br />
              {edition.coverLine2}
            </h1>
            <div className="mx-auto my-8 h-px w-24 bg-gradient-to-r from-transparent via-[color:var(--color-gold)]/60 to-transparent" />
            <p className="cover-meta font-sans text-xs font-semibold tracking-[0.02em] text-[color:var(--color-ink-soft)]">
              {edition.tagline}
            </p>
            <p className="cover-meta mt-3 font-sans text-xs font-semibold tracking-[0.02em] text-[color:var(--color-ink-soft)]">
              {getCatalogRecipeCount()} recipes
            </p>
          </>
        ) : null}
      </div>

      <div className="absolute bottom-[4.5rem] z-30 flex gap-2" data-no-flip>
        <button
          type="button"
          className="cover-photo-btn relative z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink)] shadow-[var(--shadow-sm)]"
          aria-label={coverUrl ? 'Change cover photo' : 'Add cover photo'}
          onClick={(e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
              const f = input.files?.[0];
              if (f) void setCoverPhoto(f);
            };
            input.click();
          }}
        >
          {coverUrl ? 'Change photo' : 'Add photo'}
        </button>
        {coverUrl && (
          <button
            type="button"
            className="cover-photo-btn relative z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink)] shadow-[var(--shadow-sm)]"
            onClick={(e) => {
              e.stopPropagation();
              void clearCoverPhoto();
            }}
          >
            Remove
          </button>
        )}
      </div>

      <span className="cover-hint cover-meta pointer-events-none absolute bottom-14 z-10 text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--color-ink-soft)]">
        Tap to open
      </span>
      <span
        className="cover-meta pointer-events-none absolute bottom-5 z-10 font-serif text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--color-ink-soft)]"
        aria-hidden
      >
        {PRODUCT_NAME}
      </span>
    </div>
  );
}
