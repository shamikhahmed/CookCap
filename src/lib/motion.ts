/**
 * Shared Motion presets — hardcover weight, not bouncy springs.
 * Prefer these over per-file cubic-bezier. Aligns with docs/animation-bible.md.
 */

/** --e-soft */
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;
/** --e-inout */
export const EASE_IN_OUT_SOFT = [0.65, 0, 0.35, 1] as const;
/** --e-wood-out — drawer glide */
export const EASE_WOOD_OUT = [0.16, 0.84, 0.3, 1] as const;
/** --e-wood-in — drawer push */
export const EASE_WOOD_IN = [0.5, 0, 0.75, 0.2] as const;
/** --e-page — paper snap */
export const EASE_PAGE = [0.36, 0.66, 0.04, 1] as const;
/** --ease-spring — micro pop only (heart / star / badge) */
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

export const DUR_MICRO = 0.18;
export const DUR_UI = 0.28;
export const DUR_DRAWER = 0.5;
export const DUR_BOOK = 0.85;

/** Bible §9 timing tokens (ms) */
export const DUR_STAR_STAGGER_MS = 40;
export const DUR_CART_FLY_MS = 380;
export const DUR_STRIKE_MS = 180;
export const DUR_ODOMETER_MS = 160;
export const DUR_FACT_STAGGER_MS = 40;

export const CART_BUMP_EVENT = 'cookcap-cart-bump';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Drawer / modal sheet enter+exit (y + opacity). */
export function drawerTransition(reduce: boolean | null) {
  if (reduce) return { type: 'tween' as const, duration: 0 };
  return { type: 'tween' as const, duration: DUR_UI, ease: EASE_OUT_SOFT };
}

/** Backdrop fade only. */
export function fadeTransition(reduce: boolean | null, ms = 200) {
  if (reduce) return { type: 'tween' as const, duration: 0 };
  return { type: 'tween' as const, duration: ms / 1000, ease: EASE_OUT_SOFT };
}

/** Splash dissolve. */
export function splashTransition(reduce: boolean | null) {
  if (reduce) return { type: 'tween' as const, duration: 0.08 };
  return { type: 'tween' as const, duration: 0.45, ease: EASE_OUT_SOFT };
}

/** Book / page curl settle. */
export function pageTransition(reduce: boolean | null) {
  if (reduce) return { type: 'tween' as const, duration: 0 };
  return { type: 'tween' as const, duration: 0.55, ease: EASE_PAGE };
}

/** Dispatch cart badge bump (Shell listens). */
export function dispatchCartBump(count?: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(CART_BUMP_EVENT, { detail: { count } }),
  );
}

/**
 * Clone a flying chip from `fromEl` toward `[data-cart-fly-target]`.
 * Arc + scale→0.4 + fade, 380ms `--e-soft`. Then bumps cart badge.
 * RM / missing target → bump only (instant state).
 */
export function flyToCart(fromEl: HTMLElement, label = '·') {
  if (typeof document === 'undefined') return;
  if (prefersReducedMotion()) {
    dispatchCartBump();
    return;
  }
  const target = document.querySelector<HTMLElement>('[data-cart-fly-target]');
  if (!target) {
    dispatchCartBump();
    return;
  }
  const from = fromEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const dx = to.left + to.width / 2 - startX;
  const dy = to.top + to.height / 2 - startY;

  const chip = document.createElement('span');
  chip.className = 'micro-cart-fly';
  chip.textContent = label;
  chip.setAttribute('aria-hidden', 'true');
  chip.style.left = `${startX}px`;
  chip.style.top = `${startY}px`;
  chip.style.setProperty('--fly-x', `${dx}px`);
  chip.style.setProperty('--fly-y', `${dy}px`);
  document.body.appendChild(chip);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    chip.remove();
    dispatchCartBump();
  };
  chip.addEventListener('animationend', finish, { once: true });
  window.setTimeout(finish, DUR_CART_FLY_MS + 80);
}
