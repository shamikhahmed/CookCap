'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { lockScroll, unlockScroll } from '@/lib/scroll-lock';

/** Large-title page header (HIG). */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <header className="ui-header">
      <div>
        {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
        <h1 className="ui-largetitle">{title}</h1>
        {subtitle ? <p className="text-[color:var(--label-2)] text-[length:var(--t-subhead)] mt-1">{subtitle}</p> : null}
      </div>
      {trailing}
    </header>
  );
}

/** Section with optional trailing action. */
export function Section({
  title,
  action,
  children,
}: {
  title?: ReactNode;
  action?: { label: string; onClick: () => void };
  children: ReactNode;
}) {
  return (
    <section className="ui-section">
      {(title || action) && (
        <div className="ui-section-head">
          {title ? <h2 className="ui-section-title">{title}</h2> : <span />}
          {action ? (
            <button type="button" className="ui-section-link" onClick={action.onClick}>
              {action.label}
            </button>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Bottom sheet (iPad/desktop: centered card). Grabber + Cancel/Done bar,
 * Esc + backdrop close, iOS-safe ScrollLock, focus with preventScroll.
 */
export function Sheet({
  open,
  title,
  onClose,
  done,
  children,
  labelledBy = 'sheet-title',
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  done?: { label: string; onClick: () => void; disabled?: boolean };
  children: ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    lockScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      prev?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="ui-sheet-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="ui-sheet ui-rise outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-sheet__grabber md:hidden" aria-hidden />
        <div className="ui-sheet__bar">
          <button type="button" className="ui-btn ui-btn--plain" onClick={onClose}>
            Cancel
          </button>
          <span className="ui-sheet__title" id={labelledBy}>
            {title}
          </span>
          {done ? (
            <button
              type="button"
              className="ui-btn ui-btn--plain"
              onClick={done.onClick}
              disabled={done.disabled}
            >
              {done.label}
            </button>
          ) : (
            <span />
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
