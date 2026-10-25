/**
 * ScrollLock — freezes the document while any sheet/overlay is open, then restores
 * the exact position. iOS ignores `overflow:hidden` on body for touch scrolling and
 * jumps when it is toggled, so the body is pinned with position:fixed + top:-scrollY
 * (ScentCap 3.0.1 / PulseCap recipe).
 */

let lockedY: number | null = null;
let refCount = 0;

export function lockScroll(): void {
  refCount += 1;
  if (lockedY !== null) return;
  lockedY = window.scrollY;
  const b = document.body.style;
  b.position = 'fixed';
  b.top = `${-lockedY}px`;
  b.left = '0';
  b.right = '0';
  b.width = '100%';
}

export function unlockScroll(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0 || lockedY === null) return;
  const y = lockedY;
  lockedY = null;
  const b = document.body.style;
  b.position = '';
  b.top = '';
  b.left = '';
  b.right = '';
  b.width = '';
  window.scrollTo(0, y);
}

/** Page position as the user sees it (body is offset while locked). */
export function currentScrollY(): number {
  return lockedY !== null ? lockedY : window.scrollY;
}

export function scrollToY(y: number): void {
  if (lockedY !== null) lockedY = y;
  else window.scrollTo(0, y);
}

export function isScrollLocked(): boolean {
  return lockedY !== null;
}
