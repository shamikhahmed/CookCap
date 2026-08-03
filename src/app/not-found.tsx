import Link from 'next/link';

/** Soft 404 — book metaphor, not browser chrome. */
export default function NotFound() {
  return (
    <div className="paper-grain flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-ink-faint)]">
        Missing leaf
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-[color:var(--color-ink)]">
        That page isn’t in this book
      </h1>
      <p className="mt-3 max-w-sm text-sm text-[color:var(--color-ink-soft)]">
        The link may be old, or the recipe moved. Open the cover and start again — everything
        still lives on this device.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-medium text-white"
      >
        Back to the kitchen
      </Link>
    </div>
  );
}
