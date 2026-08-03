'use client';

/**
 * Designed recovery screen — replaces raw Next overlay for route errors.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="paper-grain flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-ink-faint)]">
        Kitchen pause
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-[color:var(--color-ink)]">
        Something spilled
      </h1>
      <p className="mt-3 max-w-sm text-sm text-[color:var(--color-ink-soft)]">
        A page didn’t load cleanly — often a stale cache after an update. Try again; your
        recipes stay on this device.
      </p>
      {error?.digest ? (
        <p className="mt-2 text-[0.65rem] tabular-nums text-[color:var(--color-ink-faint)]">
          {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 min-h-11 rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-medium text-white"
      >
        Try again
      </button>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 min-h-11 rounded-full px-5 text-sm text-[color:var(--color-ink-soft)]"
      >
        Reload kitchen
      </button>
    </div>
  );
}
