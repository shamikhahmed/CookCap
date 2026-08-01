'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog a11y: lock body scroll, focus first control, Tab-trap inside panel,
 * Escape → onClose, restore focus to opener on unmount.
 */
export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
  opts?: { initialFocus?: 'first' | 'none' },
) {
  const openerRef = useRef<HTMLElement | null>(null);
  const initial = opts?.initialFocus ?? 'first';

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusFirst = () => {
      if (!panel || initial === 'none') return;
      const el = panel.querySelector<HTMLElement>(FOCUSABLE);
      el?.focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
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
          last.focus();
        }
      } else if (document.activeElement === last || !panel.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      const opener = openerRef.current;
      if (opener && typeof opener.focus === 'function') {
        try {
          opener.focus();
        } catch {
          /* detached */
        }
      }
    };
  }, [open, onClose, panelRef, initial]);
}

export function motionReduce(reduce: boolean | null) {
  return reduce
    ? { type: 'tween' as const, duration: 0 }
    : { type: 'spring' as const, stiffness: 320, damping: 34 };
}
