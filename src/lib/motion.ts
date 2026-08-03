/**
 * Shared Motion presets — hardcover weight, not bouncy springs.
 * Prefer these over per-file cubic-bezier.
 */

export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT_SOFT = [0.65, 0, 0.35, 1] as const;

/** Drawer / modal sheet enter+exit (y + opacity). */
export function drawerTransition(reduce: boolean | null) {
  if (reduce) return { type: 'tween' as const, duration: 0 };
  return { type: 'tween' as const, duration: 0.28, ease: EASE_OUT_SOFT };
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
