// Tiny synthesized sounds (no audio files). Quiet, short, and only when sound is on.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.08) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  tap: () => tone(660, 0, 0.08, 'triangle', 0.04),
  correct: () => {
    tone(784, 0, 0.16);
    tone(1046, 0.1, 0.22);
  },
  gentle: () => tone(440, 0, 0.2, 'sine', 0.05),
  coin: () => {
    tone(988, 0, 0.1, 'square', 0.03);
    tone(1318, 0.08, 0.18, 'square', 0.03);
  },
  camera: () => {
    tone(1200, 0, 0.05, 'triangle', 0.05);
    tone(600, 0.06, 0.08, 'triangle', 0.04);
  },
  done: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.22));
  },
};
