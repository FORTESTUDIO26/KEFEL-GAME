import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { FurnitureThumb } from '../art/Furniture';
import { RoomBackground } from '../art/Scenes';
import { BACKGROUNDS,furnitureById,paletteById,wearableById } from '../content/catalog';
import { dogById } from '../content/dogs';
import type { GiftRecord } from '../state/types';
import { useStore } from '../state/store';
import { WearableThumb } from './DressingRoom';
import './MissionCelebration.css';
export const CELEBRATION_MS = 3000;

/** Decorative only: ownership stays with the mission reward caller. */
export function CelebrationParticles({ reduced = false }: { reduced?: boolean }) {
 return <div className={`mission-effects${reduced ? ' mission-effects-static' : ''}`} aria-hidden="true">
  {Array.from({length:64},(_,i)=><svg key={i} className={`mission-particle ${i%3===0?'mission-star':'mission-confetti'}`} viewBox="0 0 24 24" style={{'--x':`${(i*37+3)%100}%`,'--y':`${(i*23+8)%85}%`,'--delay':`${i%8*35}ms`,'--drift':`${(i%7-3)*24}px`,'--turn':`${i%2?310:-280}deg`,'--color':['#bd52cf','#167dba','#df8b14','#218a72','#e15b79'][i%5]} as CSSProperties}>
   {i%3===0?<path d="M12 0 15 8 24 12 15 15 12 24 8 15 0 12 8 8Z"/>:i%2?<path d="M3 2H11V22H3Z"/>:<path d="M2 8Q12 0 22 8L19 14Q12 8 5 15Z"/>}
  </svg>)}
 </div>;
}

export function CompletionBurst({ reduced }: { reduced:boolean }) {
 const [visible,setVisible]=useState(true);
 useEffect(()=>{const timer=window.setTimeout(()=>setVisible(false),CELEBRATION_MS);return ()=>window.clearTimeout(timer);},[]);
 if(!visible)return null;
 const particles=<CelebrationParticles reduced={reduced}/>;
 // Portal escapes the reward card's clipping and modal stacking contexts.
 return typeof document==='undefined'?particles:createPortal(particles,document.body);
}
export function MissionCelebration({gift}:{gift:GiftRecord|null}){
 const {save}=useStore();const p=paletteById(save.profile.paletteId);
 const item=gift?(gift.kind==='wearable'?wearableById(gift.id):gift.kind==='furniture'?furnitureById(gift.id):BACKGROUNDS.find(b=>b.id===gift.id)):null;
 return <section className="mission-surprise" aria-label="הפתעת סיום משימה">
  <CompletionBurst key={gift?`${gift.missionId}:${gift.id}`:'collection-complete'} reduced={save.settings.reduceMotion}/>
  <strong>{item?'הפתעה! פריט נדיר חדש שלך':'כל האוסף הנדיר כבר שלך!'}</strong>
  {gift&&item&&<><div className="gift-preview">{gift.kind==='wearable'?<WearableThumb dog={dogById(save.profile.ownDogId)} item={wearableById(gift.id)!}/>:gift.kind==='furniture'?<FurnitureThumb id={gift.id} p={p}/>:<svg viewBox="0 0 800 500" role="img" aria-label={item.name}><RoomBackground wall={BACKGROUNDS.find(b=>b.id===gift.id)?.type==='wall'?gift.id:'wall_plain'} floor={BACKGROUNDS.find(b=>b.id===gift.id)?.type==='floor'?gift.id:'floor_wood'} p={p}/></svg>}</div><span>{item.name}</span><small>נוסף לאוסף שלך · אפשר לעצב איתו מיד</small></>}
 </section>;
}
