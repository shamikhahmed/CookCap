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

export const DUR_MICRO = 0.18;
export const DUR_UI = 0.28;
export const DUR_DRAWER = 0.5;
export const DUR_BOOK = 0.85;

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
