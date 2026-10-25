'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { lockScroll, unlockScroll } from '@/lib/scroll-lock';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog a11y: iOS-safe scroll lock, focus first control (preventScroll), Tab-trap,
 * Escape → onClose, restore focus to opener on unmount.
 *
 * `onClose` is held in a ref so callers can pass inline lambdas without
 * re-running the effect (which would re-steal focus and dismiss mobile keyboards).
 */
export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
  opts?: { initialFocus?: 'first' | 'none' | 'panel' },
) {
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const initial = opts?.initialFocus ?? 'first';

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement as HTMLElement | null;
    lockScroll();

    const panel = panelRef.current;
    const focusFirst = () => {
      if (!panel) return;
      if (initial === 'none') return;
      if (initial === 'panel') {
        panel.focus({ preventScroll: true });
        return;
      }
      const el = panel.querySelector<HTMLElement>(FOCUSABLE);
      el?.focus({ preventScroll: true });
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (n) => !n.hasAttribute('disabled') && n.getAttribute('aria-hidden') !== 'true',
      );
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first || !panel.contains(document.activeElement)) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (document.activeElement === last || !panel.contains(document.activeElement)) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      unlockScroll();
      const opener = openerRef.current;
      if (opener && typeof opener.focus === 'function') {
        try {
          opener.focus({ preventScroll: true });
        } catch {
          /* detached */
        }
      }
    };
  }, [open, panelRef, initial]);
}

/** Shared drawer/modal transition — soft tween (no spring overshoot). */
export function motionReduce(reduce: boolean | null) {
  if (reduce) return { type: 'tween' as const, duration: 0 };
  return { type: 'tween' as const, duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
}
