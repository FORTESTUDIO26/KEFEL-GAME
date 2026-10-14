import { getSoundContext,getSoundOutput,isSoundEnabled,subscribeSoundEnabled } from './sound';

interface Events {
  addEventListener:(type:string,listener:(event:Event)=>void,capture?:boolean)=>void;
  removeEventListener:(type:string,listener:(event:Event)=>void,capture?:boolean)=>void;
}
export interface MusicEnvironment {
  events:Events;
  document:Events & {visibilityState:string};
  orientation:Events & {matches:boolean};
  context:()=>AudioContext|null;
  output:(context:AudioContext)=>AudioNode;
  soundEnabled:()=>boolean;
  subscribeSound:(listener:()=>void)=>()=>void;
}

// An original 16-bar phrase at 120 BPM: 128 eighth notes / 32 seconds.
const STEP_SECONDS=.25;
const PHRASE_STEPS=128;
const MELODY=[
  [72,76,79,0,76,74,72,0], [76,79,81,79,0,76,74,0],
  [69,72,76,0,79,76,72,0], [71,74,79,0,77,74,71,0],
  [72,77,81,0,79,77,76,0], [74,77,81,79,0,77,74,0],
  [71,74,79,0,81,79,74,0], [76,74,72,0,67,0,72,0],
  [76,79,84,0,81,79,76,0], [79,76,74,72,0,76,79,0],
  [76,79,83,0,81,79,76,0], [74,77,81,0,79,77,74,0],
  [72,77,81,0,84,81,79,0], [74,79,83,81,0,79,74,0],
  [76,79,84,0,79,76,74,0], [72,76,74,0,72,0,0,0],
];
const CHORDS=[
  [48,60,64,67],[48,60,64,67],[45,57,60,64],[43,55,59,62],
  [41,53,57,60],[38,50,53,57],[43,55,59,62],[48,60,64,67],
  [48,60,64,67],[45,57,60,64],[40,52,55,59],[38,50,53,57],
  [41,53,57,60],[43,55,59,62],[48,60,64,67],[48,60,64,67],
];
interface Voice {oscillator:OscillatorNode;gain:GainNode}

/** One owner of all music nodes/timers; leases make concurrent and StrictMode mounts safe. */
export class MusicEngine {
  private leases=new Map<symbol,boolean>();
  private authorized=false;
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private voices=new Set<Voice>();
  private timer:ReturnType<typeof setInterval>|null=null;
  private pendingResume=false;
  private generation=0;
  private step=0;
  private nextTime=0;
  private unsubscribe:(()=>void)|null=null;

  constructor(private env:MusicEnvironment){}

  acquire(enabled:boolean):()=>void {
    const lease=Symbol('music');this.leases.set(lease,enabled);
    if(this.leases.size===1){
      this.env.events.addEventListener('pointerdown',this.gesture,true);
      this.env.events.addEventListener('keydown',this.gesture,true);
      this.env.document.addEventListener('visibilitychange',this.sync);
      this.env.orientation.addEventListener('change',this.sync);
      this.unsubscribe=this.env.subscribeSound(this.sync);
    }
    this.sync();
    return ()=>{
      this.leases.delete(lease);
      if(!this.leases.size){
        this.env.events.removeEventListener('pointerdown',this.gesture,true);
        this.env.events.removeEventListener('keydown',this.gesture,true);
        this.env.document.removeEventListener('visibilitychange',this.sync);
        this.env.orientation.removeEventListener('change',this.sync);
        this.unsubscribe?.();this.unsubscribe=null;
      }
      this.sync();
    };
  }

  private canPlay=()=>this.authorized&&[...this.leases.values()].some(Boolean)&&this.env.soundEnabled()&&this.env.document.visibilityState==='visible'&&!this.env.orientation.matches;

  private gesture=(event:Event)=>{
    if(!event.isTrusted)return;
    this.authorized=true;
    this.sync();
  };

