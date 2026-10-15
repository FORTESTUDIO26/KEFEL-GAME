// Tiny synthesized sounds (no audio files). Quiet, short, and only when sound is on.

let ctx: AudioContext | null = null;
let enabled = true;
let output:GainNode|null=null;
const listeners=new Set<()=>void>();

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if(ctx&&output){output.gain.cancelScheduledValues(ctx.currentTime);output.gain.setValueAtTime(on?1:0,ctx.currentTime);}
  for(const listener of listeners)listener();
}

export const isSoundEnabled=()=>enabled;
export function subscribeSoundEnabled(listener:()=>void):()=>void {
  listeners.add(listener);return()=>{listeners.delete(listener);};
}

/** Shared sound-effects context; background music uses its own media element. */
export function getSoundContext():AudioContext|null {
  if(!enabled||typeof window==='undefined')return null;
  try{
    if(!ctx){
      const AC=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
      if(!AC)return null;
      ctx=new AC();
    }
    return ctx;
  }catch{return null;}
}
export function getSoundOutput(context:AudioContext):GainNode {
  if(!output){output=context.createGain();output.gain.setValueAtTime(enabled?1:0,context.currentTime);output.connect(context.destination);}
  return output;
}

function audio(): AudioContext | null {
  const context=getSoundContext();if(!context)return null;
  try {
    if (context.state === 'suspended') void context.resume().catch(()=>{});
    return context;
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
  o.connect(g).connect(getSoundOutput(c));
  o.onended=()=>{o.disconnect();g.disconnect();};
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
