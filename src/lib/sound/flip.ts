'use client';

/**
 * Soft page-turn tick. Oscillator — no asset. Mute by default.
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

export function playPageFlip(muted: boolean) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  void c.resume();
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, t0);
  osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.12);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.045, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + 0.18);
}
