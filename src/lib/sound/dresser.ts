'use client';

/**
 * Soft dresser SFX — oscillators, no assets. Respect muted flag (= !soundOn).
 */
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    ctx ??= new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  muted: boolean,
  opts: { freq: number; endFreq: number; dur: number; type?: OscillatorType; vol?: number },
) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  void c.resume();
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? 'triangle';
  osc.frequency.setValueAtTime(opts.freq, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), t0 + opts.dur);
  const vol = opts.vol ?? 0.04;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.02);
}

/** Drawer slides open — soft wood shhk */
export function playDrawerOpen(muted: boolean) {
  tone(muted, { freq: 220, endFreq: 90, dur: 0.28, type: 'sine', vol: 0.035 });
  tone(muted, { freq: 140, endFreq: 60, dur: 0.35, type: 'triangle', vol: 0.02 });
}

/** Soft thunk on close */
export function playDrawerClose(muted: boolean) {
  tone(muted, { freq: 90, endFreq: 45, dur: 0.12, type: 'sine', vol: 0.05 });
}

/** Stamp + settle when book lands */
export function playBookStamp(muted: boolean) {
  tone(muted, { freq: 160, endFreq: 55, dur: 0.18, type: 'triangle', vol: 0.045 });
  window.setTimeout(() => {
    tone(muted, { freq: 200, endFreq: 80, dur: 0.22, type: 'sine', vol: 0.025 });
  }, 120);
}