  private sync=()=>{
    if(!this.canPlay()){this.stop();return;}
    if(this.timer!==null||this.pendingResume)return;
    const context=this.context??this.env.context();if(!context)return;
    this.context=context;
    if(context.state==='closed')return;
    if(context.state==='running'){this.start();return;}
    // Called synchronously by the trusted event listener on first activation.
    this.pendingResume=true;
    const generation=++this.generation;
    try{
      void context.resume().then(()=>{
        if(generation!==this.generation)return;
        this.pendingResume=false;
        if(this.canPlay()&&context.state==='running')this.start();
      }).catch(()=>{if(generation===this.generation)this.pendingResume=false;});
    }catch{this.pendingResume=false;}
  };

  private start(){
    const context=this.context;if(!context||this.timer!==null||!this.canPlay())return;
    if(!this.master){this.master=context.createGain();this.master.connect(this.env.output(context));}
    this.master.gain.cancelScheduledValues(context.currentTime);
    this.master.gain.setValueAtTime(.24,context.currentTime);
    this.nextTime=context.currentTime+.03;
    this.tick();
    this.timer=setInterval(()=>this.tick(),100);
  }

  private stop(){
    this.generation++;this.pendingResume=false;
    if(this.timer!==null){clearInterval(this.timer);this.timer=null;}
    if(this.master&&this.context){
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setValueAtTime(0,this.context.currentTime);
    }
    for(const voice of this.voices){
      voice.oscillator.onended=null;
      try{voice.oscillator.stop();}catch{/* Already ended. */}
      voice.oscillator.disconnect();voice.gain.disconnect();
    }
    this.voices.clear();
  }

  private tick(){
    const context=this.context;if(!context||!this.canPlay()||context.state!=='running'){this.stop();return;}
    // Skip missed beats after a stalled tab instead of playing a catch-up burst.
    if(this.nextTime<context.currentTime-.1){
      const missed=Math.ceil((context.currentTime-this.nextTime)/STEP_SECONDS);
      this.step=(this.step+missed)%PHRASE_STEPS;this.nextTime+=missed*STEP_SECONDS;
    }
    while(this.nextTime<context.currentTime+.15){
      const bar=Math.floor(this.step/8),beat=this.step%8,chord=CHORDS[bar],melody=MELODY[bar][beat];
      if(melody)this.pluck(melody,this.nextTime,.32,beat%2?.044:.055,'triangle');
      if(beat===0)chord.slice(1).forEach((note,i)=>this.pluck(note,this.nextTime+i*.018,1.25,.018,'sine'));
      if(beat===0||beat===4)this.pluck(chord[0]+(beat===4?12:0),this.nextTime,.65,.044,'sine');
      this.step=(this.step+1)%PHRASE_STEPS;this.nextTime+=STEP_SECONDS;
    }
  }

  private pluck(note:number,time:number,duration:number,volume:number,type:OscillatorType){
    const context=this.context!,gain=context.createGain(),oscillator=context.createOscillator();
    const voice={oscillator,gain};this.voices.add(voice);
    oscillator.type=type;oscillator.frequency.setValueAtTime(440*2**((note-69)/12),time);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(volume,time+.015);
    gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    oscillator.connect(gain);gain.connect(this.master!);
    oscillator.onended=()=>{this.voices.delete(voice);oscillator.disconnect();gain.disconnect();};
    oscillator.start(time);oscillator.stop(time+duration+.025);
  }
}

let engine:MusicEngine|null=null;
/** Acquire a music lease; the returned cleanup releases only that caller. */
export function acquireBackgroundMusic(enabled:boolean):()=>void {
  if(typeof window==='undefined'||typeof document==='undefined')return ()=>{};
  if(!engine)engine=new MusicEngine({
    events:window,document,orientation:window.matchMedia('(orientation: portrait)'),
    context:getSoundContext,output:getSoundOutput,soundEnabled:isSoundEnabled,subscribeSound:subscribeSoundEnabled,
  });
  return engine.acquire(enabled);
}
