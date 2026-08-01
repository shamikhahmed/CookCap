/**
 * Procedural hero illustration. Every recipe gets a deterministic, layered
 * "plated dish" abstraction generated from its `heroSeed` — a warm gradient
 * ground, a ceramic plate, and organic food-like blobs. This keeps the app
 * fully offline (no photo payload) while still giving each page a distinct,
 * editorial image. Palette is tied to the recipe's chapter tab color.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** HSL string with jitter, staying in a warm, food-photographic gamut. */
function warm(rng: () => number, hueBase: number, sat: number, light: number) {
  const h = (hueBase + (rng() - 0.5) * 30 + 360) % 360;
  return `hsl(${h.toFixed(0)} ${sat}% ${light}%)`;
}

export interface HeroArt {
  svg: string;
}

/**
 * @param seed   recipe.heroSeed
 * @param tab    chapter tab color (hex) — anchors the plate rim + accents
 */
export function generateHero(seed: number, tab: string): string {
  const rng = mulberry32(seed * 2654435761);
  const hueBase = (seed * 47) % 360;

  const bgA = warm(rng, hueBase, 30, 22);
  const bgB = warm(rng, hueBase + 20, 40, 14);

  // Scatter of organic food blobs on the plate.
  const blobs: string[] = [];
  const count = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < count; i++) {
    const cx = 150 + (rng() - 0.5) * 150;
    const cy = 150 + (rng() - 0.5) * 150;
    const r = 18 + rng() * 46;
    const fill = warm(rng, hueBase + rng() * 90, 55 + rng() * 25, 45 + rng() * 25);
    const rot = rng() * 360;
    const squish = 0.7 + rng() * 0.5;
    blobs.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot.toFixed(
        0,
      )}) scale(${squish.toFixed(2)} 1)"><circle r="${r.toFixed(1)}" fill="${fill}" opacity="0.92"/><circle r="${(
        r * 0.55
      ).toFixed(1)}" cx="${(-r * 0.2).toFixed(1)}" cy="${(-r * 0.25).toFixed(
        1,
      )}" fill="rgba(255,255,255,0.18)"/></g>`,
    );
  }

  const steam = Array.from({ length: 3 }, (_, i) => {
    const x = 120 + i * 40;
    return `<path d="M${x} 120 q -14 -30 0 -60 q 14 -30 0 -60" stroke="rgba(255,255,255,0.10)" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  }).join('');

  return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="g${seed}" cx="42%" cy="34%" r="80%">
      <stop offset="0%" stop-color="${bgA}"/>
      <stop offset="100%" stop-color="${bgB}"/>
    </radialGradient>
    <radialGradient id="p${seed}" cx="45%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#f6efe4"/>
      <stop offset="82%" stop-color="#e6dccb"/>
      <stop offset="100%" stop-color="#cdbfa9"/>
    </radialGradient>
    <filter id="s${seed}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="rgba(0,0,0,0.45)"/>
    </filter>
  </defs>
  <rect width="300" height="300" fill="url(#g${seed})"/>
  ${steam}
  <g filter="url(#s${seed})">
    <circle cx="150" cy="152" r="118" fill="url(#p${seed})"/>
    <circle cx="150" cy="152" r="118" fill="none" stroke="${tab}" stroke-opacity="0.5" stroke-width="3"/>
    <circle cx="150" cy="152" r="96" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="2"/>
  </g>
  <clipPath id="c${seed}"><circle cx="150" cy="152" r="94"/></clipPath>
  <g clip-path="url(#c${seed})">${blobs.join('')}</g>
</svg>`;
}

/** Data-URI form for use as a CSS background or <img src>. */
export function heroDataUri(seed: number, tab: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(generateHero(seed, tab))}`;
}
