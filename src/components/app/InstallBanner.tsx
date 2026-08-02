'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'jia-install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
  );
}

/**
 * Compact PWA install prompt. Chrome/Edge: beforeinstallprompt.
 * iOS Safari: tip to Share → Add to Home Screen (no native prompt).
 */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) || isStandalone()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    if (isIos()) {
      setShowIos(true);
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
    setDeferred(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-4 py-3 shadow-[var(--shadow-lg)]"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <p className="min-w-0 flex-1 text-sm text-[color:var(--color-ink-soft)]">
          {showIos && !deferred ? (
            <>
              Install CookCap: tap <strong>Share</strong>, then{' '}
              <strong>Add to Home Screen</strong>.
            </>
          ) : (
            <>Install CookCap on your home screen for offline cooking.</>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          {deferred && (
            <button
              type="button"
              onClick={() => void install()}
              className="rounded-lg bg-[color:var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white"
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-3 py-1.5 text-sm text-[color:var(--color-ink-faint)] hover:bg-[color:var(--color-paper-sunk)]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
