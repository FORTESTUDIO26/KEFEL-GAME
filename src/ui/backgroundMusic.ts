import { isSoundEnabled,subscribeSoundEnabled } from './sound';

interface Events {
  addEventListener:(type:string,listener:(event:Event)=>void,capture?:boolean)=>void;
  removeEventListener:(type:string,listener:(event:Event)=>void,capture?:boolean)=>void;
}
export interface MusicEnvironment {
  events:Events;
  document:Events & {visibilityState:string};
  orientation:Events & {matches:boolean};
  createAudio:()=>HTMLAudioElement;
  soundEnabled:()=>boolean;
  subscribeSound:(listener:()=>void)=>()=>void;
}
const GESTURES=['click','touchend','pointerup','keydown'];

/** One persistent media element; leases keep concurrent/StrictMode mounts safe. */
export class MusicEngine {
  private leases=new Map<symbol,boolean>();
  private authorized=false;
  private media:HTMLAudioElement|null=null;
  private pending=false;
  private unsubscribe:(()=>void)|null=null;
  constructor(private env:MusicEnvironment){}

  acquire(enabled:boolean):()=>void {
    const lease=Symbol('music');this.leases.set(lease,enabled);
    if(this.leases.size===1){
      for(const type of GESTURES)this.env.events.addEventListener(type,this.gesture,true);
      this.env.document.addEventListener('visibilitychange',this.sync);
      this.env.orientation.addEventListener('change',this.sync);
      this.unsubscribe=this.env.subscribeSound(this.sync);
    }
    this.sync();
    return ()=>{
      this.leases.delete(lease);
      if(!this.leases.size){
        for(const type of GESTURES)this.env.events.removeEventListener(type,this.gesture,true);
        this.env.document.removeEventListener('visibilitychange',this.sync);
        this.env.orientation.removeEventListener('change',this.sync);
        this.unsubscribe?.();this.unsubscribe=null;
      }
      this.sync();
    };
  }

  /** Caller must be inside a trusted activation; the public adapter checks this. */
  unlock(reconcileEnabled=false){
    if(reconcileEnabled){
      // The HUD setting changes before React replaces its existing music lease.
      for(const lease of this.leases.keys())this.leases.set(lease,this.env.soundEnabled());
    }
    this.authorized=true;this.sync();
  }
  private gesture=(event:Event)=>{if(event.isTrusted)this.unlock();};
  private canPlay=()=>this.authorized&&[...this.leases.values()].some(Boolean)&&this.env.soundEnabled()&&this.env.document.visibilityState==='visible'&&!this.env.orientation.matches;
  private sync=()=>{
    if(!this.canPlay()){this.media?.pause();return;}
    if(this.pending||this.media&&!this.media.paused)return;
    try{
      if(!this.media){
        this.media=this.env.createAudio();
        this.media.loop=true;this.media.preload='auto';this.media.volume=.45;
      }
      const media=this.media;
      this.pending=true;
      // Do not await loading or defer to an effect: iOS needs play in the gesture.
      void Promise.resolve(media.play()).then(()=>{
        this.pending=false;
        if(!this.canPlay())media.pause();
        else if(media.paused)this.sync();
      },()=>{this.pending=false;}); // Browser denial is retried on the next gesture.
    }catch{this.pending=false;}
  };
}

let engine:MusicEngine|null=null;
function getEngine():MusicEngine|null {
  if(typeof window==='undefined'||typeof document==='undefined')return null;
  if(!engine)engine=new MusicEngine({
    events:window,document,orientation:window.matchMedia('(orientation: portrait)'),
    createAudio:()=>{
      const media=new Audio(`${import.meta.env.BASE_URL}studio-music.wav`);
      media.hidden=true;
      media.setAttribute('data-studio-music','');
      document.body.appendChild(media);
      return media;
    },
    soundEnabled:isSoundEnabled,subscribeSound:subscribeSoundEnabled,
  });
  return engine;
}
/** Call in the HUD click after setSoundEnabled(true); reconcile existing leases before React effects. */
export function unlockBackgroundMusic(reconcileEnabled=true):void {
  if(typeof window==='undefined')return;
  const event=window.event;
  const trustedEvent=event?.isTrusted&&GESTURES.includes(event.type);
  if(!trustedEvent&&!window.navigator?.userActivation?.isActive)return;
  getEngine()?.unlock(reconcileEnabled);
}
/** Acquire a music lease; cleanup releases only that caller. */
export function acquireBackgroundMusic(enabled:boolean):()=>void {
  return getEngine()?.acquire(enabled)??(()=>{});
}
