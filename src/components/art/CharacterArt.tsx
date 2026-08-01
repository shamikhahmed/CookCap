/**
 * Jia's Kitchen Friends, drawn as SVG. One shared face treatment (dot eyes,
 * rosy cheeks, a small smile) sits on a tool-shaped body, so eight different
 * characters still read as one family. Pure vector, no network, theme-agnostic.
 *
 * `color` tints the body; faces are always the same warm ink. Sizes are square.
 */
import type { CSSProperties } from 'react';

const INK = '#3d2b22';
const BLUSH = '#e79a86';

function Face({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  const s = scale;
  return (
    <g>
      <circle cx={cx - 9 * s} cy={cy + 5 * s} r={4 * s} fill={BLUSH} opacity={0.6} />
      <circle cx={cx + 9 * s} cy={cy + 5 * s} r={4 * s} fill={BLUSH} opacity={0.6} />
      <circle cx={cx - 6 * s} cy={cy} r={2.1 * s} fill={INK} />
      <circle cx={cx + 6 * s} cy={cy} r={2.1 * s} fill={INK} />
      <circle cx={cx - 6.7 * s} cy={cy - 0.8 * s} r={0.7 * s} fill="#fff" />
      <circle cx={cx + 5.3 * s} cy={cy - 0.8 * s} r={0.7 * s} fill="#fff" />
      <path
        d={`M${cx - 4 * s} ${cy + 4 * s} q ${4 * s} ${4 * s} ${8 * s} 0`}
        stroke={INK}
        strokeWidth={1.6 * s}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

function Body({ id, color }: { id: string; color: string }) {
  const dark = shade(color, -18);
  const light = shade(color, 18);
  switch (id) {
    case 'mr-pots':
      return (
        <g>
          <rect x="26" y="16" width="68" height="10" rx="5" fill={dark} />
          <circle cx="60" cy="18" r="3" fill={light} />
          <path d="M22 40h-6a5 5 0 0 0 0 10h6M98 40h6a5 5 0 0 1 0 10h-6" stroke={dark} strokeWidth="5" fill="none" />
          <rect x="24" y="30" width="72" height="56" rx="14" fill={color} />
          <rect x="24" y="30" width="72" height="14" rx="7" fill={light} opacity={0.5} />
          <Face cx={60} cy={58} />
        </g>
      );
    case 'spoon-bubs':
      return (
        <g>
          <rect x="55" y="55" width="10" height="40" rx="5" fill={color} />
          <ellipse cx="60" cy="40" rx="26" ry="30" fill={color} />
          <ellipse cx="60" cy="40" rx="18" ry="22" fill={light} opacity={0.45} />
          <Face cx={60} cy={40} />
        </g>
      );
    case 'chef-whisk':
      return (
        <g>
          <path
            d="M60 30 C44 46 44 70 60 82 C76 70 76 46 60 30Z"
            fill="none"
            stroke={color}
            strokeWidth="3.5"
          />
          <path d="M60 30v52M46 44c14 8 14 20 0 30M74 44c-14 8-14 20 0 30" stroke={color} strokeWidth="3.5" fill="none" />
          <rect x="54" y="80" width="12" height="20" rx="6" fill={dark} />
          <path d="M46 26h28l-4-10a10 10 0 0 0-20 0Z" fill={light} />
          <Face cx={60} cy={54} scale={0.9} />
        </g>
      );
    case 'miss-rolling-pin':
      return (
        <g>
          <rect x="14" y="50" width="14" height="8" rx="4" fill={dark} />
          <rect x="92" y="50" width="14" height="8" rx="4" fill={dark} />
          <rect x="28" y="40" width="64" height="28" rx="14" fill={color} />
          <rect x="28" y="40" width="64" height="9" rx="4.5" fill={light} opacity={0.5} />
          <path d="M84 34c3-2 7-1 8 2-3 2-7 1-8-2Z" fill={BLUSH} />
          <Face cx={60} cy={54} />
        </g>
      );
    case 'tiny-timer':
      return (
        <g>
          <circle cx="60" cy="58" r="34" fill={color} />
          <circle cx="60" cy="58" r="34" fill="none" stroke={dark} strokeWidth="4" />
          <rect x="52" y="16" width="16" height="8" rx="4" fill={dark} />
          <path d="M60 58l0-14M60 58l10 6" stroke={INK} strokeWidth="2.5" strokeLinecap="round" opacity={0.7} />
          <Face cx={60} cy={62} />
        </g>
      );
    case 'captain-oven':
      return (
        <g>
          <rect x="20" y="24" width="80" height="76" rx="12" fill={color} />
          <rect x="28" y="30" width="64" height="10" rx="5" fill={dark} />
          <circle cx="38" cy="35" r="2.5" fill={light} />
          <circle cx="50" cy="35" r="2.5" fill={light} />
          <rect x="30" y="48" width="60" height="44" rx="10" fill={light} opacity={0.35} />
          <rect x="30" y="48" width="60" height="44" rx="10" fill="none" stroke={dark} strokeWidth="3" />
          <Face cx={60} cy={68} />
        </g>
      );
    case 'air-fryer-buddy':
      return (
        <g>
          <path d="M30 40h60l-6 56a8 8 0 0 1-8 7H44a8 8 0 0 1-8-7Z" fill={color} />
          <rect x="26" y="30" width="68" height="14" rx="7" fill={dark} />
          <rect x="48" y="20" width="24" height="10" rx="5" fill={dark} />
          <path d="M40 56h40M40 66h40M40 76h40" stroke={light} strokeWidth="2" opacity={0.4} />
          <Face cx={60} cy={66} />
        </g>
      );
    case 'mixer-max':
      return (
        <g>
          <ellipse cx="60" cy="98" rx="34" ry="8" fill={dark} />
          <path d="M30 40c0-8 8-14 22-14s22 6 22 14v6H30Z" fill={color} />
          <rect x="26" y="44" width="68" height="14" rx="7" fill={dark} />
          <path d="M52 58l-3 20a4 4 0 0 0 4 5h14a4 4 0 0 0 4-5l-3-20Z" fill={light} />
          <rect x="40" y="30" width="10" height="16" rx="5" fill={dark} />
          <Face cx={58} cy={36} scale={0.85} />
        </g>
      );
    default:
      return <circle cx="60" cy="60" r="34" fill={color} />;
  }
}

export function CharacterArt({
  id,
  color,
  size = 120,
  style,
  className,
}: {
  id: string;
  color: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      style={style}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <Body id={id} color={color} />
    </svg>
  );
}

/** Lighten (+) or darken (−) a hex colour by a percentage of full scale. */
function shade(hex: string, pct: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + Math.round((255 * pct) / 100));
  const g = clamp(((n >> 8) & 0xff) + Math.round((255 * pct) / 100));
  const b = clamp((n & 0xff) + Math.round((255 * pct) / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
const clamp = (v: number) => Math.max(0, Math.min(255, v));
