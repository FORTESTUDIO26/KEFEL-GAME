import { describe,expect,it,vi } from 'vitest';
import { MusicEngine,type MusicEnvironment } from './backgroundMusic';
class Events {
  listeners=new Map<string,Set<(e:Event)=>void>>();
  addEventListener(t:string,f:(e:Event)=>void){const s=this.listeners.get(t)??new Set();s.add(f);this.listeners.set(t,s);}
  removeEventListener(t:string,f:(e:Event)=>void){this.listeners.get(t)?.delete(f);}
  emit(t:string,trusted=false){for(const f of this.listeners.get(t)??[])f({isTrusted:trusted} as Event);}
}
function fixture(){
  const events=new Events(),document=Object.assign(new Events(),{visibilityState:'visible'}),orientation=Object.assign(new Events(),{matches:false});
  const media={loop:false,preload:'',volume:1,paused:true,muted:false,play:vi.fn(async()=>{media.paused=false;}),pause:vi.fn(()=>{media.paused=true;})};
  const createAudio=vi.fn(()=>media as unknown as HTMLAudioElement);let sound=true;
  const listeners=new Set<()=>void>();
  const env={events,document,orientation,createAudio,soundEnabled:()=>sound,subscribeSound:(f:()=>void)=>{listeners.add(f);return()=>{listeners.delete(f);};}} as unknown as MusicEnvironment;
  const engine=new MusicEngine(env);
  return {events,document,orientation,media,createAudio,engine,mute:(value:boolean)=>{sound=!value;listeners.forEach(f=>f());}};
}
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
describe('media music lifecycle',()=>{
  it.each(['click','touchend','pointerup','keydown'])('starts synchronously on trusted %s only',async(type)=>{
    const f=fixture(),release=f.engine.acquire(true);
    f.events.emit(type);f.events.emit('pointerdown',true);expect(f.createAudio).not.toHaveBeenCalled();
    f.events.emit(type,true);expect(f.media.play).toHaveBeenCalledTimes(1);
    expect(f.media.loop).toBe(true);await settle();release();
  });
  it('shares one element without duplicate pending or active play calls',async()=>{
    const f=fixture(),a=f.engine.acquire(true),b=f.engine.acquire(true);
    f.events.emit('touchend',true);f.events.emit('pointerup',true);f.events.emit('click',true);
    expect(f.media.play).toHaveBeenCalledTimes(1);await settle();f.events.emit('click',true);
    expect(f.media.play).toHaveBeenCalledTimes(1);a();expect(f.media.paused).toBe(false);b();expect(f.media.paused).toBe(true);
    expect(f.createAudio).toHaveBeenCalledTimes(1);
    f.events.emit('click',true);expect(f.media.play).toHaveBeenCalledTimes(1);
  });
  it('remembers gestures while muted and resumes when enabled',async()=>{
    const f=fixture();f.mute(true);const release=f.engine.acquire(true);f.events.emit('touchend',true);
    expect(f.media.play).not.toHaveBeenCalled();f.mute(false);expect(f.media.play).toHaveBeenCalledTimes(1);await settle();
    f.mute(true);expect(f.media.paused).toBe(true);f.mute(false);expect(f.media.play).toHaveBeenCalledTimes(2);await settle();release();
  });
  it('pauses hidden/portrait and resumes only when both gates open',async()=>{
    const f=fixture(),release=f.engine.acquire(true);f.events.emit('click',true);await settle();
    f.document.visibilityState='hidden';f.document.emit('visibilitychange');expect(f.media.paused).toBe(true);
    f.orientation.matches=true;f.orientation.emit('change');f.document.visibilityState='visible';f.document.emit('visibilitychange');expect(f.media.play).toHaveBeenCalledTimes(1);
    f.orientation.matches=false;f.orientation.emit('change');expect(f.media.play).toHaveBeenCalledTimes(2);await settle();release();
  });
  it('never autoplays from settings or visibility before authorization',()=>{
    const f=fixture(),release=f.engine.acquire(true);f.mute(true);f.mute(false);f.document.emit('visibilitychange');expect(f.createAudio).not.toHaveBeenCalled();release();
  });
  it('retries rejected playback on another trusted gesture',async()=>{
    const f=fixture();f.media.play.mockRejectedValueOnce(new Error('NotAllowedError'));
    const release=f.engine.acquire(true);f.events.emit('click',true);await settle();f.events.emit('click');expect(f.media.play).toHaveBeenCalledTimes(1);
    f.events.emit('touchend',true);expect(f.media.play).toHaveBeenCalledTimes(2);await settle();release();
  });
  it('pauses late play resolution after cleanup and supports remount',async()=>{
    const f=fixture();let resolve!:()=>void;f.media.play.mockImplementationOnce(()=>new Promise<void>(r=>{resolve=()=>{f.media.paused=false;r();};}));
    const release=f.engine.acquire(true);f.events.emit('click',true);release();resolve();await settle();expect(f.media.paused).toBe(true);
    const next=f.engine.acquire(true);expect(f.media.play).toHaveBeenCalledTimes(2);await settle();next();
  });
  it('keeps disabled leases silent',()=>{const f=fixture(),release=f.engine.acquire(false);f.events.emit('click',true);expect(f.media.play).not.toHaveBeenCalled();release();});
});

it.each([{initialEnabled:true,reconcileEnabled:true},{initialEnabled:false,reconcileEnabled:true},{initialEnabled:false,reconcileEnabled:undefined}])('guards HUD reconciliation of $initialEnabled with $reconcileEnabled and exposes one DOM element',async({initialEnabled,reconcileEnabled})=>{
  vi.resetModules();
  const appendChild=vi.fn();
  const events=new Events(),document=Object.assign(new Events(),{visibilityState:'visible',body:{appendChild}}),orientation=Object.assign(new Events(),{matches:false});
  const activation={isActive:false};
  const window=Object.assign(events,{matchMedia:()=>orientation,navigator:{userActivation:activation}});
  const media={hidden:false,setAttribute:vi.fn(),paused:true,loop:false,preload:'',volume:1,play:vi.fn(async()=>{media.paused=false;}),pause:vi.fn(()=>{media.paused=true;})};
  const sources:string[]=[];
  vi.stubGlobal('window',window);vi.stubGlobal('document',document);
  vi.stubGlobal('Audio',class {constructor(src:string){sources.push(src);return media;}});
  try{
    const {acquireBackgroundMusic,unlockBackgroundMusic}=await import('./backgroundMusic');
    const {setSoundEnabled}=await import('./sound');
    setSoundEnabled(false);
    const release=acquireBackgroundMusic(initialEnabled);
    setSoundEnabled(true);
    unlockBackgroundMusic(reconcileEnabled);expect(sources).toHaveLength(0);
    activation.isActive=true;unlockBackgroundMusic(reconcileEnabled);expect(media.play).toHaveBeenCalledTimes(1);
    expect(sources).toEqual([`${import.meta.env.BASE_URL}studio-music.wav`]);
    expect(media.hidden).toBe(true);expect(media.setAttribute).toHaveBeenCalledWith('data-studio-music','');
    expect(appendChild.mock.calls).toEqual([[media]]);
    unlockBackgroundMusic(reconcileEnabled);expect(media.play).toHaveBeenCalledTimes(1);await settle();release();
    const next=acquireBackgroundMusic(true);await settle();expect(appendChild).toHaveBeenCalledTimes(1);next();
  }finally{vi.unstubAllGlobals();}
});
