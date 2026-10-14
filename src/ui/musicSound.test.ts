import { afterEach,beforeEach,expect,it,vi } from 'vitest';

class Param {
  value=0;setValueAtTime(value:number){this.value=value;}
  exponentialRampToValueAtTime(value:number){this.value=value;}
  cancelScheduledValues(){}
}
class Gain {
  gain=new Param();connectedTo:unknown;connect(node:unknown){this.connectedTo=node;return this;}disconnect(){}
}
class Context {
  currentTime=0;state='running';destination=new Gain();gains:Gain[]=[];oscillators:unknown[]=[];
  createGain(){const gain=new Gain();this.gains.push(gain);return gain;}
  createOscillator(){const oscillator={type:'sine',frequency:new Param(),connect:(node:Gain)=>node,start:()=>{},stop:()=>{},disconnect:()=>{},onended:null};this.oscillators.push(oscillator);return oscillator;}
  resume=vi.fn(async()=>{});
}
beforeEach(()=>vi.resetModules());
afterEach(()=>vi.unstubAllGlobals());
it('preserves every sfx method while sharing one context/output and muting active audio immediately',async()=>{
  const contexts:Context[]=[];
  vi.stubGlobal('window',{AudioContext:class extends Context {constructor(){super();contexts.push(this);}}});
  const sound=await import('./sound');
  sound.sfx.tap();sound.sfx.correct();sound.sfx.gentle();sound.sfx.coin();sound.sfx.camera();sound.sfx.done();
  expect(contexts).toHaveLength(1);
  const context=contexts[0],count=context.oscillators.length;
  expect(count).toBe(12);
  const output=sound.getSoundOutput(sound.getSoundContext()!);
  expect(context.gains.filter(g=>g.connectedTo===context.destination)).toHaveLength(1);
  const changes=vi.fn(),unsubscribe=sound.subscribeSoundEnabled(changes);
  sound.setSoundEnabled(false);expect(output.gain.value).toBe(0);expect(changes).toHaveBeenCalledTimes(1);
  sound.sfx.done();expect(context.oscillators).toHaveLength(count);
  sound.setSoundEnabled(true);expect(output.gain.value).toBe(1);
  expect(sound.getSoundContext()).toBe(context);unsubscribe();
});
