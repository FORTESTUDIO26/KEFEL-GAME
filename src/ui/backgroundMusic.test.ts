import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { MusicEngine,type MusicEnvironment } from './backgroundMusic';

class Events {
  listeners=new Map<string,Set<(event:Event)=>void>>();
  captures=new Set<(event:Event)=>void>();
  addEventListener(type:string,listener:(event:Event)=>void,capture?:boolean){
    const listeners=this.listeners.get(type)??new Set();listeners.add(listener);this.listeners.set(type,listeners);
    if(capture)this.captures.add(listener);
  }
  removeEventListener(type:string,listener:(event:Event)=>void,_capture?:boolean){this.listeners.get(type)?.delete(listener);this.captures.delete(listener);}
  emit(type:string,trusted=false,stopped=false){for(const listener of this.listeners.get(type)??[])if(!stopped||this.captures.has(listener))listener({isTrusted:trusted} as Event);}
}
class Param {
  value=0;
  setValueAtTime(value:number){this.value=value;}
  exponentialRampToValueAtTime(value:number){this.value=value;}
  cancelScheduledValues(){}
}
class Gain {
  gain=new Param();connectedTo:unknown;connect(target:unknown){this.connectedTo=target;return this;}disconnect=vi.fn();
}
class Oscillator {
  type='sine';frequency=new Param();onended:(()=>void)|null=null;
  connect(){return this;}start=vi.fn();stop=vi.fn();disconnect=vi.fn();
}
class Context {
  state='suspended';destination=new Gain();gains:Gain[]=[];oscillators:Oscillator[]=[];
  get currentTime(){return Date.now()/1000;}
  createGain(){const gain=new Gain();this.gains.push(gain);return gain;}
  createOscillator(){const oscillator=new Oscillator();this.oscillators.push(oscillator);return oscillator;}
  resume=vi.fn(async()=>{this.state='running';});
}
function fixture(){
  const events=new Events(),document=Object.assign(new Events(),{visibilityState:'visible'}),orientation=Object.assign(new Events(),{matches:false});
  const context=new Context();let enabled=true;
  const settingListeners=new Set<()=>void>();
  const getContext=vi.fn(()=>context as unknown as AudioContext);
  const env:MusicEnvironment={events,document,orientation,context:getContext,output:()=>context.destination as unknown as AudioNode,soundEnabled:()=>enabled,subscribeSound:listener=>{settingListeners.add(listener);return()=>settingListeners.delete(listener);}};
  const engine=new MusicEngine(env);
  const mute=(value:boolean)=>{enabled=!value;for(const listener of settingListeners)listener();};
  return {events,document,orientation,context,getContext,engine,mute};
}
describe('background music lifecycle',()=>{
  beforeEach(()=>vi.useFakeTimers());
  afterEach(()=>vi.useRealTimers());
  it('never creates audio or schedules notes before a trusted gesture',async()=>{
    const f=fixture(),release=f.engine.acquire(true);
    vi.advanceTimersByTime(2000);f.events.emit('pointerdown');await Promise.resolve();
    expect(f.getContext).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
    f.events.emit('keydown',true);await Promise.resolve();
    expect(f.context.resume).toHaveBeenCalledTimes(1);expect(f.context.oscillators.length).toBeGreaterThan(0);
    release();
  });
  it('mutes the master immediately, stops every voice and scheduler, and can unmute after authorization',async()=>{
    const f=fixture(),release=f.engine.acquire(true);f.events.emit('pointerdown',true);await Promise.resolve();
    const master=f.context.gains[0];expect(master.gain.value).toBeGreaterThan(0);
    f.mute(true);
    expect(master.gain.value).toBe(0);expect(vi.getTimerCount()).toBe(0);
    expect(f.context.oscillators.every(o=>o.stop.mock.calls.some(args=>args.length===0))).toBe(true);
    const count=f.context.oscillators.length;vi.advanceTimersByTime(1000);expect(f.context.oscillators).toHaveLength(count);
    f.mute(false);await Promise.resolve();expect(vi.getTimerCount()).toBe(1);release();
  });
  it('shares one loop across mounts and removes it only when the final enabled consumer leaves',async()=>{
    const f=fixture(),a=f.engine.acquire(true),b=f.engine.acquire(true);f.events.emit('pointerdown',true);await Promise.resolve();
    const count=f.context.oscillators.length;f.events.emit('keydown',true);await Promise.resolve();
    expect(f.context.oscillators).toHaveLength(count);expect(vi.getTimerCount()).toBe(1);
    a();expect(vi.getTimerCount()).toBe(1);b();expect(vi.getTimerCount()).toBe(0);
    const c=f.engine.acquire(true);await Promise.resolve();expect(vi.getTimerCount()).toBe(1);
    expect(f.context.gains.filter(g=>g.connectedTo===f.context.destination)).toHaveLength(1);c();
  });
  it('pauses while hidden or portrait and resumes only when both gates are open',async()=>{
    const f=fixture(),release=f.engine.acquire(true);f.events.emit('pointerdown',true);await Promise.resolve();
    f.document.visibilityState='hidden';f.document.emit('visibilitychange');expect(vi.getTimerCount()).toBe(0);
    f.orientation.matches=true;f.orientation.emit('change');
    f.document.visibilityState='visible';f.document.emit('visibilitychange');await Promise.resolve();expect(vi.getTimerCount()).toBe(0);
    f.orientation.matches=false;f.orientation.emit('change');await Promise.resolve();expect(vi.getTimerCount()).toBe(1);release();
  });
  it('does not autoplay on becoming visible without a previous trusted gesture',async()=>{
    const f=fixture();f.document.visibilityState='hidden';const release=f.engine.acquire(true);
    f.document.visibilityState='visible';f.document.emit('visibilitychange');await Promise.resolve();
    expect(f.getContext).not.toHaveBeenCalled();release();
  });
  it('prevents a pending resume from restarting playback after cleanup',async()=>{
    const f=fixture();let resolve!:()=>void;
    f.context.resume.mockImplementation(()=>new Promise<void>(r=>{resolve=()=>{f.context.state='running';r();};}));
    const release=f.engine.acquire(true);f.events.emit('pointerdown',true);release();resolve();await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);expect(f.context.oscillators).toHaveLength(0);
  });
  it('keeps scheduling the musical phrase beyond its 32-second loop',async()=>{
    const f=fixture(),release=f.engine.acquire(true);f.events.emit('pointerdown',true);await Promise.resolve();
    const opening=f.context.oscillators.slice(0,5).map(o=>o.frequency.value);
    vi.advanceTimersByTime(31800);const count=f.context.oscillators.length;
    vi.advanceTimersByTime(100);
    expect(f.context.oscillators.slice(count,count+5).map(o=>o.frequency.value)).toEqual(opening);
    expect(vi.getTimerCount()).toBe(1);release();
  });
  it('does not start while muted or when all consumers are disabled',async()=>{
    const f=fixture();f.mute(true);const release=f.engine.acquire(false);
    f.events.emit('keydown',true);f.mute(false);await Promise.resolve();
    expect(f.getContext).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);release();
  });
  it('retries a rejected audio resume only after another eligible event',async()=>{
    const f=fixture();f.context.resume.mockRejectedValueOnce(new Error('activation required'));
    const release=f.engine.acquire(true);f.events.emit('pointerdown',true);
    await Promise.resolve();await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);
    f.events.emit('keydown',true);await Promise.resolve();expect(vi.getTimerCount()).toBe(1);release();
  });
  it('starts on the next room gesture after mounting, even when an item stops propagation',async()=>{
    const f=fixture();f.events.emit('pointerdown',true);
    const release=f.engine.acquire(true);await Promise.resolve();
    expect(f.getContext).not.toHaveBeenCalled();
    f.events.emit('pointerdown',true,true);await Promise.resolve();
    expect(f.context.resume).toHaveBeenCalledTimes(1);
    expect(f.context.oscillators.length).toBeGreaterThan(0);release();
  });
});
