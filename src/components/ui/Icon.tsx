/**
 * Hand-drawn line-icon set. One stroke weight, one cap/join style, so every
 * glyph feels cut from the same tool. `size` in px; color inherits via
 * `currentColor`. Only the icons the app actually uses are included.
 */
import type { SVGProps } from 'react';

export type IconName =
  | 'sunrise'
  | 'sun'
  | 'moon'
  | 'cake'
  | 'cup'
  | 'bread'
  | 'leaf'
  | 'bolt'
  | 'sprout'
  | 'flame'
  | 'olive'
  | 'chili'
  | 'wheat'
  | 'whisk'
  | 'cookie'
  | 'pot'
  | 'sparkle'
  | 'search'
  | 'heart'
  | 'heart-filled'
  | 'star'
  | 'star-filled'
  | 'clock'
  | 'gauge'
  | 'users'
  | 'flame-cal'
  | 'close'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevrons-left'
  | 'chevrons-right'
  | 'home'
  | 'book'
  | 'bookmark'
  | 'sun-toggle'
  | 'moon-toggle'
  | 'palette';

const P: Record<IconName, string> = {
  sunrise: 'M3 18h18M6 18a6 6 0 0 1 12 0M12 3v3M5 9l2 1M19 9l-2 1',
  sun: 'M12 4v2M12 18v2M4 12h2M18 12h2M6 6l1.5 1.5M18 6l-1.5 1.5M6 18l1.5-1.5M18 18l-1.5-1.5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z',
  cake: 'M4 20h16M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6M12 12V8M12 6.5c.9-1 .9-2 0-3-.9 1-.9 2 0 3Z',
  cup: 'M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8ZM16 9h2a2 2 0 0 1 0 4h-2M8 3v2M11 3v2',
  bread: 'M4 12a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6ZM9 8v12M14 8v12',
  leaf: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14ZM5 19c3-4 6-6 10-8',
  bolt: 'M13 3 5 13h5l-1 8 8-10h-5l1-8Z',
  sprout: 'M12 20v-8M12 12c0-3-2-5-5-5 0 3 2 5 5 5ZM12 12c0-3 2-6 6-6 0 3-2 6-6 6Z',
  flame: 'M12 3c3 3 5 6 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4 .3 1 1 1.5 1.5 1.5C11 8 11 5 12 3Z',
  olive: 'M12 4c4 0 7 3 7 8s-3 8-7 8-7-3-7-8 3-8 7-8ZM12 8v8M9 11l3 2 3-2',
  chili: 'M6 6c3 0 5 2 5 5 4 0 7 3 7 7-6 1-13-3-13-9 0-2 .5-3 1-3ZM6 6c1-1 2-1 3-.5',
  wheat: 'M12 21V9M12 9c-2 0-3-1.5-3-3 2 0 3 1.5 3 3ZM12 9c2 0 3-1.5 3-3-2 0-3 1.5-3 3ZM12 14c-2 0-3-1.5-3-3 2 0 3 1.5 3 3ZM12 14c2 0 3-1.5 3-3-2 0-3 1.5-3 3ZM12 5c0-1.5 1-2 2-2 0 1.5-1 2-2 2Z',
  whisk: 'M12 3v9M8 21h8M10 21l2-9 2 9M9 6c0 3 1.5 6 3 6s3-3 3-6M12 4c-1.5 0-2.5 1-2.5 2M12 4c1.5 0 2.5 1 2.5 2',
  cookie: 'M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3ZM9 12h.01M13 15h.01M15 10h.01M8 16h.01',
  pot: 'M4 9h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9ZM3 9h18M6 9V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M9 3v2M15 3v2',
  sparkle: 'M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3ZM18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15Z',
  search: 'M11 11m-7 0a7 7 0 1 0 14 0 7 7 0 1 0-14 0M20 20l-4-4',
  heart: 'M12 20s-7-4.5-9.5-9C1 8 2.5 5 5.5 5 8 5 12 8 12 8s4-3 6.5-3C21.5 5 23 8 21.5 11 19 15.5 12 20 12 20Z',
  'heart-filled':
    'M12 20s-7-4.5-9.5-9C1 8 2.5 5 5.5 5 8 5 12 8 12 8s4-3 6.5-3C21.5 5 23 8 21.5 11 19 15.5 12 20 12 20Z',
  star: 'M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17.8 6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3Z',
  'star-filled': 'M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17.8 6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3Z',
  clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  gauge: 'M12 13l4-4M4 18a9 9 0 1 1 16 0M12 13m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 20a6 6 0 0 0-3-5',
  'flame-cal': 'M12 3c3 3 5 6 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4 .3 1 1 1.5 1.5 1.5C11 8 11 5 12 3Z',
  close: 'M6 6l12 12M18 6 6 18',
  'arrow-left': 'M15 5l-7 7 7 7',
  'arrow-right': 'M9 5l7 7-7 7',
  'chevrons-left': 'M11 6 5 12l6 6M18 6l-6 6 6 6',
  'chevrons-right': 'M6 6l6 6-6 6M13 6l6 6-6 6',
  home: 'M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z',
  book: 'M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 0-2 2V5ZM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 1 2 2V5Z',
  bookmark: 'M7 3h10v18l-5-4-5 4V3Z',
  'sun-toggle': 'M12 4v2M12 18v2M4 12h2M18 12h2M6 6l1.5 1.5M18 6l-1.5 1.5M6 18l1.5-1.5M18 18l-1.5-1.5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  'moon-toggle': 'M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z',
  palette:
    'M12 3a9 9 0 0 0 0 18c.8 0 1.2-.5 1.2-1.1 0-.4-.2-.8-.4-1.1-.3-.4-.5-.9-.5-1.4A2.4 2.4 0 0 1 14.7 15H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8ZM7.5 11.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4ZM10 7.8a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4ZM14 7.8a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4ZM16.5 11.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z',
};

const FILLED: Partial<Record<IconName, boolean>> = {
  'heart-filled': true,
  'star-filled': true,
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 22, ...rest }: IconProps) {
  const filled = FILLED[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={P[name]} />
    </svg>
  );
}
