'use client';

/**
 * The title page — the first spread after the cover opens. Hand-lettered feel
 * for "Jia Cooks", framed by cozy kitchen doodles (herbs, flour, a whisk, a
 * little flower, a pinned recipe note). CSS-animated so it always paints.
 */
export function TitleLeaf() {
  return (
    <div
      data-tap-advance
      className="paper-grain relative flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden px-8 text-center"
    >
      {/* Scattered doodles */}
      <Doodle className="left-6 top-10 rotate-[-8deg]" name="sprig" />
      <Doodle className="right-7 top-12 rotate-[10deg]" name="flower" />
      <Doodle className="left-10 bottom-16 rotate-[6deg]" name="whisk" />
      <Doodle className="right-9 bottom-14 rotate-[-10deg]" name="note" />
      <Doodle className="left-1/2 top-6 -translate-x-1/2" name="flour" />

      <div className="cover-rise relative z-10">
        <p className="mb-3 font-serif text-sm uppercase tracking-[0.5em] text-[color:var(--color-ink-faint)]">
          A Family Cookbook
        </p>
        <h1 className="font-serif text-[clamp(3rem,12vw,5.5rem)] font-black italic leading-[0.9] tracking-tight text-[color:var(--color-ink)]">
          Jia
          <br />
          <span className="text-[color:var(--color-accent)]">Cooks</span>
        </h1>
        <div className="mx-auto my-6 flex items-center justify-center gap-3 text-[color:var(--color-gold)]">
          <span className="h-px w-10 bg-current" />
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" fill="currentColor" />
          </svg>
          <span className="h-px w-10 bg-current" />
        </div>
        <p className="mx-auto max-w-xs font-serif text-lg italic text-[color:var(--color-ink-soft)] text-balance">
          Recipes, stories, and a little mess — written down so they’re never lost.
        </p>
        <p className="mt-6 font-serif text-base text-[color:var(--color-ink-faint)]">
          — with love, Jia
        </p>
      </div>
    </div>
  );
}

function Doodle({ name, className = '' }: { name: string; className?: string }) {
  const stroke = 'var(--color-ink-faint)';
  const paths: Record<string, React.ReactNode> = {
    sprig: (
      <path
        d="M20 4C14 10 12 20 14 34M14 20c-4-2-8-1-10 2M15 26c4-2 8-1 10 2M14 14c-4-1-7 1-8 4"
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    ),
    flower: (
      <g fill="none" stroke={stroke} strokeWidth="1.4">
        <circle cx="18" cy="14" r="3" />
        <path d="M18 14c0-6 6-8 8-4-2 4-6 4-8 4ZM18 14c0-6-6-8-8-4 2 4 6 4 8 4ZM18 14c4 2 4 8 0 10-4-2-4-8 0-10ZM18 30V22" />
      </g>
    ),
    whisk: (
      <g fill="none" stroke={stroke} strokeWidth="1.4">
        <path d="M18 6C10 12 10 24 18 32C26 24 26 12 18 6ZM18 6v26M12 14c8 6 8 12 0 18M24 14c-8 6-8 12 0 18" />
        <path d="M15 32h6v8h-6z" />
      </g>
    ),
    note: (
      <g fill="none" stroke={stroke} strokeWidth="1.4">
        <rect x="6" y="8" width="28" height="24" rx="2" />
        <path d="M11 15h18M11 20h18M11 25h12" />
        <circle cx="20" cy="8" r="2.5" fill={stroke} />
      </g>
    ),
    flour: (
      <g fill="none" stroke={stroke} strokeWidth="1.4">
        <path d="M12 12h16l-2 22H14Z" />
        <path d="M12 12c0-3 3-5 8-5s8 2 8 5" />
        <path d="M17 20c1 1 2 1 3 0M22 25c1 1 2 1 3 0" />
      </g>
    ),
  };
  return (
    <span className={`pointer-events-none absolute z-0 opacity-50 ${className}`} aria-hidden>
      <svg width="40" height="44" viewBox="0 0 40 44">
        {paths[name]}
      </svg>
    </span>
  );
}
