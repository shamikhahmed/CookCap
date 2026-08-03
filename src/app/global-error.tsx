'use client';

/**
 * Root error UI (replaces Next default when layout itself fails).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'Georgia, serif',
          background: '#2e241c',
          color: '#f7f0e6',
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div>
          <p style={{ letterSpacing: '0.35em', fontSize: 12, textTransform: 'uppercase', opacity: 0.7 }}>
            Kitchen pause
          </p>
          <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>Something spilled</h1>
          <p style={{ maxWidth: 28 * 16, margin: '0 auto', opacity: 0.85, fontSize: 15 }}>
            CookCap hit a load error — usually a stale service worker after an update. Reload
            clears it. Your recipes stay on this device.
          </p>
          {error?.digest ? (
            <p style={{ marginTop: 8, fontSize: 11, opacity: 0.55 }}>{error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 24,
              minHeight: 44,
              borderRadius: 999,
              border: 0,
              padding: '0 1.25rem',
              background: '#c2683c',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: 8,
                minHeight: 44,
                borderRadius: 999,
                border: 0,
                padding: '0 1.25rem',
                background: 'transparent',
                color: '#ddd0c0',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Reload kitchen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
